import type { RouteResponse } from '../types'

interface PathInfoProps {
  routeData: RouteResponse
}

export default function PathInfo({ routeData }: PathInfoProps) {
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(2)}km`
  }

  const formatDuration = (minutesInput: number): string => {
    // 입력값이 이미 '분' 단위임 (API에서 변환해서 줌)
    const hours = Math.floor(minutesInput / 60)
    const minutes = Math.floor(minutesInput % 60)
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    }
    return `${minutes}분`
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4 ml-1">경로 정보</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl transition-colors hover:bg-gray-100">
          <span className="text-gray-600 font-medium ml-1">거리</span>
          <span className="text-gray-900 font-bold mr-1 text-lg">{formatDistance(routeData.distance)}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl transition-colors hover:bg-gray-100">
          <span className="text-gray-600 font-medium ml-1">예상 시간</span>
          <span className="text-blue-600 font-bold mr-1 text-lg">{formatDuration(routeData.duration)}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl transition-colors hover:bg-gray-100">
          <span className="text-gray-600 font-medium ml-1">경로 포인트</span>
          <span className="text-gray-900 font-bold mr-1">{routeData.pathPoints?.length || 0}개</span>
        </div>
      </div>
    </div>
  )
}
