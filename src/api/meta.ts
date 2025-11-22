import axios from 'axios'
import type { MetaDataResponse, RouteRequest } from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://hackathon-back.croksuter.com').replace(/\/$/, '')

export const metaApi = {
  getMeta: async (params: { url?: string; coords?: RouteRequest }): Promise<MetaDataResponse> => {
    const queryParams: any = {}

    if (params.url) {
      queryParams.url = params.url
    }
    
    if (params.coords) {
      queryParams.startLat = params.coords.start.lat
      queryParams.startLng = params.coords.start.lng
      queryParams.endLat = params.coords.end.lat
      queryParams.endLng = params.coords.end.lng
    }

    const response = await axios.get<MetaDataResponse>(`${API_BASE_URL}/get-meta`, {
      params: queryParams
    })
    return response.data
  },
}

