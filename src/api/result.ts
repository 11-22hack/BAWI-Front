import axios from 'axios'
import type { ResultResponse, RouteRequest } from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://hackathon-back.croksuter.com').replace(/\/$/, '')

export const resultApi = {
  getResult: async (params: { id?: string; coords?: RouteRequest }): Promise<ResultResponse> => {
    const queryParams: any = {}
    
    if (params.id) {
      queryParams.id = params.id
    } else if (params.coords) {
      queryParams.startLat = params.coords.start.lat
      queryParams.startLng = params.coords.start.lng
      queryParams.endLat = params.coords.end.lat
      queryParams.endLng = params.coords.end.lng
    }

    const response = await axios.get(`${API_BASE_URL}/get-meta`, {
      params: queryParams,
      responseType: 'blob', // 파일(비디오)을 받기 위해 blob 설정
      validateStatus: (status) => {
        return (status >= 200 && status < 400)
      }
    })

    // [Debug] 백엔드 응답 데이터 확인
    console.log('Result API Response:', response.status, response.headers['content-type'])

    // 1. 비디오 파일이 온 경우 (Content-Type 확인)
    const contentType = response.headers['content-type']
    if (contentType && contentType.startsWith('video/')) {
      // Blob을 URL로 변환
      const videoBlob = new Blob([response.data], { type: contentType })
      const videoUrl = URL.createObjectURL(videoBlob)
      
      return {
        status: 'completed',
        progress: 100,
        videoUrl: videoUrl
      }
    }

    // 2. JSON 응답인지 시도
    let jsonData: any = null
    try {
      const textData = await response.data.text()
      jsonData = JSON.parse(textData)
    } catch (e) {
      // JSON 파싱 실패 -> 아마도 바이너리 파일인데 Content-Type이 video가 아닌 경우 (예: application/octet-stream)
      // 200 OK이고 JSON이 아니면 비디오로 간주
      if (response.status === 200) {
         console.warn('JSON parsing failed, assuming binary video response:', e)
         const videoBlob = new Blob([response.data], { type: 'video/mp4' }) // 기본값 mp4 가정
         const videoUrl = URL.createObjectURL(videoBlob)
         return {
            status: 'completed',
            progress: 100,
            videoUrl: videoUrl
         }
      }
      console.error('Failed to parse JSON response:', e)
      jsonData = {}
    }

    // 201: 진행 중
    if (response.status === 201) {
      return {
        status: 'processing',
        progress: 0,
      }
    }

    // 200: 성공 (영상 생성 완료)
    if (response.status === 200) {
      // JSON 데이터가 있는지 확인
      if (jsonData && jsonData.result && jsonData.result.path) {
         return {
          status: 'completed',
          progress: 100,
          path: jsonData.result.path,
          // videoUrl은 아직 없음 (gen-video 호출 필요)
        }
      }
      
      // 예외 처리: 200인데 예상된 포맷이 아닌 경우
      return {
        status: 'completed',
        progress: 100,
      }
    }

    // 300: 대기 중 (혹시 모르니 유지)
    if (response.status === 300) {
      return {
        status: 'processing',
        progress: 0,
      }
    }

    // 그 외
    return {
      status: 'failed',
      progress: 0,
      error: `서버 응답 오류 (Status: ${response.status})`
    }
  },

  getVideo: async (params: { coords?: RouteRequest }): Promise<Blob> => {
      const queryParams: any = {}
      if (params.coords) {
        queryParams.startLat = params.coords.start.lat
        queryParams.startLng = params.coords.start.lng
        queryParams.endLat = params.coords.end.lat
        queryParams.endLng = params.coords.end.lng
      }

      const response = await axios.get(`${API_BASE_URL}/gen-video`, {
          params: queryParams,
          responseType: 'blob',
      })
      return response.data
  },
}
