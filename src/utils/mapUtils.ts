import type { Coordinates, RouteResponse } from '../types'

// Helper for linear distance (Haversine)
const calculateLinearDistance = (start: Coordinates, end: Coordinates): number => {
  const R = 6371000 // Earth radius in meters
  const dLat = (end.lat - start.lat) * Math.PI / 180
  const dLng = (end.lng - start.lng) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const getGoogleRoute = async (
  start: Coordinates,
  end: Coordinates
): Promise<RouteResponse> => {
  if (!window.google?.maps) {
    throw new Error('Google Maps API not loaded')
  }

  const directionsService = new window.google.maps.DirectionsService()

  // Helper function to request route with specific mode
  const requestRoute = (mode: google.maps.TravelMode): Promise<RouteResponse> => {
    return new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: { lat: start.lat, lng: start.lng },
          destination: { lat: end.lat, lng: end.lng },
          travelMode: mode,
        },
        (result: any, status: any) => {
          if (status === 'OK' && result) {
            const route = result.routes[0]
            const leg = route.legs[0]

            const overviewPolyline = route.overview_polyline
            const pathPoints: Coordinates[] = []
            if (route.overview_path) {
               route.overview_path.forEach((p: any) => {
                 pathPoints.push({ lat: p.lat(), lng: p.lng() })
               })
            }

            const distance = leg.distance?.value || 0
            const duration = leg.duration?.value || 0

            resolve({
              polyline: overviewPolyline,
              distance,
              duration: Math.max(1, Math.ceil(duration / 60)),
              pathPoints
            })
          } else {
            reject(new Error(`Directions request failed: ${status}`))
          }
        }
      )
    })
  }

  // Try WALKING first, then DRIVING, then Linear fallback
  try {
    return await requestRoute(window.google.maps.TravelMode.WALKING)
  } catch (error: unknown) {
    console.warn('Walking route failed:', error)

    // If failed with ZERO_RESULTS (no walking path found), try DRIVING
    if (error instanceof Error && error.message && error.message.includes('ZERO_RESULTS')) {
      try {
        return await requestRoute(window.google.maps.TravelMode.DRIVING)
      } catch (drivingError: unknown) {
        console.warn('Driving route failed:', drivingError)

        // If driving also fails with ZERO_RESULTS (likely very close), fallback to linear path
        if (drivingError instanceof Error && drivingError.message && drivingError.message.includes('ZERO_RESULTS')) {
          console.log('Fallback to linear path due to ZERO_RESULTS')

          const distance = calculateLinearDistance(start, end)

          // For very short distances, create a simple straight line path
          // Add a few intermediate points for smoother visualization if needed
          const pathPoints = [start, end]

          return {
            polyline: '', // Empty polyline string, Map component will use pathPoints
            distance: Math.round(distance),
            duration: Math.max(1, Math.round(distance / 80)), // Approx 80m/min walking speed
            pathPoints: pathPoints
          }
        }
        throw drivingError
      }
    }
    throw error
  }
}
