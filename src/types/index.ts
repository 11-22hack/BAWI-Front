export interface Coordinates {
  lat: number
  lng: number
}

export interface Place {
  description: string
  placeId: string
  coordinates: Coordinates
}

export interface RouteRequest {
  start: Coordinates
  end: Coordinates
}

export interface RouteResponse {
  polyline: string
  distance: number // in meters
  duration: number // in seconds
  pathPoints: Coordinates[]
}

export interface GenerateRequest {
  routeId?: string
  pathData?: RouteResponse
}

export interface GenerateResponse {
  requestId: string
}

export interface ResultResponse {
  status: 'processing' | 'collecting' | 'interpolating' | 'rendering' | 'completed' | 'failed'
  progress: number // 0-100
  videoUrl?: string
  error?: string
  path?: any[]
}

export interface MetaDataResponse {
  path: any[]
  [key: string]: any
}
