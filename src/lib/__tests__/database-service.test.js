import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn()
  }
}

// Mock the supabase module
vi.mock('../supabase.js', () => ({
  supabase: mockSupabase,
  getCurrentUser: vi.fn()
}))

// Import services after mocking
const { savedLocationsService, notificationPreferencesService, authService } = await import('../database-service.js')
const { getCurrentUser } = await import('../supabase.js')

describe('Database Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
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
    getCurrentUser.mockResolvedValue(mockUser)
  })

  describe('savedLocationsService', () => {
    describe('getAll', () => {
      it('should fetch all saved locations for authenticated user', async () => {
        const mockSelect = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockLocation],
            error: null
          })
        })
        
        mockSupabase.from.mockReturnValue({
          select: mockSelect
        })

        const result = await savedLocationsService.getAll()

        expect(mockSupabase.from).toHaveBeenCalledWith('saved_locations')
        expect(mockSelect).toHaveBeenCalledWith('*')
        expect(result).toEqual([mockLocation])
      })

      it('should throw error when user is not authenticated', async () => {
        getCurrentUser.mockResolvedValue(null)

        await expect(savedLocationsService.getAll()).rejects.toThrow(
          'User must be authenticated to access saved locations'
        )
      })

      it('should handle database errors', async () => {
        const dbError = new Error('Database connection failed')
        
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: dbError
            })
          })
        })

        await expect(savedLocationsService.getAll()).rejects.toThrow(dbError)
      })

      it('should return empty array when no locations found', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })

        const result = await savedLocationsService.getAll()
        expect(result).toEqual([])
      })
    })

    describe('create', () => {
      it('should create a new location with valid data', async () => {
        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockLocation,
              error: null
            })
          })
        })

        mockSupabase.from.mockReturnValue({
          insert: mockInsert
        })

        const result = await savedLocationsService.create('Test Location', 37.7749, -122.4194)

        expect(mockSupabase.from).toHaveBeenCalledWith('saved_locations')
        expect(mockInsert).toHaveBeenCalledWith([{
          user_id: 'user-123',
          name: 'Test Location',
          latitude: 37.7749,
          longitude: -122.4194
        }])
        expect(result).toEqual(mockLocation)
      })

      it('should validate latitude bounds', async () => {
        await expect(
          savedLocationsService.create('Test', 91, 0)
        ).rejects.toThrow('Latitude must be between -90 and 90 degrees')

        await expect(
          savedLocationsService.create('Test', -91, 0)
        ).rejects.toThrow('Latitude must be between -90 and 90 degrees')
      })

      it('should validate longitude bounds', async () => {
        await expect(
          savedLocationsService.create('Test', 0, 181)
        ).rejects.toThrow('Longitude must be between -180 and 180 degrees')

        await expect(
          savedLocationsService.create('Test', 0, -181)
        ).rejects.toThrow('Longitude must be between -180 and 180 degrees')
      })

      it('should trim location name', async () => {
        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockLocation,
              error: null
            })
          })
        })

        mockSupabase.from.mockReturnValue({
          insert: mockInsert
        })

        await savedLocationsService.create('  Test Location  ', 37.7749, -122.4194)

        expect(mockInsert).toHaveBeenCalledWith([{
          user_id: 'user-123',
          name: 'Test Location',
          latitude: 37.7749,
          longitude: -122.4194
        }])
      })

      it('should convert string coordinates to numbers', async () => {
        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockLocation,
              error: null
            })
          })
        })

        mockSupabase.from.mockReturnValue({
          insert: mockInsert
        })

        await savedLocationsService.create('Test', '37.7749', '-122.4194')

        expect(mockInsert).toHaveBeenCalledWith([{
          user_id: 'user-123',
          name: 'Test',
          latitude: 37.7749,
          longitude: -122.4194
        }])
      })

      it('should require authentication', async () => {
        getCurrentUser.mockResolvedValue(null)

        await expect(
          savedLocationsService.create('Test', 0, 0)
        ).rejects.toThrow('User must be authenticated to save locations')
      })
    })

    describe('update', () => {
      it('should update location with valid data', async () => {
        const updatedLocation = { ...mockLocation, name: 'Updated Location' }
        
        mockSupabase.from.mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedLocation,
                  error: null
                })
              })
            })
          })
        })

        const result = await savedLocationsService.update('loc-123', { name: 'Updated Location' })

        expect(result).toEqual(updatedLocation)
      })

      it('should validate coordinate updates', async () => {
        await expect(
          savedLocationsService.update('loc-123', { latitude: 91 })
        ).rejects.toThrow('Latitude must be between -90 and 90 degrees')

        await expect(
          savedLocationsService.update('loc-123', { longitude: 181 })
        ).rejects.toThrow('Longitude must be between -180 and 180 degrees')
      })

      it('should require authentication', async () => {
        getCurrentUser.mockResolvedValue(null)

        await expect(
          savedLocationsService.update('loc-123', { name: 'Updated' })
        ).rejects.toThrow('User must be authenticated to update locations')
      })
    })

    describe('delete', () => {
      it('should delete location successfully', async () => {
        mockSupabase.from.mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null
            })
          })
        })

        await expect(savedLocationsService.delete('loc-123')).resolves.toBeUndefined()
      })

      it('should require authentication', async () => {
        getCurrentUser.mockResolvedValue(null)

        await expect(
          savedLocationsService.delete('loc-123')
        ).rejects.toThrow('User must be authenticated to delete locations')
      })

      it('should handle database errors', async () => {
        const dbError = new Error('Delete failed')
        
        mockSupabase.from.mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: dbError
            })
          })
        })

        await expect(savedLocationsService.delete('loc-123')).rejects.toThrow(dbError)
      })
    })
  })

  describe('notificationPreferencesService', () => {
    const mockPreferences = {
      id: 'pref-123',
      user_id: 'user-123',
      location_id: 'loc-123',
      golden_hour_enabled: true,
      blue_hour_enabled: false,
      notification_minutes_before: 30
    }

    describe('getByLocationId', () => {
      it('should fetch preferences for a location', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPreferences,
                error: null
              })
            })
          })
        })

        const result = await notificationPreferencesService.getByLocationId('loc-123')

        expect(result).toEqual(mockPreferences)
      })

      it('should return null when preferences not found', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' } // Not found error
              })
            })
          })
        })

        const result = await notificationPreferencesService.getByLocationId('loc-123')

        expect(result).toBeNull()
      })

      it('should require authentication', async () => {
        getCurrentUser.mockResolvedValue(null)

        await expect(
          notificationPreferencesService.getByLocationId('loc-123')
        ).rejects.toThrow('User must be authenticated to access notification preferences')
      })
    })

    describe('upsert', () => {
      it('should create or update preferences', async () => {
        mockSupabase.from.mockReturnValue({
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPreferences,
                error: null
              })
            })
          })
        })

        const result = await notificationPreferencesService.upsert('loc-123', {
          golden_hour_enabled: true,
          notification_minutes_before: 30
        })

        expect(result).toEqual(mockPreferences)
      })

      it('should validate notification minutes', async () => {
        await expect(
          notificationPreferencesService.upsert('loc-123', { notification_minutes_before: -1 })
        ).rejects.toThrow('Notification minutes before must be between 0 and 1440')

        await expect(
          notificationPreferencesService.upsert('loc-123', { notification_minutes_before: 1441 })
        ).rejects.toThrow('Notification minutes before must be between 0 and 1440')
      })

      it('should require authentication', async () => {
        getCurrentUser.mockResolvedValue(null)

        await expect(
          notificationPreferencesService.upsert('loc-123', {})
        ).rejects.toThrow('User must be authenticated to manage notification preferences')
      })
    })
  })

  describe('authService', () => {
    describe('signIn', () => {
      it('should sign in with valid credentials', async () => {
        const mockAuthData = { user: mockUser, session: { access_token: 'token' } }
        
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: mockAuthData,
          error: null
        })

        const result = await authService.signIn('test@example.com', 'password')

        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        })
        expect(result).toEqual(mockAuthData)
      })

      it('should handle authentication errors', async () => {
        const authError = new Error('Invalid credentials')
        
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: null,
          error: authError
        })

        await expect(
          authService.signIn('test@example.com', 'wrong-password')
        ).rejects.toThrow(authError)
      })
    })

    describe('signUp', () => {
      it('should sign up with valid data', async () => {
        const mockAuthData = { user: mockUser, session: null }
        
        mockSupabase.auth.signUp.mockResolvedValue({
          data: mockAuthData,
          error: null
        })

        const result = await authService.signUp('test@example.com', 'password')

        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        })
        expect(result).toEqual(mockAuthData)
      })
    })

    describe('getSession', () => {
      it('should get current session', async () => {
        const mockSession = { access_token: 'token', user: mockUser }
        
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: mockSession },
          error: null
        })

        const result = await authService.getSession()

        expect(result).toEqual(mockSession)
      })

      it('should return null when no session', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null
        })

        const result = await authService.getSession()

        expect(result).toBeNull()
      })
    })

    describe('onAuthStateChange', () => {
      it('should set up auth state listener', () => {
        const mockCallback = vi.fn()
        const mockUnsubscribe = vi.fn()
        
        mockSupabase.auth.onAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: mockUnsubscribe } }
        })

        const unsubscribe = authService.onAuthStateChange(mockCallback)

        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
        expect(typeof unsubscribe).toBe('function')
        
        // Test unsubscribe
        unsubscribe()
        expect(mockUnsubscribe).toHaveBeenCalled()
      })
    })
  })
})