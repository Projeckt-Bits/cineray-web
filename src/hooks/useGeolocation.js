'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getCurrentPosition,
  watchPosition,
  clearWatch,
  validateManualLocation,
  getLocationWithFallback,
  checkGeolocationPermission,
  requestGeolocationPermission,
  getCachedLocation,
  cacheLocation,
  hasLocationChanged,
  GeolocationError,
  GEOLOCATION_ERRORS
} from '../lib/geolocation-service.js'

/**
 * Custom hook for geolocation functionality
 * @param {Object} options - Hook options
 * @returns {Object} Geolocation state and methods
 */
export const useGeolocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000,
    enableWatch = false,
    enableCache = true,
    autoRequest = false
  } = options

  // State
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [permission, setPermission] = useState('unknown')
  const [accuracy, setAccuracy] = useState(null)

  // Refs
  const watchIdRef = useRef(null)
  const mountedRef = useRef(true)

  // Geolocation options
  const geoOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge
  }

  /**
   * Updates location state safely (only if component is mounted)
   */
  const updateLocation = useCallback((newLocation) => {
    if (!mountedRef.current) return

    setLocation(prevLocation => {
      // Only update if location has changed significantly
      if (!prevLocation || hasLocationChanged(prevLocation, newLocation)) {
        if (enableCache) {
          cacheLocation(newLocation)
        }
        return newLocation
      }
      return prevLocation
    })
    setAccuracy(newLocation.accuracy)
    setError(null)
  }, [enableCache])

  /**
   * Updates error state safely
   */
  const updateError = useCallback((newError) => {
    if (!mountedRef.current) return
    setError(newError)
    setLoading(false)
  }, [])

  /**
   * Checks geolocation permission
   */
  const checkPermission = useCallback(async () => {
    try {
      const permissionState = await checkGeolocationPermission()
      if (mountedRef.current) {
        setPermission(permissionState)
      }
      return permissionState
    } catch (error) {
      console.warn('Error checking geolocation permission:', error)
      return 'unknown'
    }
  }, [])

  /**
   * Requests current position
   */
  const requestLocation = useCallback(async (customOptions = {}) => {
    if (!mountedRef.current) return null

    setLoading(true)
    setError(null)

    try {
      const position = await getCurrentPosition({ ...geoOptions, ...customOptions })
      updateLocation(position)
      setLoading(false)
      return position
    } catch (error) {
      updateError(error)
      return null
    }
  }, [geoOptions, updateLocation, updateError])

  /**
   * Requests location with fallback mechanisms
   */
  const requestLocationWithFallback = useCallback(async (fallbackOptions = {}) => {
    if (!mountedRef.current) return null

    setLoading(true)
    setError(null)

    try {
      const position = await getLocationWithFallback({
        ...geoOptions,
        ...fallbackOptions
      })
      updateLocation(position)
      setLoading(false)
      return position
    } catch (error) {
      updateError(error)
      return null
    }
  }, [geoOptions, updateLocation, updateError])

  /**
   * Sets location manually
   */
  const setManualLocation = useCallback(async (latitude, longitude) => {
    if (!mountedRef.current) return null

    setLoading(true)
    setError(null)

    try {
      const position = validateManualLocation(latitude, longitude)
      updateLocation(position)
      setLoading(false)
      return position
    } catch (error) {
      updateError(error)
      return null
    }
  }, [updateLocation, updateError])

  /**
   * Starts watching position
   */
  const startWatching = useCallback(() => {
    if (!mountedRef.current || watchIdRef.current !== null) return

    const watchId = watchPosition(
      updateLocation,
      updateError,
      geoOptions
    )

    watchIdRef.current = watchId
    return watchId
  }, [geoOptions, updateLocation, updateError])

  /**
   * Stops watching position
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  /**
   * Requests permission for geolocation
   */
  const requestPermission = useCallback(async () => {
    try {
      const granted = await requestGeolocationPermission()
      await checkPermission()
      return granted
    } catch (error) {
      updateError(error)
      return false
    }
  }, [checkPermission, updateError])

  /**
   * Clears current location and error
   */
  const clearLocation = useCallback(() => {
    if (!mountedRef.current) return
    setLocation(null)
    setError(null)
    setAccuracy(null)
  }, [])

  /**
   * Refreshes current location
   */
  const refreshLocation = useCallback(async () => {
    return await requestLocation()
  }, [requestLocation])

  // Initialize hook
  useEffect(() => {
    mountedRef.current = true

    // Check permission on mount
    checkPermission()

    // Load cached location if enabled
    if (enableCache) {
      const cached = getCachedLocation()
      if (cached && !location) {
        setLocation(cached)
        setAccuracy(cached.accuracy)
      }
    }

    // Auto-request location if enabled
    if (autoRequest && !location) {
      requestLocation()
    }

    // Start watching if enabled
    if (enableWatch) {
      startWatching()
    }

    return () => {
      mountedRef.current = false
      stopWatching()
    }
  }, []) // Only run on mount

  // Handle watch option changes
  useEffect(() => {
    if (enableWatch && watchIdRef.current === null) {
      startWatching()
    } else if (!enableWatch && watchIdRef.current !== null) {
      stopWatching()
    }
  }, [enableWatch, startWatching, stopWatching])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching()
    }
  }, [stopWatching])

  return {
    // State
    location,
    loading,
    error,
    permission,
    accuracy,
    
    // Computed state
    isSupported: typeof navigator !== 'undefined' && !!navigator.geolocation,
    hasLocation: !!location,
    isWatching: watchIdRef.current !== null,
    
    // Methods
    requestLocation,
    requestLocationWithFallback,
    setManualLocation,
    startWatching,
    stopWatching,
    requestPermission,
    checkPermission,
    clearLocation,
    refreshLocation,
    
    // Utilities
    isPermissionGranted: permission === 'granted',
    isPermissionDenied: permission === 'denied',
    isHighAccuracy: accuracy && accuracy <= 100,
    
    // Error helpers
    isPermissionError: error?.code === GEOLOCATION_ERRORS.PERMISSION_DENIED,
    isTimeoutError: error?.code === GEOLOCATION_ERRORS.TIMEOUT,
    isUnavailableError: error?.code === GEOLOCATION_ERRORS.POSITION_UNAVAILABLE,
    isNotSupportedError: error?.code === GEOLOCATION_ERRORS.NOT_SUPPORTED
  }
}

/**
 * Hook for simple one-time location request
 * @param {Object} options - Hook options
 * @returns {Object} Simplified geolocation state
 */
export const useCurrentLocation = (options = {}) => {
  const {
    location,
    loading,
    error,
    requestLocation,
    setManualLocation,
    isSupported,
    hasLocation
  } = useGeolocation({ ...options, enableWatch: false })

  return {
    location,
    loading,
    error,
    requestLocation,
    setManualLocation,
    isSupported,
    hasLocation
  }
}

/**
 * Hook for watching location changes
 * @param {Object} options - Hook options
 * @returns {Object} Location watching state
 */
export const useLocationWatcher = (options = {}) => {
  const geolocation = useGeolocation({ ...options, enableWatch: true })

  return {
    ...geolocation,
    // Additional methods specific to watching
    toggleWatching: geolocation.isWatching ? geolocation.stopWatching : geolocation.startWatching
  }
}