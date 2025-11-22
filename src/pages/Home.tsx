import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import PlaceInput from '../components/PlaceInput'
import Map from '../components/Map'
import { routeApi } from '../api/route'
import { getGoogleRoute } from '../utils/mapUtils'
import type { Place, RouteResponse } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const [startPlace, setStartPlace] = useState<Place | null>(null)
  const [endPlace, setEndPlace] = useState<Place | null>(null)
  const [routeData, setRouteData] = useState<RouteResponse | null>(null)
  const [googleErrorMsg, setGoogleErrorMsg] = useState<string | null>(null)

  const routeMutation = useMutation({
    mutationFn: routeApi.getRoute,
    onSuccess: (data) => {
      setRouteData(data)
      setGoogleErrorMsg(null)
      // localStorage에 저장 (새로고침 대비)
      const previewData = { routeData: data, startPlace, endPlace }
      localStorage.setItem('previewData', JSON.stringify(previewData))
      navigate('/preview', { state: previewData })
    },
    onError: async (error: any) => {
      console.error('Route API error:', error)
      setGoogleErrorMsg(null)
      
      // 백엔드가 없을 경우 Google Maps Directions Service 사용
      if (!startPlace || !endPlace) {
        return
      }

      if (
        error.code === 'ECONNREFUSED' || 
        error.code === 'ERR_NETWORK' ||
        error.code === 'ERR_CONNECTION_REFUSED' ||
        error.response?.status >= 500 || 
        !error.response ||
        error.message?.includes('Network Error')
      ) {
        console.log('Attempting to use Google Maps Directions Service...')
        try {
          const googleRouteData = await getGoogleRoute(startPlace.coordinates, endPlace.coordinates)
          console.log('Google route data created:', googleRouteData)
          setRouteData(googleRouteData)
          
          // localStorage에 저장
          const previewData = { routeData: googleRouteData, startPlace, endPlace }
          localStorage.setItem('previewData', JSON.stringify(previewData))
          
          // 약간의 지연 후 네비게이션
          setTimeout(() => {
            navigate('/preview', { state: previewData })
          }, 100)
        } catch (googleError: any) {
          console.error('Google Maps Directions failed:', googleError)
          setGoogleErrorMsg(googleError?.message || 'Google Maps API 호출 중 알 수 없는 오류가 발생했습니다.')
        }
      } else {
        console.error('Unexpected error type:', error)
        setGoogleErrorMsg(error?.message || '알 수 없는 오류')
      }
    },
  })

  const handleRequestRoute = () => {
    if (!startPlace || !endPlace) {
      alert('출발지와 도착지를 모두 입력해주세요.')
      return
    }

    routeMutation.mutate({
      start: startPlace.coordinates,
      end: endPlace.coordinates,
    })
  }

  return (
    <div className="h-screen flex flex-col bg-[#F2F4F6] overflow-hidden">
      {/* Full screen container */}
      <div className="flex-1 relative w-full h-full">
        {/* Map Background - PC에서는 전체 화면 */}
        <div className="absolute inset-0 z-0 w-full h-full">
           <Map
            start={startPlace?.coordinates}
            end={endPlace?.coordinates}
            polyline={routeData?.polyline}
            pathPoints={routeData?.pathPoints}
            className="w-full h-full"
          />
        </div>

        {/* Floating Input Panel */}
        <div className="absolute top-0 left-0 w-full lg:w-auto lg:top-8 lg:left-8 z-10 p-4 lg:p-0 pointer-events-none">
            {/* Card itself enables pointer events */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 pointer-events-auto w-full lg:w-[420px] border-none">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center lg:text-left ml-1">
                  3D Pathfinding
                </h1>
                <div className="space-y-5">
                  <PlaceInput
                    label="출발지"
                    value={startPlace}
                    onChange={setStartPlace}
                    placeholder="출발지를 입력하세요"
                  />
                  <PlaceInput
                    label="도착지"
                    value={endPlace}
                    onChange={setEndPlace}
                    placeholder="도착지를 입력하세요"
                  />
                  <button
                    onClick={handleRequestRoute}
                    disabled={routeMutation.isPending || !startPlace || !endPlace}
                    className="w-full px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl mt-4 active:scale-[0.98]"
                  >
                    {routeMutation.isPending ? '경로 요청 중...' : '경로 요청하기'}
                  </button>
                  
                  {/* Error / Info Messages */}
                  {routeMutation.isError && !routeData && (
                    <div className="p-4 bg-red-50 rounded-2xl text-red-600 text-sm font-medium">
                      <p className="font-bold mb-1">경로를 찾을 수 없습니다.</p>
                      <p className="text-xs opacity-80">
                         {googleErrorMsg || '백엔드 및 Google Maps 연결 실패'}
                      </p>
                    </div>
                  )}
                  {routeMutation.isError && routeData && (
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 text-sm font-medium flex items-center">
                      <span className="mr-2 text-lg">ℹ️</span>
                      Google Maps API를 통해 경로를 표시합니다.
                    </div>
                  )}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
