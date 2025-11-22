import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import VideoPlayer from '../components/VideoPlayer'
import { resultApi } from '../api/result'
import { metaApi } from '../api/meta'

export default function Result() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Preview에서 넘겨준 videoUrl 확인
  const stateVideoUrl = location.state?.videoUrl
  const [videoUrl, setVideoUrl] = useState<string | null>(stateVideoUrl || null)

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['result', id],
    queryFn: () => resultApi.getResult({ id }),
    enabled: !!id && !stateVideoUrl,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 2000
    },
  })

  // 메타데이터 조회 (videoUrl이 있고 blob URL이 아닐 때만)
  const isBlobUrl = videoUrl?.startsWith('blob:')
  
  const { data: metaData } = useQuery({
    queryKey: ['meta', videoUrl],
    queryFn: () => metaApi.getMeta(videoUrl!),
    enabled: !!videoUrl && !isBlobUrl // Blob URL이면 메타데이터 조회 스킵
  })

  useEffect(() => {
    if (result?.status === 'completed' && result.videoUrl) {
      setVideoUrl(result.videoUrl)
    }
  }, [result])

  // 이미 URL이 있으면 로딩 스킵
  if (stateVideoUrl) {
     // 바로 렌더링으로 넘어감
  } else if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!stateVideoUrl && (isError || result?.status === 'failed')) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md mx-auto text-center border border-gray-100">
          <div className="text-red-500 text-4xl mb-4">✗</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-6">
            {result?.error || '영상 생성 중 오류가 발생했습니다.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-bold shadow-md"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (!videoUrl) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">영상을 준비하는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2F4F6] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2 font-medium"
          >
            <span>←</span> 홈으로 돌아가기
          </button>
        </div>
        
        <VideoPlayer videoUrl={videoUrl} />

        {/* 메타데이터 표시 */}
        {metaData && (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">상세 경로 데이터</h3>
            <div className="bg-gray-50 rounded-2xl p-6 overflow-x-auto border border-gray-200 custom-scrollbar">
              <pre className="text-xs text-gray-600 font-mono leading-relaxed">
                {JSON.stringify(metaData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
