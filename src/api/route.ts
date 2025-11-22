import axios from 'axios'
import type { RouteRequest, RouteResponse } from '../types'

// API Base URL Normalization
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hackathon-back.croksuter.com'
const API_BASE_URL = rawBaseUrl.replace(/\/navigate\/?$/, '').replace(/\/$/, '')

// 백엔드 응답 타입 정의 (내부용)
interface BackendRouteResponse {
  path: number[][] // [[lng, lat, alt?], ...]
  raw: Array<{
    type: string
    geometry: any
    properties: {
      totalDistance?: number
      totalTime?: number
      pointType?: string
      [key: string]: any
    }
  }>
}

export const routeApi = {
  getRoute: async (data: RouteRequest): Promise<RouteResponse> => {
    // GET /navigate?startLat=...&startLng=...&endLat=...&endLng=...
    // TODO: 추후 백엔드 API 변경 시 아래 URL로 교체 필요 (/gen-video)
    const response = await axios.get<BackendRouteResponse>(`${API_BASE_URL}/gen-video`, {
    //const response = await axios.get<BackendRouteResponse>(`${API_BASE_URL}/navigate`, {
      params: {
        startLat: data.start.lat,
        startLng: data.start.lng,
        endLat: data.end.lat,
        endLng: data.end.lng
      }
    })
    
    const backendData = response.data
    
    // 백엔드 데이터를 프론트엔드 포맷(RouteResponse)으로 변환
    
    // 1. Path Points: [lng, lat] -> {lat, lng}
    const pathPoints = backendData.path.map(p => ({
      lat: p[1],
      lng: p[0]
    }))

    // 2. Distance & Duration 찾기
    // raw 배열 중 Point 타입이면서 Start Point(SP)인 항목에 전체 요약 정보가 있음
    const summaryFeature = backendData.raw.find(
      f => f.geometry.type === 'Point' && f.properties.pointType === 'SP'
    ) || backendData.raw[0] // 못 찾으면 첫 번째 요소 사용

    const distance = summaryFeature?.properties?.totalDistance || 0
    const durationSeconds = summaryFeature?.properties?.totalTime || 0
    
    // 시간 계산 로직 개선:
    // 서버 시간이 유효하면(30초 초과) 사용, 아니면 거리 기반(80m/분)으로 계산
    let durationMinutes = 0
    if (durationSeconds > 30) {
      durationMinutes = Math.ceil(durationSeconds / 60)
    } else {
      // 도보 속도 약 4.8km/h = 80m/min
      durationMinutes = Math.max(1, Math.ceil(distance / 80))
    }
    
    return {
      polyline: '', // pathPoints가 있으므로 polyline 문자열은 비워둠 (Map 컴포넌트가 pathPoints 우선 사용)
      distance: distance,
      duration: durationMinutes,
      pathPoints: pathPoints
    }
  },
}
