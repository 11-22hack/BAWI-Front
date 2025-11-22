import { useEffect, useRef } from 'react'

interface UsePollingOptions {
  enabled: boolean
  interval?: number
  maxAttempts?: number
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions
) {
  const { enabled, interval = 2000, maxAttempts, onSuccess, onError } = options
  const timeoutRef = useRef<any>(null)
  const isPollingRef = useRef(false)
  const attemptsRef = useRef(0)

  const savedFetchFn = useRef(fetchFn)
  const savedOnSuccess = useRef(onSuccess)
  const savedOnError = useRef(onError)

  useEffect(() => {
    savedFetchFn.current = fetchFn
    savedOnSuccess.current = onSuccess
    savedOnError.current = onError
  }, [fetchFn, onSuccess, onError])

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      isPollingRef.current = false
      return
    }

    // 이미 폴링 중이면 재시작하지 않음 (이 부분이 핵심)
    // 하지만 enabled가 토글되면 재시작되어야 함.
    // 여기서는 간단히: enabled가 true로 바뀔 때만 시작하도록 구성.
    
    isPollingRef.current = true
    attemptsRef.current = 0

    const poll = async () => {
      if (!isPollingRef.current) return

      if (maxAttempts && attemptsRef.current >= maxAttempts) {
        console.warn(`[Polling] Max attempts (${maxAttempts}) reached. Stopping.`)
        savedOnError.current?.(new Error('Max polling attempts reached'))
        isPollingRef.current = false
        return
      }

      attemptsRef.current += 1
      
      try {
        console.log(`[Polling] Requesting... (${new Date().toLocaleTimeString()}) - Attempt ${attemptsRef.current}/${maxAttempts || 'Inf'}`)
        const data = await savedFetchFn.current()
        savedOnSuccess.current?.(data)

        if (isPollingRef.current) {
          timeoutRef.current = setTimeout(poll, interval)
        }
      } catch (error) {
        savedOnError.current?.(error as Error)
        if (isPollingRef.current) {
          timeoutRef.current = setTimeout(poll, interval)
        }
      }
    }

    poll()

    return () => {
      isPollingRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [enabled, interval, maxAttempts]) // fetchFn 등은 의존성에서 제거됨


  const stopPolling = () => {
    isPollingRef.current = false
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  return { stopPolling }
}
