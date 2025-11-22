import { useEffect, useRef, useState } from 'react'
import type { Coordinates } from '../types'

interface MapProps {
  center?: Coordinates
  start?: Coordinates
  end?: Coordinates
  polyline?: string
  pathPoints?: Coordinates[]
  className?: string
}

export default function Map({
  center = { lat: 37.5530, lng: 126.9390 }, // 서강대학교 본관 중심
  start,
  end,
  polyline,
  pathPoints,
  className = 'w-full h-full',
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null) // google.maps.Map
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentZoom, setCurrentZoom] = useState(16) // 줌 레벨 약간 확대
  const markersRef = useRef<google.maps.Marker[]>([]) // google.maps.Marker[]
  const polylineRef = useRef<google.maps.Polyline | null>(null) // google.maps.Polyline
  const boundaryPolygonRef = useRef<google.maps.Polygon | null>(null) // google.maps.Polygon
  const hasFittedBoundsRef = useRef(false) // fitBounds가 실행되었는지 추적
  const lastPathDataRef = useRef<string>('') // 마지막 경로 데이터 추적

  useEffect(() => {
    const apiKey = 'AIzaSyCdswSPRMnfpxUSyjcfpQu152ENQ-l8j0g';

    // // Check if API key is set
    // if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    //   setError('Google Maps API 키가 설정되지 않았습니다. .env 파일에 VITE_GOOGLE_MAPS_API_KEY를 설정해주세요.')
    //   return
    // }

    // Load Google Maps script
    if (window.google?.maps) {
      setIsLoaded(true)
      setError(null)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap`
    script.async = true
    script.defer = true

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    window.initMap = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      setIsLoaded(true)
      setError(null)
    }

    script.onerror = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      setError('Google Maps 스크립트를 불러오는 중 오류가 발생했습니다. API 키와 네트워크 연결을 확인해주세요.')
    }

    // 타임아웃 설정 (10초)
    timeoutId = setTimeout(() => {
      if (!window.google?.maps) {
        setError('Google Maps 로드 시간이 초과되었습니다. API 키가 올바른지, 필요한 API가 활성화되었는지 확인해주세요.')
      }
    }, 10000)

    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google?.maps) return

    // Initialize map
    if (!mapInstanceRef.current) {
      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 15,
          // 기본 컨트롤 활성화
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_CENTER,
          },
          mapTypeControl: true,
          mapTypeControlOptions: {
            position: window.google.maps.ControlPosition.TOP_RIGHT,
            style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          },
          streetViewControl: true,
          streetViewControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_TOP,
          },
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_TOP,
          },
          // 제스처 및 인터랙션 설정 - 확실하게 작동하도록
          gestureHandling: 'auto',
          draggable: true,
          scrollwheel: true,
          disableDoubleClickZoom: false,
          keyboardShortcuts: true,
          // 확대/축소 범위
          minZoom: 3,
          maxZoom: 20,
          // 기타 설정
          disableDefaultUI: false,
          clickableIcons: true,
        })

        // 확대/축소 레벨 변경 감지
        mapInstanceRef.current.addListener('zoom_changed', () => {
          if (mapInstanceRef.current) {
            setCurrentZoom(mapInstanceRef.current.getZoom() || 13)
          }
        })

        // 초기 zoom 레벨 설정
        setCurrentZoom(mapInstanceRef.current.getZoom() || 13)
      } catch (err) {
        console.error('Map initialization error:', err)
        setError(`지도 초기화 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
        return
      }
    }

    const map = mapInstanceRef.current

    // Draw 마포구 전체 경계 (서강대학교가 모두 보이도록)
    // 기존 polygon이 있으면 제거하고 다시 그리기
    if (boundaryPolygonRef.current) {
      boundaryPolygonRef.current.setMap(null)
      boundaryPolygonRef.current = null
    }

    // 서강대학교 캠퍼스 경계 (정문 알바트로스 탑 기준 안쪽으로 조정)
    const sogangBoundary = [
      { lat: 37.5515, lng: 126.9378 }, // 정문 알바트로스 탑 앞
      { lat: 37.5518, lng: 126.9360 }, // 정문 서쪽 담장 라인
      { lat: 37.5530, lng: 126.9350 }, // 서강대역 방향 쪽문
      { lat: 37.5545, lng: 126.9345 }, // 와우산로 방향 담장
      { lat: 37.5570, lng: 126.9350 }, // 노고산 공원 서쪽
      { lat: 37.5590, lng: 126.9380 }, // 곤자가 국제학사 뒤편
      { lat: 37.5585, lng: 126.9430 }, // 후문 라인
      { lat: 37.5560, lng: 126.9460 }, // 동문 라인 (대흥로 안쪽)
      { lat: 37.5520, lng: 126.9450 }, // 동쪽 담장
      { lat: 37.5500, lng: 126.9440 }, // 로욜라 언덕 아래
      { lat: 37.5495, lng: 126.9410 }, // 남문 인근 (운동장 아래)
      { lat: 37.5515, lng: 126.9378 }, // 정문으로 복귀
    ]

    try {
      boundaryPolygonRef.current = new window.google.maps.Polygon({
        paths: sogangBoundary,
        strokeColor: '#FF0000', // 빨간색
        strokeOpacity: 1.0,
        strokeWeight: 4, // 적당히 굵게
        fillColor: '#FF0000',
        fillOpacity: 0.05, // 내부는 흐리게
        map,
        zIndex: 1, // 배경에 표시
      })
      console.log('서강대학교 경계 polygon 생성 완료')
    } catch (error) {
      console.error('서강대학교 경계 polygon 생성 오류:', error)
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (marker) {
        marker.setMap(null)
      }
    })
    markersRef.current = []

    // Add start marker - 크고 눈에 띄게
    if (start && map && window.google?.maps) {
      try {
        console.log('Creating start marker at:', start)
        const startPosition = new window.google.maps.LatLng(start.lat, start.lng)

        const startMarker = new window.google.maps.Marker({
          position: startPosition,
          map: map,
          label: {
            text: '출발',
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: 'bold',
          },
          title: '출발지',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 30, // 더 크게
            fillColor: '#10B981',
            fillOpacity: 1.0,
            strokeColor: '#FFFFFF',
            strokeWeight: 6, // 테두리 더 두껍게
          },
          zIndex: 1000,
          optimized: false, // 최적화 비활성화로 확실한 표시
          animation: window.google.maps.Animation.DROP,
        })

        // 마커가 지도에 확실히 표시되도록 보장
        startMarker.setMap(map)
        markersRef.current.push(startMarker)
        console.log('Start marker created and set on map:', startMarker.getPosition()?.toJSON())
      } catch (error) {
        console.error('Error creating start marker:', error)
      }
    } else {
      console.warn('Cannot create start marker:', { start, map: !!map, google: !!window.google?.maps })
    }

    // Add end marker - 크고 눈에 띄게
    if (end && map && window.google?.maps) {
      try {
        console.log('Creating end marker at:', end)
        const endPosition = new window.google.maps.LatLng(end.lat, end.lng)

        const endMarker = new window.google.maps.Marker({
          position: endPosition,
          map: map,
          label: {
            text: '도착',
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: 'bold',
          },
          title: '도착지',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 30, // 더 크게
            fillColor: '#EF4444',
            fillOpacity: 1.0,
            strokeColor: '#FFFFFF',
            strokeWeight: 6, // 테두리 더 두껍게
          },
          zIndex: 1000,
          optimized: false, // 최적화 비활성화로 확실한 표시
          animation: window.google.maps.Animation.DROP,
        })

        // 마커가 지도에 확실히 표시되도록 보장
        endMarker.setMap(map)
        markersRef.current.push(endMarker)
        console.log('End marker created and set on map:', endMarker.getPosition()?.toJSON())
      } catch (error) {
        console.error('Error creating end marker:', error)
      }
    } else {
      console.warn('Cannot create end marker:', { end, map: !!map, google: !!window.google?.maps })
    }

    // Draw polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }

    // 경로 데이터가 변경되었는지 확인
    const currentPathData = polyline || (pathPoints ? JSON.stringify(pathPoints) : '')
    const pathChanged = currentPathData !== lastPathDataRef.current

    if (pathChanged) {
      lastPathDataRef.current = currentPathData
      hasFittedBoundsRef.current = false // 새로운 경로이므로 fitBounds 허용
    }

    if (polyline || pathPoints) {
      const hasPathPoints = pathPoints && pathPoints.length > 0

      if (hasPathPoints || (polyline && polyline.length > 0)) {
        const path = hasPathPoints
          ? pathPoints!.map((p) => new window.google.maps.LatLng(p.lat, p.lng))
          : window.google.maps.geometry?.encoding?.decodePath(polyline!) || []

        console.log('Drawing polyline with path length:', path.length)

        polylineRef.current = new window.google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#3B82F6',
          strokeOpacity: 1.0,
          strokeWeight: 4,
          map,
        })
      }

      // Fit bounds to show entire route (경로가 새로 생성되었을 때만 실행)
      if (start && end && !hasFittedBoundsRef.current) {
        hasFittedBoundsRef.current = true
        setTimeout(() => {
          const bounds = new window.google.maps.LatLngBounds()
          bounds.extend(new window.google.maps.LatLng(start.lat, start.lng))
          bounds.extend(new window.google.maps.LatLng(end.lat, end.lng))
          if (pathPoints && pathPoints.length > 0) {
            pathPoints.forEach((p) => {
              bounds.extend(new window.google.maps.LatLng(p.lat, p.lng))
            })
          }
          // 패딩 추가
          map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
        }, 200)
      }
    } else if (start && end) {
      // Fit bounds to markers (출발/도착지가 모두 있을 때 항상 실행)
      // 경로가 아직 없는 상태이므로 사용자가 위치를 확인할 수 있게 조정
      setTimeout(() => {
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend(new window.google.maps.LatLng(start.lat, start.lng))
        bounds.extend(new window.google.maps.LatLng(end.lat, end.lng))
        map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 })
      }, 200)
    } else if (start) {
      // Start만 있는 경우 - 항상 해당 위치로 이동 및 확대
      setTimeout(() => {
        const pos = new window.google.maps.LatLng(start.lat, start.lng)
        map.panTo(pos)
        map.setZoom(17)
      }, 200)
    } else if (end) {
      // End만 있는 경우 - 항상 해당 위치로 이동 및 확대
      setTimeout(() => {
        const pos = new window.google.maps.LatLng(end.lat, end.lng)
        map.panTo(pos)
        map.setZoom(17)
      }, 200)
    } else {
      // 기본 화면 - 확대/축소가 확실히 작동하도록 설정
      // 초기 로드 시에만 센터 설정 (사용자가 이동한 경우 유지)
      if (!hasFittedBoundsRef.current && currentZoom === 13) { // 초기 상태일 때만
        map.setCenter(center)
        map.setZoom(15)
      }
    }

    // 모든 경우에 확대/축소 및 이동이 작동하도록 보장 (항상 실행)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        scrollwheel: true,
        gestureHandling: 'auto',
        draggable: true,
        zoomControl: true,
        disableDoubleClickZoom: false,
        keyboardShortcuts: true,
      })
    }
  }, [isLoaded, center, start, end, polyline, pathPoints, currentZoom])

  if (error) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] lg:min-h-[400px] bg-gray-100 rounded-lg p-4">
          <div className="text-red-600 font-medium mb-2 text-lg">⚠️ 지도를 불러올 수 없습니다</div>
          <div className="text-sm text-gray-700 text-center max-w-md mb-4">{error}</div>

          <div className="bg-white rounded-lg p-4 max-w-md w-full text-left text-xs text-gray-600 space-y-2 border border-gray-300">
            <div className="font-semibold text-gray-800 mb-2">확인 사항:</div>
            <div>1. Google Cloud Console에서 다음 API가 활성화되었는지 확인:</div>
            <div className="ml-4">• Maps JavaScript API</div>
            <div className="ml-4">• Places API</div>
            <div className="ml-4">• Maps Geocoding API (선택)</div>
            <div className="mt-2">2. API 키 제한 설정 확인:</div>
            <div className="ml-4">• HTTP 리퍼러에 <code className="bg-gray-100 px-1 rounded">http://localhost:5173/*</code> 추가</div>
            <div className="ml-4">• 또는 개발 중에는 "제한 없음"으로 설정</div>
            <div className="mt-2">3. 브라우저 콘솔(F12)에서 자세한 에러 확인</div>
            <div className="mt-2 text-amber-600">💡 API 키는 Google Cloud Platform에서 발급받은 키여야 합니다.</div>
          </div>

          {(start || end) && (
            <div className="mt-4 text-xs text-gray-500">
              {start && `출발지: ${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}`}
              {start && end && ' | '}
              {end && `도착지: ${end.lat.toFixed(4)}, ${end.lng.toFixed(4)}`}
            </div>
          )}
        </div>
      </div>
    )
  }

  const handleFitBounds = () => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current
    const bounds = new window.google.maps.LatLngBounds()

    if (start) bounds.extend(start)
    if (end) bounds.extend(end)
    if (pathPoints && pathPoints.length > 0) {
      pathPoints.forEach((p) => bounds.extend(p))
    }

    if (start || end || (pathPoints && pathPoints.length > 0)) {
      map.fitBounds(bounds)
      // 약간의 패딩 추가
      const padding = 50
      map.fitBounds(bounds, padding)
    } else {
      map.setCenter(center)
      map.setZoom(13)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[300px] lg:min-h-[400px] rounded-lg" />

      {/* 커스텀 컨트롤 버튼들 */}
      {isLoaded && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {/* 경로로 맞추기 버튼 */}
          {(start || end || pathPoints) && (
            <button
              onClick={handleFitBounds}
              className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-md border border-gray-300 flex items-center gap-2 transition-colors"
              title="경로로 맞추기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="text-xs">경로 맞추기</span>
            </button>
          )}

          {/* 확대/축소 레벨 표시 (제거됨) */}
        </div>
      )}

      {/* 커스텀 확대/축소 버튼 제거됨 - 기본 zoomControl 사용 */}

      {!isLoaded && (
        <div className="flex items-center justify-center w-full h-full min-h-[300px] lg:min-h-[400px] bg-gray-100 rounded-lg">
          <div className="text-gray-500">지도를 불러오는 중...</div>
        </div>
      )}
    </div>
  )
}
