interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string
  onDownload?: () => void
}

export default function VideoPlayer({ videoUrl, thumbnailUrl, onDownload }: VideoPlayerProps) {
  // YouTube URL에서 ID 추출 (임시 테스트용)
  const getYoutubeId = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const youtubeId = getYoutubeId(videoUrl)

  const handleDownload = () => {
    if (youtubeId) {
      alert('YouTube 영상은 다운로드할 수 없습니다.')
      return
    }

    if (onDownload) {
      onDownload()
    } else {
      // Default download behavior
      const link = document.createElement('a')
      link.href = videoUrl
      link.download = 'streetview-video.mp4'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">생성된 영상</h2>
      
      <div className="mb-4 aspect-video w-full">
        {youtubeId ? (
          <iframe
            className="w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            controls
            className="w-full h-full rounded-lg object-cover"
            poster={thumbnailUrl}
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
            브라우저가 비디오 태그를 지원하지 않습니다.
          </video>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          disabled={!!youtubeId}
          className={`px-6 py-3 rounded-lg font-medium shadow-md transition-colors ${
            youtubeId 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
          }`}
        >
          다운로드
        </button>
      </div>
    </div>
  )
}
