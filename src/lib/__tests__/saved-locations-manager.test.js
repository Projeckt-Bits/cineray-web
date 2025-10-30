import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock browser APIs before importing the module
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

// Set up global mocks
global.window = mockWindow
global.localStorage = localStorageMock

// Mock navigator with proper descriptor
Object.defineProperty(global, 'navigator', {
  value: { onLine: true },
  writable: true,
  configurable: true
})

// Mock the database service
vi.mock('../database-service.js', () => ({
  savedLocationsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

// Mock the supabase module
vi.mock('../supabase.js', () => ({
  getCurrentUser: vi.fn()
}))

// Now import the module after mocks are set up
const { savedLocationsManager } = await import('../saved-locations-manager.js')

describe('SavedLocationsManager', () => {
  const mockUser = { id: 'user-123' }
  const mockLocation = {
    id: 'loc-123',
    user_id: 'user-123',
    name: 'Test Location',
    latitude: 37.7749,
    longitude: -122.4194,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    global.navigator.onLine = true
  })

  afterEach(() => {
    savedLocationsManager.clearCache()
  })

  describe('getAll', () => {
    it('should fetch locations from server when online', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      const { savedLocationsService } = await import('../database-service.js')
      
      getCurrentUser.mockResolvedValue(mockUser)
      savedLocationsService.getAll.mockResolvedValue([mockLocation])

      const result = await savedLocationsManager.getAll()

      expect(savedLocationsService.getAll).toHaveBeenCalled()
      expect(result).toEqual([mockLocation])
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sun_tracker_saved_locations',
        JSON.stringify([mockLocation])
      )
    })

    it('should return cached locations when offline', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      
      getCurrentUser.mockResolvedValue(mockUser)
      global.navigator.onLine = false
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLocation]))

      const result = await savedLocationsManager.getAll()

      expect(result).toEqual([mockLocation])
    })

    it('should return empty array when user is not authenticated', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      
      getCurrentUser.mockResolvedValue(null)

      const result = await savedLocationsManager.getAll()

      expect(result).toEqual([])
    })

    it('should fallback to cache when server request fails', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      const { savedLocationsService } = await import('../database-service.js')
      
      getCurrentUser.mockResolvedValue(mockUser)
      savedLocationsService.getAll.mockRejectedValue(new Error('Network error'))
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLocation]))

      const result = await savedLocationsManager.getAll()

      expect(result).toEqual([mockLocation])
    })
  })

  describe('create', () => {
    it('should create location on server when online', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      const { savedLocationsService } = await import('../database-service.js')
      
      getCurrentUser.mockResolvedValue(mockUser)
      savedLocationsService.create.mockResolvedValue(mockLocation)
      localStorageMock.getItem.mockReturnValue('[]')

      const result = await savedLocationsManager.create('Test Location', 37.7749, -122.4194)

      expect(savedLocationsService.create).toHaveBeenCalledWith('Test Location', 37.7749, -122.4194)
      expect(result).toEqual(mockLocation)
    })

    it('should validate coordinates', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      
      getCurrentUser.mockResolvedValue(mockUser)

      await expect(
        savedLocationsManager.create('Test', 91, 0)
      ).rejects.toThrow('Latitude must be between -90 and 90 degrees')

      await expect(
        savedLocationsManager.create('Test', 0, 181)
      ).rejects.toThrow('Longitude must be between -180 and 180 degrees')
    })

    it('should save to cache when offline', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      
      getCurrentUser.mockResolvedValue(mockUser)
      global.navigator.onLine = false
      localStorageMock.getItem.mockReturnValue('[]')

      const result = await savedLocationsManager.create('Test Location', 37.7749, -122.4194)

      expect(result.name).toBe('Test Location')
      expect(result.latitude).toBe(37.7749)
      expect(result.longitude).toBe(-122.4194)
      expect(result._pending).toBe(true)
      expect(result.id).toMatch(/^temp_/)
    })

    it('should require authentication', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      
      getCurrentUser.mockResolvedValue(null)

      await expect(
        savedLocationsManager.create('Test', 0, 0)
      ).rejects.toThrow('User must be authenticated to save locations')
    })
  })

  describe('update', () => {
    it('should update location on server when online', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      const { savedLocationsService } = await import('../database-service.js')
      
      const updatedLocation = { ...mockLocation, name: 'Updated Location' }
      getCurrentUser.mockResolvedValue(mockUser)
      savedLocationsService.update.mockResolvedValue(updatedLocation)
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLocation]))

      const result = await savedLocationsManager.update('loc-123', { name: 'Updated Location' })

      expect(savedLocationsService.update).toHaveBeenCalledWith('loc-123', { name: 'Updated Location' })
      expect(result).toEqual(updatedLocation)
    })

    it('should update in cache when offline', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      
      getCurrentUser.mockResolvedValue(mockUser)
      global.navigator.onLine = false
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLocation]))

      const result = await savedLocationsManager.update('loc-123', { name: 'Updated Location' })

      expect(result.name).toBe('Updated Location')
      expect(result._pending).toBe(true)
    })

    it('should validate coordinates in updates', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      
      getCurrentUser.mockResolvedValue(mockUser)

      await expect(
        savedLocationsManager.update('loc-123', { latitude: 91 })
      ).rejects.toThrow('Latitude must be between -90 and 90 degrees')
    })
  })

  describe('delete', () => {
    it('should delete location from server when online', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      const { savedLocationsService } = await import('../database-service.js')
      
      getCurrentUser.mockResolvedValue(mockUser)
      savedLocationsService.delete.mockResolvedValue()
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLocation]))

      await savedLocationsManager.delete('loc-123')

      expect(savedLocationsService.delete).toHaveBeenCalledWith('loc-123')
    })

    it('should mark for deletion when offline', async () => {
      const { getCurrentUser } = await import('../supabase.js')
      
      getCurrentUser.mockResolvedValue(mockUser)
      global.navigator.onLine = false
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLocation]))

      await savedLocationsManager.delete('loc-123')

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sun_tracker_saved_locations',
        expect.stringContaining('"_deleted":true')
      )
    })
  })

  describe('cache management', () => {
    it('should return empty array when cache is expired', () => {
      const expiredTime = Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify([mockLocation]))
        .mockReturnValueOnce(expiredTime.toString())

      const result = savedLocationsManager.getCachedLocations()

      expect(result).toEqual([])
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sun_tracker_saved_locations')
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const result = savedLocationsManager.getCachedLocations()

      expect(result).toEqual([])
    })
  })

  describe('sync status', () => {
    it('should return correct sync status', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([
        { ...mockLocation, _pending: true }
      ]))

      const status = savedLocationsManager.getSyncStatus()

      expect(status.isOnline).toBe(true)
      expect(status.hasPendingChanges).toBe(true)
      expect(status.pendingCount).toBe(1)
    })

    it('should detect pending changes', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([
        { ...mockLocation, _pending: true }
      ]))

      const hasPending = savedLocationsManager.hasPendingChanges()

      expect(hasPending).toBe(true)
    })
  })
})