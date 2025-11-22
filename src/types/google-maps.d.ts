// Google Maps 타입 정의
declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions)
      setCenter(latlng: LatLng | LatLngLiteral): void
      setZoom(zoom: number): void
      getZoom(): number | undefined
      fitBounds(bounds: LatLngBounds, padding?: number | Padding): void
      setOptions(options: MapOptions): void
    }
    
    class Marker {
      constructor(options?: MarkerOptions)
      setMap(map: Map | null): void
      getPosition(): LatLng | undefined
    }
    
    class Polyline {
      constructor(options?: PolylineOptions)
      setMap(map: Map | null): void
    }
    
    class Polygon {
      constructor(options?: PolygonOptions)
      setMap(map: Map | null): void
    }
    
    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
      toJSON(): { lat: number; lng: number }
    }
    
    class LatLngBounds {
      constructor()
      extend(latlng: LatLng | LatLngLiteral): void
    }
    
    interface MapOptions {
      center?: LatLng | LatLngLiteral
      zoom?: number
      zoomControl?: boolean
      zoomControlOptions?: ZoomControlOptions
      mapTypeControl?: boolean
      mapTypeControlOptions?: MapTypeControlOptions
      streetViewControl?: boolean
      streetViewControlOptions?: StreetViewControlOptions
      fullscreenControl?: boolean
      fullscreenControlOptions?: FullscreenControlOptions
      gestureHandling?: string
      draggable?: boolean
      scrollwheel?: boolean
      disableDoubleClickZoom?: boolean
      keyboardShortcuts?: boolean
      minZoom?: number
      maxZoom?: number
      disableDefaultUI?: boolean
      clickableIcons?: boolean
    }
    
    interface MarkerOptions {
      position?: LatLng | LatLngLiteral
      map?: Map | null
      label?: string | MarkerLabel
      title?: string
      icon?: Icon | string
      zIndex?: number
      optimized?: boolean
      animation?: Animation
    }
    
    interface PolylineOptions {
      path?: LatLng[] | LatLngLiteral[]
      geodesic?: boolean
      strokeColor?: string
      strokeOpacity?: number
      strokeWeight?: number
      map?: Map | null
    }
    
    interface PolygonOptions {
      paths?: LatLng[] | LatLngLiteral[] | LatLng[][] | LatLngLiteral[][]
      strokeColor?: string
      strokeOpacity?: number
      strokeWeight?: number
      fillColor?: string
      fillOpacity?: number
      map?: Map | null
      zIndex?: number
    }
    
    interface LatLngLiteral {
      lat: number
      lng: number
    }
    
    interface MarkerLabel {
      text: string
      color?: string
      fontSize?: string
      fontWeight?: string
    }
    
    interface Icon {
      path?: SymbolPath | string
      scale?: number
      fillColor?: string
      fillOpacity?: number
      strokeColor?: string
      strokeWeight?: number
    }
    
    enum ControlPosition {
      TOP_CENTER = 2,
      TOP_LEFT = 1,
      TOP_RIGHT = 3,
      LEFT_TOP = 5,
      RIGHT_TOP = 4,
      LEFT_CENTER = 7,
      RIGHT_CENTER = 9,
      LEFT_BOTTOM = 6,
      RIGHT_BOTTOM = 8,
      BOTTOM_CENTER = 11,
      BOTTOM_LEFT = 10,
      BOTTOM_RIGHT = 12,
    }
    
    enum MapTypeControlStyle {
      HORIZONTAL_BAR = 0,
      DROPDOWN_MENU = 1,
      DEFAULT = 2,
    }
    
    enum SymbolPath {
      CIRCLE = 0,
      FORWARD_CLOSED_ARROW = 1,
      FORWARD_OPEN_ARROW = 2,
      BACKWARD_CLOSED_ARROW = 3,
      BACKWARD_OPEN_ARROW = 4,
    }
    
    enum Animation {
      BOUNCE = 1,
      DROP = 2,
    }
    
    interface ZoomControlOptions {
      position?: ControlPosition
    }
    
    interface MapTypeControlOptions {
      position?: ControlPosition
      style?: MapTypeControlStyle
    }
    
    interface StreetViewControlOptions {
      position?: ControlPosition
    }
    
    interface FullscreenControlOptions {
      position?: ControlPosition
    }
    
    interface Padding {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }
    
    namespace places {
      class Autocomplete {
        constructor(inputField: HTMLInputElement, options?: AutocompleteOptions)
        getPlace(): PlaceResult
        addListener(event: string, handler: () => void): void
      }
      
      interface AutocompleteOptions {
        componentRestrictions?: ComponentRestrictions
        fields?: string[]
        types?: string[]
        bounds?: LatLngBounds
        strictBounds?: boolean
      }
      
      interface ComponentRestrictions {
        country?: string | string[]
      }
      
      interface PlaceResult {
        place_id?: string
        formatted_address?: string
        name?: string
        geometry?: {
          location?: LatLng
        }
      }
    }
    
    namespace geometry {
      namespace encoding {
        function decodePath(encodedPath: string): LatLng[]
      }
    }
    
    namespace event {
      function clearInstanceListeners(instance: any): void
    }
  }
}

declare global {
  interface Window {
    google: typeof google
    initMap: () => void
  }
}

export {}

