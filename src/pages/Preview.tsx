import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import Map from '../components/Map'
import PathInfo from '../components/PathInfo'
import PlaceInput from '../components/PlaceInput'
import { routeApi } from '../api/route'
import { getGoogleRoute } from '../utils/mapUtils'
import { usePolling } from '../hooks/usePolling'
import { resultApi } from '../api/result'
import type { Place, RouteResponse } from '../types'

interface LocationState {
  routeData: RouteResponse
  startPlace: Place
  endPlace: Place
}

// import { metaApi } from '../api/meta' // metaApi 사용 안함

export default function Preview() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Local state
  const [routeData, setRouteData] = useState<RouteResponse | null>(null)
  const [startPlace, setStartPlace] = useState<Place | null>(null)
  const [endPlace, setEndPlace] = useState<Place | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  // [추가] 메타데이터 상태 관리
  const [metaData, setMetaData] = useState<any>(null)

  // Initialize state from location or localStorage
  useEffect(() => {
    let initialState = location.state as LocationState | null

    if (!initialState) {
      try {
        const savedData = localStorage.getItem('previewData')
        if (savedData) {
          initialState = JSON.parse(savedData) as LocationState
          console.log('Restored state from localStorage:', initialState)
        }
      } catch (error) {
        console.error('Failed to parse localStorage data:', error)
      }
    }

    if (initialState && initialState.routeData && initialState.startPlace && initialState.endPlace) {
      setRouteData(initialState.routeData)
      setStartPlace(initialState.startPlace)
      setEndPlace(initialState.endPlace)
      setIsInitialized(true)
    } else {
      setIsInitialized(true)
    }
  }, [location.state])

  // 폴링 시작 (10초 간격, 좌표 기준)
  const { stopPolling } = usePolling(
    () => {
      if (!startPlace || !endPlace) return Promise.reject('No coordinates')
      return resultApi.getResult({
          coords: {
              start: startPlace.coordinates,
              end: endPlace.coordinates
          }
      })
    },
    {
      // 초기화 완료 && 좌표 존재 && 아직 URL 못 받음 -> 폴링 활성화
      enabled: isInitialized && !!startPlace && !!endPlace && !videoUrl,
      interval: 10000, 
      maxAttempts: 1000, // [중요] 10회 제한 설정
      onSuccess: async (data) => {
        // [수정] 완료(completed) 또는 실패(failed) 시 폴링 중단
        
        stopPolling() // 명시적 중단 (200 OK 수신 시 무조건 중단)

        // [추가] 200 OK로 path 데이터 등을 받으면, 즉시 gen-video 호출하여 영상 파일(Blob) 획득
        if (data.path) {
             console.log('Metadata(path) 수신 완료, gen-video 요청 시작...')
             // path 데이터 저장 (지도 그리기용)
             setMetaData((prev: any) => ({ ...prev, path: data.path }))
             
             // [추가] 받아온 path 데이터로 지도 경로 업데이트
             if (data.path && data.path.length > 0) {
               // path 데이터 포맷 변환 필요할 수 있음 (현재 [[lng, lat, ...], ...] 형태일 것으로 추정)
               const newPathPoints = data.path.map((p: any) => ({
                 lat: p[1],
                 lng: p[0]
               }))
               
               setRouteData(prev => {
                 if (!prev) return null
                 return {
                   ...prev,
                   pathPoints: newPathPoints,
                   // polyline은 초기화하여 pathPoints가 우선순위를 갖도록 함
                   polyline: '' 
                 }
               })
             }

             if (startPlace && endPlace) {
              try {
                const videoBlob = await resultApi.getVideo({
                  coords: {
                    start: startPlace.coordinates,
                    end: endPlace.coordinates
                  }
                })
                
                console.log('영상 파일(Blob) 수신 완료', videoBlob.type)
                const videoUrl = URL.createObjectURL(videoBlob)
                setVideoUrl(videoUrl)
                
              } catch (err) {
                console.error('gen-video 요청 실패:', err)
                alert('영상 파일을 받아오는 중 오류가 발생했습니다.')
              }
            }
        }
      },
      onError: (err) => {
          console.error('Polling error:', err)
          // [중요] 횟수 초과 시 처리
          if (err.message === 'Max polling attempts reached') {
              alert('영상 제작에 실패했습니다. (시간 초과)')
              navigate('/')
          }
      }
    }
  )

  const routeMutation = useMutation({
    mutationFn: routeApi.getRoute,
    onSuccess: (data) => {
      setRouteData(data)
      // 경로 바뀌면 URL 초기화하고 다시 폴링 시작될 수 있게 함
      setVideoUrl(null)
      
      if (startPlace && endPlace) {
        const previewData = { routeData: data, startPlace, endPlace }
        localStorage.setItem('previewData', JSON.stringify(previewData))
      }
    },
    onError: async (error: any) => {
      console.error('Route API error:', error)
      if (!startPlace || !endPlace) {
        return
      }
      
      console.log('Attempting to use Google Maps Directions Service...')
      try {
        const googleRouteData = await getGoogleRoute(startPlace.coordinates, endPlace.coordinates)
        console.log('Google route data created:', googleRouteData)
        setRouteData(googleRouteData)
        setVideoUrl(null) // Reset video URL on new route

        const previewData = { routeData: googleRouteData, startPlace, endPlace }
        localStorage.setItem('previewData', JSON.stringify(previewData))
      } catch (googleError) {
        console.error('Google Maps Directions failed:', googleError)
        alert('경로를 찾을 수 없습니다. (Google Maps API 오류)')
      }
    }
  })

  const handleRecalculate = () => {
    if (startPlace && endPlace) {
      routeMutation.mutate({
        start: startPlace.coordinates,
        end: endPlace.coordinates,
      })
    }
  }

  const handleGenerateVideo = () => {
    if (videoUrl) {
      // URL이 준비되었으므로 결과 페이지로 이동
      // ID 없이 URL만 전달
      // [수정] 메타데이터도 함께 전달
      navigate('/result/completed', { state: { videoUrl, metaData } })
    } else {
      // 아직 준비 안 됨
      alert('영상을 준비하는 중입니다. 잠시만 기다려주세요.')
    }
  }

  if (!isInitialized) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">로딩 중...</div>
  }

  if (!routeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">경로 데이터가 없습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#F2F4F6] overflow-hidden flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-6 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full grid-rows-[auto_1fr] lg:grid-rows-none">
          
          {/* Controls & Info (Mobile: Top, PC: Left 25%) */}
          <div className="lg:col-span-1 space-y-5 overflow-y-auto lg:h-full pr-2 custom-scrollbar max-h-[45vh] lg:max-h-none">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center lg:text-left ml-1">
              경로 미리보기
            </h1>

            {/* Location Inputs */}
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
               <h2 className="text-lg font-bold text-gray-900 mb-4 ml-1">경로 수정</h2>
               <div className="space-y-4">
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
                  onClick={handleRecalculate}
                  disabled={routeMutation.isPending || !startPlace || !endPlace}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-2xl hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold shadow-md mt-2"
                >
                  {routeMutation.isPending ? '경로 다시 찾기...' : '경로 다시 찾기'}
                </button>
               </div>
            </div>

            {/* Path Info */}
            <PathInfo routeData={routeData} />
            
            {/* Actions */}
            <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col items-center text-center border border-gray-100">
              <div className="space-y-3 w-full">
                <button
                  onClick={handleGenerateVideo}
                  // 영상 생성 중이면(videoUrl 없음) 버튼은 활성화되어 있지만 누르면 alert
                  // videoUrl 있으면 파란색으로 강조
                  className={`w-full px-6 py-4 rounded-2xl transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center active:scale-[0.98] ${
                    videoUrl 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-500 cursor-wait'
                  }`}
                >
                  {videoUrl ? '영상 재생하기' : '영상 생성 중...'}
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-colors font-bold shadow-sm border-none flex items-center justify-center"
                >
                  처음으로 돌아가기
                </button>
              </div>
              
              {routeMutation.isError && routeData && (
                <div className="mt-4 p-4 bg-blue-50 rounded-2xl text-blue-600 text-sm font-medium flex items-center w-full">
                  <span className="mr-2">ℹ️</span>
                  Google Maps API를 통해 경로를 표시합니다.
                </div>
              )}
            </div>
          </div>

          {/* Map (75%) */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-md overflow-hidden h-full relative border border-gray-100">
            <Map
              start={startPlace?.coordinates}
              end={endPlace?.coordinates}
              polyline={routeData?.polyline}
              pathPoints={routeData?.pathPoints || []}
              className="w-full h-full absolute inset-0"
            />
          </div>

        </div>
      </div>
    </div>
  )
}
