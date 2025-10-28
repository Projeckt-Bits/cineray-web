/**
 * Geolocation Service
 * Handles browser geolocation API, manual location input, and fallback mechanisms
 */

import { validateCoordinates } from './solar-calculator.js'

/**
 * Geolocation error types
 */
export const GEOLOCATION_ERRORS = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE', 
  TIMEOUT: 'TIMEOUT',
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  NETWORK_ERROR: 'NETWORK_ERROR'
}

/**
 * Custom error class for geolocation errors
 */
export class GeolocationError extends Error {
  constructor(message, code, originalError = null) {
    super(message)
    this.name = 'GeolocationError'
    this.code = code
    this.originalError = originalError
  }
}

/**
 * Default geolocation options
 */
const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000, // 10 seconds
  maximumAge: 300000 // 5 minutes
}

/**
 * Accuracy thresholds in meters
 */
const ACCURACY_THRESHOLDS = {
  HIGH: 100,
  MEDIUM: 1000,
  LOW: 5000
}

/**
 * Gets the current position using browser geolocation API
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} Position object with coordinates and accuracy info
 */
export const getCurrentPosition = async (options = {}) => {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    throw new GeolocationError(
      'Geolocation is not supported by this browser',
      GEOLOCATION_ERRORS.NOT_SUPPORTED
    )
  }

  const geoOptions = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        // Validate coordinates
        if (!validateCoordinates(latitude, longitude)) {
          reject(new GeolocationError(
            'Invalid coordinates received from geolocation API',
            GEOLOCATION_ERRORS.INVALID_COORDINATES
          ))
          return
        }

        // Determine accuracy level
        const accuracyLevel = getAccuracyLevel(accuracy)

        resolve({
          latitude,
          longitude,
          accuracy,
          accuracyLevel,
          timestamp: position.timestamp,
          source: 'browser_geolocation'
        })
      },
      (error) => {
        let errorCode
        let errorMessage

        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorCode = GEOLOCATION_ERRORS.PERMISSION_DENIED
            errorMessage = 'Location access denied by user'
            break
          case 2: // POSITION_UNAVAILABLE
            errorCode = GEOLOCATION_ERRORS.POSITION_UNAVAILABLE
            errorMessage = 'Location information is unavailable'
            break
          case 3: // TIMEOUT
            errorCode = GEOLOCATION_ERRORS.TIMEOUT
            errorMessage = 'Location request timed out'
            break
          default:
            errorCode = GEOLOCATION_ERRORS.NETWORK_ERROR
            errorMessage = 'An unknown error occurred while retrieving location'
        }

        reject(new GeolocationError(errorMessage, errorCode, error))
      },
      geoOptions
    )
  })
}

/**
 * Watches the current position for changes
 * @param {Function} callback - Callback function called with position updates
 * @param {Function} errorCallback - Callback function called with errors
 * @param {Object} options - Geolocation options
 * @returns {number} Watch ID that can be used to clear the watch
 */
export const watchPosition = (callback, errorCallback, options = {}) => {
  if (!navigator.geolocation) {
    errorCallback(new GeolocationError(
      'Geolocation is not supported by this browser',
      GEOLOCATION_ERRORS.NOT_SUPPORTED
    ))
    return null
  }

  const geoOptions = { ...DEFAULT_OPTIONS, ...options }

  return navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords
      
      if (!validateCoordinates(latitude, longitude)) {
        errorCallback(new GeolocationError(
          'Invalid coordinates received from geolocation API',
          GEOLOCATION_ERRORS.INVALID_COORDINATES
        ))
        return
      }

      const accuracyLevel = getAccuracyLevel(accuracy)

      callback({
        latitude,
        longitude,
        accuracy,
        accuracyLevel,
        timestamp: position.timestamp,
        source: 'browser_geolocation'
      })
    },
    (error) => {
      let errorCode
      let errorMessage

      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorCode = GEOLOCATION_ERRORS.PERMISSION_DENIED
          errorMessage = 'Location access denied by user'
          break
        case 2: // POSITION_UNAVAILABLE
          errorCode = GEOLOCATION_ERRORS.POSITION_UNAVAILABLE
          errorMessage = 'Location information is unavailable'
          break
        case 3: // TIMEOUT
          errorCode = GEOLOCATION_ERRORS.TIMEOUT
          errorMessage = 'Location request timed out'
          break
        default:
          errorCode = GEOLOCATION_ERRORS.NETWORK_ERROR
          errorMessage = 'An unknown error occurred while retrieving location'
      }

      errorCallback(new GeolocationError(errorMessage, errorCode, error))
    },
    geoOptions
  )
}

/**
 * Clears a position watch
 * @param {number} watchId - Watch ID returned by watchPosition
 */
export const clearWatch = (watchId) => {
  if (navigator.geolocation && watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
  }
}

/**
 * Validates and normalizes manual location input
 * @param {string|number} latitude - Latitude input
 * @param {string|number} longitude - Longitude input
 * @returns {Object} Validated location object
 */
export const validateManualLocation = (latitude, longitude) => {
  // Convert to numbers
  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)

  // Check for NaN
  if (isNaN(lat) || isNaN(lng)) {
    throw new GeolocationError(
      'Invalid coordinates: latitude and longitude must be valid numbers',
      GEOLOCATION_ERRORS.INVALID_COORDINATES
    )
  }

  // Validate coordinate ranges
  if (!validateCoordinates(lat, lng)) {
    throw new GeolocationError(
      'Invalid coordinates: latitude must be between -90 and 90, longitude must be between -180 and 180',
      GEOLOCATION_ERRORS.INVALID_COORDINATES
    )
  }

  return {
    latitude: lat,
    longitude: lng,
    accuracy: null, // Manual input has no accuracy measurement
    accuracyLevel: 'manual',
    timestamp: Date.now(),
    source: 'manual_input'
  }
}

/**
 * Gets location with fallback mechanisms
 * @param {Object} options - Options for location retrieval
 * @returns {Promise<Object>} Location object
 */
export const getLocationWithFallback = async (options = {}) => {
  const { 
    enableBrowserGeolocation = true,
    fallbackLocation = null,
    timeout = 10000
  } = options

  // Try browser geolocation first if enabled
  if (enableBrowserGeolocation) {
    try {
      return await getCurrentPosition({ timeout })
    } catch (error) {
      console.warn('Browser geolocation failed:', error.message)
      
      // If permission was denied, don't try fallbacks
      if (error.code === GEOLOCATION_ERRORS.PERMISSION_DENIED) {
        throw error
      }
    }
  }

  // Try fallback location if provided
  if (fallbackLocation) {
    try {
      return validateManualLocation(fallbackLocation.latitude, fallbackLocation.longitude)
    } catch (error) {
      console.warn('Fallback location invalid:', error.message)
    }
  }

  // If all methods fail, throw error
  throw new GeolocationError(
    'Unable to determine location using any available method',
    GEOLOCATION_ERRORS.POSITION_UNAVAILABLE
  )
}

/**
 * Checks if geolocation permission is granted
 * @returns {Promise<string>} Permission state: 'granted', 'denied', or 'prompt'
 */
export const checkGeolocationPermission = async () => {
  if (!navigator.permissions) {
    return 'unknown'
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' })
    return permission.state
  } catch (error) {
    console.warn('Unable to check geolocation permission:', error)
    return 'unknown'
  }
}

/**
 * Requests geolocation permission
 * @returns {Promise<boolean>} True if permission granted, false otherwise
 */
export const requestGeolocationPermission = async () => {
  try {
    // Attempt to get position, which will trigger permission request
    await getCurrentPosition({ timeout: 1000 })
    return true
  } catch (error) {
    return error.code !== GEOLOCATION_ERRORS.PERMISSION_DENIED
  }
}

/**
 * Determines accuracy level based on accuracy value
 * @param {number} accuracy - Accuracy in meters
 * @returns {string} Accuracy level: 'high', 'medium', 'low', or 'poor'
 */
export const getAccuracyLevel = (accuracy) => {
  if (accuracy <= ACCURACY_THRESHOLDS.HIGH) {
    return 'high'
  } else if (accuracy <= ACCURACY_THRESHOLDS.MEDIUM) {
    return 'medium'
  } else if (accuracy <= ACCURACY_THRESHOLDS.LOW) {
    return 'low'
  } else {
    return 'poor'
  }
}

/**
 * Formats location for display
 * @param {Object} location - Location object
 * @param {number} precision - Decimal places for coordinates
 * @returns {string} Formatted location string
 */
export const formatLocationForDisplay = (location, precision = 4) => {
  if (!location) return 'Unknown location'

  const lat = location.latitude.toFixed(precision)
  const lng = location.longitude.toFixed(precision)
  
  let display = `${lat}, ${lng}`
  
  if (location.accuracy) {
    display += ` (±${Math.round(location.accuracy)}m)`
  }
  
  return display
}

/**
 * Calculates distance between two locations in meters
 * @param {Object} location1 - First location
 * @param {Object} location2 - Second location
 * @returns {number} Distance in meters
 */
export const calculateDistance = (location1, location2) => {
  const R = 6371000 // Earth's radius in meters
  const lat1Rad = location1.latitude * Math.PI / 180
  const lat2Rad = location2.latitude * Math.PI / 180
  const deltaLatRad = (location2.latitude - location1.latitude) * Math.PI / 180
  const deltaLngRad = (location2.longitude - location1.longitude) * Math.PI / 180

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Checks if a location has moved significantly
 * @param {Object} oldLocation - Previous location
 * @param {Object} newLocation - New location
 * @param {number} threshold - Movement threshold in meters
 * @returns {boolean} True if location has moved significantly
 */
export const hasLocationChanged = (oldLocation, newLocation, threshold = 10) => {
  if (!oldLocation || !newLocation) return true
  
  const distance = calculateDistance(oldLocation, newLocation)
  return distance > threshold
}

/**
 * Gets cached location from localStorage
 * @returns {Object|null} Cached location or null
 */
export const getCachedLocation = () => {
  try {
    const cached = localStorage.getItem('sun_tracker_last_location')
    if (cached) {
      const location = JSON.parse(cached)
      // Check if cache is not too old (1 hour)
      if (Date.now() - location.timestamp < 3600000) {
        return location
      }
    }
  } catch (error) {
    console.warn('Error reading cached location:', error)
  }
  return null
}

/**
 * Caches location to localStorage
 * @param {Object} location - Location to cache
 */
export const cacheLocation = (location) => {
  try {
    localStorage.setItem('sun_tracker_last_location', JSON.stringify(location))
  } catch (error) {
    console.warn('Error caching location:', error)
  }
}

/**
 * Clears cached location
 */
export const clearCachedLocation = () => {
  try {
    localStorage.removeItem('sun_tracker_last_location')
  } catch (error) {
    console.warn('Error clearing cached location:', error)
  }
}