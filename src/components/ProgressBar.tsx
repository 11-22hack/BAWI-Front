interface ProgressBarProps {
  progress: number // 0-100
  className?: string
}

export default function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      <div className="mt-1 text-sm text-gray-600 text-right">{clampedProgress}%</div>
    </div>
  )
}

