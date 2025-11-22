import { useEffect, useRef, useState } from 'react'
import type { Place } from '../types'

interface PlaceInputProps {
  label: string
  value: Place | null
  onChange: (place: Place | null) => void
  placeholder?: string
}

declare global {
  interface Window {
    google: typeof google
  }
}

export default function PlaceInput({
  label,
  value,
  onChange,
  placeholder = '주소 또는 장소를 입력하세요',
}: PlaceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [manualInput, setManualInput] = useState('')

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    // Check if API key is set
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      setHasApiKey(false)
      return
    }

    setHasApiKey(true)

    // Check if Google Maps is already loaded
    const checkGoogleMaps = () => {
      if (window.google?.maps?.places?.Autocomplete) {
        setIsLoaded(true)
        return true
      }
      return false
    }

    // Immediately check if already loaded
    if (checkGoogleMaps()) {
      return
    }

    // Wait for Google Maps to load (check periodically)
    let checkInterval: any = null
    let maxAttempts = 100 // 최대 10초 대기
    let attempts = 0

    checkInterval = setInterval(() => {
      attempts++
      if (checkGoogleMaps()) {
        if (checkInterval) clearInterval(checkInterval)
        return
      }
      
      if (attempts >= maxAttempts) {
        console.warn('Google Maps Places API load timeout')
        if (checkInterval) clearInterval(checkInterval)
      }
    }, 100)

    // Also check if script is loading
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
    if (existingScript) {
      // Script exists, wait for it to load
      existingScript.addEventListener('load', () => {
        setTimeout(() => {
          if (checkGoogleMaps() && checkInterval) {
            clearInterval(checkInterval)
          }
        }, 500)
      })
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    }
  }, [])

  useEffect(() => {
    // Wait for Google Maps to be fully loaded
    if (!isLoaded || !inputRef.current) {
      return
    }

    // Double check that Google Maps Places is available
    if (!window.google?.maps?.places?.Autocomplete) {
      console.warn('Google Maps Places Autocomplete not available yet')
      return
    }

    // Clean up existing autocomplete
    if (autocompleteRef.current) {
      try {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      } catch (e) {
        console.warn('Error clearing autocomplete listeners:', e)
      }
      autocompleteRef.current = null
    }

    // Initialize autocomplete with a small delay to ensure DOM is ready
    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places?.Autocomplete) {
        return
      }

      try {
        console.log('Initializing Autocomplete for:', label)
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            componentRestrictions: { country: 'kr' }, // South Korea
            fields: ['place_id', 'formatted_address', 'geometry', 'name'],
            types: ['geocode', 'establishment'], // 주소 및 장소 모두
          }
        )

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace()
          console.log('Place selected:', place)
          if (place?.place_id && place.geometry?.location) {
            // 건물 이름(name)을 최우선으로 사용, 없으면 주소 사용
            const displayName = place.name || place.formatted_address || ''
            
            onChange({
              description: displayName,
              placeId: place.place_id,
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
            })
            // Update manual input to show selected address
            setManualInput(displayName)
          }
        })

        console.log('Autocomplete initialized successfully for:', label)
      } catch (error) {
        console.error('Error initializing Autocomplete:', error)
      }
    }

    // Small delay to ensure everything is ready
    const timeoutId = setTimeout(initAutocomplete, 100)

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      if (autocompleteRef.current) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        } catch (e) {
          console.warn('Error in cleanup:', e)
        }
        autocompleteRef.current = null
      }
    }
  }, [isLoaded, onChange, label])

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value?.description || manualInput}
        onChange={(e) => {
          const inputValue = e.target.value
          setManualInput(inputValue)
          
          if (!inputValue) {
            onChange(null)
            return
          }

          // If no API key, try to parse coordinates manually
          if (!hasApiKey) {
            const coordMatch = inputValue.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
            if (coordMatch) {
              const lat = parseFloat(coordMatch[1])
              const lng = parseFloat(coordMatch[2])
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                onChange({
                  description: `${lat}, ${lng}`,
                  placeId: `manual_${lat}_${lng}`,
                  coordinates: { lat, lng },
                })
              }
            }
          }
          // If API key exists, autocomplete will handle the selection
        }}
        placeholder={hasApiKey ? placeholder : '좌표를 직접 입력하세요 (예: 37.5665, 126.9780)'}
        className="w-full px-5 py-4 bg-gray-100 hover:bg-gray-50 border-none rounded-2xl text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
        autoComplete="off"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => {
            const place = {
              description: '서강대학교 정문',
              placeId: 'custom_sogang_main',
              coordinates: { lat: 37.55170007108464, lng: 126.93787942756467 }
            }
            onChange(place)
            setManualInput(place.description)
          }}
          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-full text-xs transition-colors flex items-center gap-1 shadow-sm"
        >
          📍 서강대 정문
        </button>
      </div>
      {!hasApiKey && (
        <div className="mt-2 text-xs text-amber-600">
          ⚠️ API 키가 없어 자동완성이 비활성화되었습니다. 좌표를 직접 입력하세요 (예: 37.5665, 126.9780)
        </div>
      )}
      {value && (
        <div className="mt-2 text-xs text-gray-500">
          좌표: {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
        </div>
      )}
    </div>
  )
}

