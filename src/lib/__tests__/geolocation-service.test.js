import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCurrentPosition,
  validateManualLocation,
  getLocationWithFallback,
  checkGeolocationPermission,
  getAccuracyLevel,
  formatLocationForDisplay,
  calculateDistance,
  hasLocationChanged,
  getCachedLocation,
  cacheLocation,
  clearCachedLocation,
  GeolocationError,
  GEOLOCATION_ERRORS
} from '../geolocation-service.js'

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
}

// Mock navigator.permissions
const mockPermissions = {
  query: vi.fn()
}

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

describe('Geolocation Service', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup navigator mocks
    Object.defineProperty(global, 'navigator', {
      value: {
        geolocation: mockGeolocation,
        permissions: mockPermissions
      },
      writable: true
    })
    
    // Setup localStorage mock
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getCurrentPosition', () => {
    it('should get current position successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 50
        },
        timestamp: Date.now()
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      const result = await getCurrentPosition()

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 50,
        accuracyLevel: 'high',
        timestamp: mockPosition.timestamp,
        source: 'browser_geolocation'
      })
    })

    it('should handle permission denied error', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation'
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      await expect(getCurrentPosition()).rejects.toThrow(GeolocationError)
      await expect(getCurrentPosition()).rejects.toThrow('Location access denied by user')
    })

    it('should handle position unavailable error', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable'
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      await expect(getCurrentPosition()).rejects.toThrow(GeolocationError)
      await expect(getCurrentPosition()).rejects.toThrow('Location information is unavailable')
    })

    it('should handle timeout error', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        message: 'Timeout'
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      await expect(getCurrentPosition()).rejects.toThrow(GeolocationError)
      await expect(getCurrentPosition()).rejects.toThrow('Location request timed out')
    })

    it('should throw error when geolocation is not supported', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true
      })

      await expect(getCurrentPosition()).rejects.toThrow(GeolocationError)
      await expect(getCurrentPosition()).rejects.toThrow('Geolocation is not supported by this browser')
    })

    it('should validate coordinates from geolocation API', async () => {
      const mockPosition = {
        coords: {
          latitude: 200, // Invalid latitude
          longitude: -74.0060,
          accuracy: 50
        },
        timestamp: Date.now()
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      await expect(getCurrentPosition()).rejects.toThrow(GeolocationError)
      await expect(getCurrentPosition()).rejects.toThrow('Invalid coordinates received from geolocation API')
    })
  })

  describe('validateManualLocation', () => {
    it('should validate correct coordinates', () => {
      const result = validateManualLocation(40.7128, -74.0060)
      
      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: null,
        accuracyLevel: 'manual',
        timestamp: expect.any(Number),
        source: 'manual_input'
      })
    })

    it('should validate string coordinates', () => {
      const result = validateManualLocation('40.7128', '-74.0060')
      
      expect(result.latitude).toBe(40.7128)
      expect(result.longitude).toBe(-74.0060)
    })

    it('should throw error for invalid latitude', () => {
      expect(() => validateManualLocation(100, -74.0060))
        .toThrow('Invalid coordinates: latitude must be between -90 and 90')
    })

    it('should throw error for invalid longitude', () => {
      expect(() => validateManualLocation(40.7128, 200))
        .toThrow('Invalid coordinates: latitude must be between -90 and 90, longitude must be between -180 and 180')
    })

    it('should throw error for NaN values', () => {
      expect(() => validateManualLocation('invalid', -74.0060))
        .toThrow('Invalid coordinates: latitude and longitude must be valid numbers')
    })
  })

  describe('getLocationWithFallback', () => {
    it('should use browser geolocation first', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 50
        },
        timestamp: Date.now()
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      const result = await getLocationWithFallback()
      
      expect(result.source).toBe('browser_geolocation')
      expect(result.latitude).toBe(40.7128)
    })

    it('should use fallback location when browser geolocation fails', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable'
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      const fallbackLocation = { latitude: 51.5074, longitude: -0.1278 }
      const result = await getLocationWithFallback({
        fallbackLocation
      })

      expect(result.source).toBe('manual_input')
      expect(result.latitude).toBe(51.5074)
      expect(result.longitude).toBe(-0.1278)
    })

    it('should throw error when permission denied and no fallback', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'Permission denied'
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      await expect(getLocationWithFallback()).rejects.toThrow(GeolocationError)
    })

    it('should throw error when all methods fail', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable'
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      await expect(getLocationWithFallback()).rejects.toThrow('Unable to determine location using any available method')
    })
  })

  describe('checkGeolocationPermission', () => {
    it('should return permission state', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'granted' })

      const result = await checkGeolocationPermission()
      expect(result).toBe('granted')
    })

    it('should return unknown when permissions API not available', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { geolocation: mockGeolocation },
        writable: true
      })

      const result = await checkGeolocationPermission()
      expect(result).toBe('unknown')
    })

    it('should handle permission query error', async () => {
      mockPermissions.query.mockRejectedValue(new Error('Permission error'))

      const result = await checkGeolocationPermission()
      expect(result).toBe('unknown')
    })
  })

  describe('getAccuracyLevel', () => {
    it('should return high accuracy for values <= 100', () => {
      expect(getAccuracyLevel(50)).toBe('high')
      expect(getAccuracyLevel(100)).toBe('high')
    })

    it('should return medium accuracy for values <= 1000', () => {
      expect(getAccuracyLevel(500)).toBe('medium')
      expect(getAccuracyLevel(1000)).toBe('medium')
    })

    it('should return low accuracy for values <= 5000', () => {
      expect(getAccuracyLevel(2000)).toBe('low')
      expect(getAccuracyLevel(5000)).toBe('low')
    })

    it('should return poor accuracy for values > 5000', () => {
      expect(getAccuracyLevel(10000)).toBe('poor')
    })
  })

  describe('formatLocationForDisplay', () => {
    it('should format location with default precision', () => {
      const location = { latitude: 40.712812, longitude: -74.006015 }
      const result = formatLocationForDisplay(location)
      expect(result).toBe('40.7128, -74.0060')
    })

    it('should format location with custom precision', () => {
      const location = { latitude: 40.712812, longitude: -74.006015 }
      const result = formatLocationForDisplay(location, 2)
      expect(result).toBe('40.71, -74.01')
    })

    it('should include accuracy when available', () => {
      const location = { 
        latitude: 40.7128, 
        longitude: -74.0060, 
        accuracy: 50 
      }
      const result = formatLocationForDisplay(location)
      expect(result).toBe('40.7128, -74.0060 (±50m)')
    })

    it('should handle null location', () => {
      const result = formatLocationForDisplay(null)
      expect(result).toBe('Unknown location')
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two locations', () => {
      const location1 = { latitude: 40.7128, longitude: -74.0060 } // New York
      const location2 = { latitude: 34.0522, longitude: -118.2437 } // Los Angeles
      
      const distance = calculateDistance(location1, location2)
      
      // Distance should be approximately 3944 km (3,944,000 meters)
      expect(distance).toBeGreaterThan(3900000)
      expect(distance).toBeLessThan(4000000)
    })

    it('should return 0 for same location', () => {
      const location = { latitude: 40.7128, longitude: -74.0060 }
      const distance = calculateDistance(location, location)
      expect(distance).toBe(0)
    })
  })

  describe('hasLocationChanged', () => {
    it('should return true when locations differ significantly', () => {
      const location1 = { latitude: 40.7128, longitude: -74.0060 }
      const location2 = { latitude: 40.7130, longitude: -74.0062 }
      
      const changed = hasLocationChanged(location1, location2, 10)
      expect(changed).toBe(true)
    })

    it('should return false when locations are within threshold', () => {
      const location1 = { latitude: 40.7128, longitude: -74.0060 }
      const location2 = { latitude: 40.71281, longitude: -74.00601 }
      
      const changed = hasLocationChanged(location1, location2, 10)
      expect(changed).toBe(false)
    })

    it('should return true when one location is null', () => {
      const location = { latitude: 40.7128, longitude: -74.0060 }
      
      expect(hasLocationChanged(null, location)).toBe(true)
      expect(hasLocationChanged(location, null)).toBe(true)
    })
  })

  describe('location caching', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockLocalStorage.setItem.mockImplementation(() => {})
      mockLocalStorage.removeItem.mockImplementation(() => {})
    })

    it('should cache location', () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now()
      }

      cacheLocation(location)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sun_tracker_last_location',
        JSON.stringify(location)
      )
    })

    it('should retrieve cached location', () => {
      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now()
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(location))

      const result = getCachedLocation()
      expect(result).toEqual(location)
    })

    it('should return null for expired cache', () => {
      const expiredLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now() - 7200000 // 2 hours ago
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredLocation))

      const result = getCachedLocation()
      expect(result).toBeNull()
    })

    it('should handle invalid cached data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')

      const result = getCachedLocation()
      expect(result).toBeNull()
    })

    it('should clear cached location', () => {
      clearCachedLocation()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sun_tracker_last_location')
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const location = { latitude: 40.7128, longitude: -74.0060 }
      
      // Should not throw
      expect(() => cacheLocation(location)).not.toThrow()
    })
  })
})