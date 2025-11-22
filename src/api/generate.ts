import axios from 'axios'
import type { GenerateResponse } from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://hackathon-back.croksuter.com').replace(/\/$/, '')

export const generateApi = {
  // data: { pathData: RouteResponse }
  generateVideo: async (data: { pathData: any }): Promise<GenerateResponse> => {
    const { pathPoints } = data.pathData

    // 프론트엔드 포맷({lat, lng})을 백엔드 포맷([[lng, lat], ...])으로 변환
    // 주의: GeoJSON 순서는 [경도(lng), 위도(lat)] 입니다.
    const formattedPath = pathPoints.map((p: any) => [p.lng, p.lat])

    console.log(`Sending request to /generate with ${formattedPath.length} points`)

    // POST /generate { "path": [[127..., 37...], ...] }
    const response = await axios.post<GenerateResponse>(`${API_BASE_URL}/generate`, {
      path: formattedPath
    })
    return response.data
  },
}
