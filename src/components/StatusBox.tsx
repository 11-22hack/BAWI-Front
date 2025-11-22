import type { ResultResponse } from '../types'
import ProgressBar from './ProgressBar'

interface StatusBoxProps {
  status: ResultResponse['status']
  progress: number
  error?: string
}

const statusMessages: Record<ResultResponse['status'], string> = {
  processing: '경로 분석 중...',
  collecting: 'StreetView 프레임 수집 중...',
  interpolating: 'AI 보간 사용 중...',
  rendering: '영상 렌더링 중...',
  completed: '영상 렌더링 완료!',
  failed: '오류가 발생했습니다.',
}

export default function StatusBox({ status, progress, error }: StatusBoxProps) {
  const isCompleted = status === 'completed'
  const isFailed = status === 'failed'

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6 max-w-md mx-auto">
      <div className="flex items-center justify-center mb-4">
        {!isCompleted && !isFailed && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
        )}
        {isCompleted && (
          <div className="text-green-500 text-2xl mr-3">✓</div>
        )}
        {isFailed && (
          <div className="text-red-500 text-2xl mr-3">✗</div>
        )}
        <h2 className="text-xl font-semibold text-gray-800">
          {statusMessages[status]}
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {!isCompleted && !isFailed && (
        <ProgressBar progress={progress} />
      )}

      {isCompleted && (
        <div className="text-center text-green-600 font-medium">
          영상이 성공적으로 생성되었습니다!
        </div>
      )}
    </div>
  )
}

