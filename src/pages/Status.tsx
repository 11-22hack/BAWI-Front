import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { usePolling } from '../hooks/usePolling'
import { resultApi } from '../api/result'
import StatusBox from '../components/StatusBox'
import type { ResultResponse } from '../types'

export default function Status() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestId = searchParams.get('id')
  const [result, setResult] = useState<ResultResponse | null>(null)

  const { stopPolling } = usePolling(
    () => resultApi.getResult(requestId!),
    {
      enabled: !!requestId,
      interval: 10000,
      onSuccess: (data: ResultResponse) => {
        setResult(data)
        if (data.status === 'completed' && data.videoUrl) {
          stopPolling()
          navigate(`/result/${requestId}`)
        } else if (data.status === 'failed') {
          stopPolling()
        }
      },
      onError: (error) => {
        console.error('Polling error:', error)
      },
    }
  )

  useEffect(() => {
    if (!requestId) {
      navigate('/')
    }
  }, [requestId, navigate])

  if (!requestId || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <StatusBox
        status={result.status}
        progress={result.progress}
        error={result.error}
      />
    </div>
  )
}

