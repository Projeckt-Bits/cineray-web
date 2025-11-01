/**
 * Saved Locations Manager with offline caching support
 * Provides CRUD operations for saved locations with localStorage fallback
 */

import { savedLocationsService } from './database-service.js'
import { getCurrentUser } from './supabase.js'

const STORAGE_KEY = 'sun_tracker_saved_locations'
const CACHE_EXPIRY_KEY = 'sun_tracker_locations_cache_expiry'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

class SavedLocationsManager {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    this.setupOnlineListener()
  }

  setupOnlineListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.syncWithServer()
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
  }

  /**
   * Get cached locations from localStorage
   * @returns {Array} Array of cached locations
   */
  getCachedLocations() {
    try {
      if (typeof localStorage === 'undefined') return []
      
      const cached = localStorage.getItem(STORAGE_KEY)
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY)
      
      if (!cached) return []
      
      // Check if cache is expired
      if (expiry && Date.now() > parseInt(expiry)) {
        this.clearCache()
        return []
      }
      
      return JSON.parse(cached)
    } catch (error) {
      console.error('Error reading cached locations:', error)
      return []
    }
  }

  /**
   * Cache locations to localStorage
   * @param {Array} locations - Array of locations to cache
   */
  cacheLocations(locations) {
    try {
      if (typeof localStorage === 'undefined') return
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations))
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString())
    } catch (error) {
      console.error('Error caching locations:', error)
    }
  }

  /**
   * Clear cached locations
   */
  clearCache() {
    try {
      if (typeof localStorage === 'undefined') return
      
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CACHE_EXPIRY_KEY)
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  /**
   * Get all saved locations with offline support
   * @returns {Promise<Array>} Array of saved locations
   */
  async getAll() {
    const user = await getCurrentUser()
    
    // If user is not authenticated, return empty array
    if (!user) {
      return []
    }

    // Try to get from server first if online
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (isOnline) {
      try {
        const locations = await savedLocationsService.getAll()
        this.cacheLocations(locations)
        return locations
      } catch (error) {
        console.warn('Failed to fetch from server, falling back to cache:', error)
        return this.getCachedLocations()
      }
    }
    
    // Return cached data if offline
    return this.getCachedLocations()
  }

  /**
   * Save a new location with offline support
   * @param {string} name - Location name
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} The created location
   */
  async create(name, latitude, longitude) {
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User must be authenticated to save locations')
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees')
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees')
    }

    // Try to save to server if online
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    
    const locationData = {
      id: this.generateTempId(),
      user_id: user.id,
      name: name.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _pending: !isOnline // Mark as pending if offline
    }

    if (isOnline) {
      try {
        const serverLocation = await savedLocationsService.create(name, latitude, longitude)
        
        // Update cache with server response
        const cachedLocations = this.getCachedLocations()
        const updatedLocations = [serverLocation, ...cachedLocations]
        this.cacheLocations(updatedLocations)
        
        return serverLocation
      } catch (error) {
        console.warn('Failed to save to server, saving to cache:', error)
        // Fall through to offline save
      }
    }

    // Save to cache (offline mode or server error)
    const cachedLocations = this.getCachedLocations()
    const updatedLocations = [locationData, ...cachedLocations]
    this.cacheLocations(updatedLocations)
    
    return locationData
  }

  /**
   * Update an existing saved location with offline support
   * @param {string} id - Location ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} The updated location
   */
  async update(id, updates) {
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User must be authenticated to update locations')
    }

    // Validate coordinates if provided
    if (updates.latitude !== undefined && (updates.latitude < -90 || updates.latitude > 90)) {
      throw new Error('Latitude must be between -90 and 90 degrees')
    }
    if (updates.longitude !== undefined && (updates.longitude < -180 || updates.longitude > 180)) {
      throw new Error('Longitude must be between -180 and 180 degrees')
    }

    // Try to update on server if online
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (isOnline) {
      try {
        const updatedLocation = await savedLocationsService.update(id, updates)
        
        // Update cache
        const cachedLocations = this.getCachedLocations()
        const updatedLocations = cachedLocations.map(loc => 
          loc.id === id ? updatedLocation : loc
        )
        this.cacheLocations(updatedLocations)
        
        return updatedLocation
      } catch (error) {
        console.warn('Failed to update on server, updating cache:', error)
        // Fall through to offline update
      }
    }

    // Update in cache (offline mode or server error)
    const cachedLocations = this.getCachedLocations()
    const locationIndex = cachedLocations.findIndex(loc => loc.id === id)
    
    if (locationIndex === -1) {
      throw new Error('Location not found')
    }

    const updatedLocation = {
      ...cachedLocations[locationIndex],
      ...updates,
      updated_at: new Date().toISOString(),
      _pending: true // Mark as pending sync
    }

    const updatedLocations = [...cachedLocations]
    updatedLocations[locationIndex] = updatedLocation
    this.cacheLocations(updatedLocations)
    
    return updatedLocation
  }

  /**
   * Delete a saved location with offline support
   * @param {string} id - Location ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error('User must be authenticated to delete locations')
    }

    // Try to delete from server if online
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (isOnline) {
      try {
        await savedLocationsService.delete(id)
        
        // Remove from cache
        const cachedLocations = this.getCachedLocations()
        const updatedLocations = cachedLocations.filter(loc => loc.id !== id)
        this.cacheLocations(updatedLocations)
        
        return
      } catch (error) {
        console.warn('Failed to delete from server, marking for deletion:', error)
        // Fall through to offline delete
      }
    }

    // Mark for deletion in cache (offline mode or server error)
    const cachedLocations = this.getCachedLocations()
    const updatedLocations = cachedLocations.map(loc => 
      loc.id === id ? { ...loc, _deleted: true, _pending: true } : loc
    )
    this.cacheLocations(updatedLocations)
  }

  /**
   * Sync pending changes with server when online
   * @returns {Promise<void>}
   */
  async syncWithServer() {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (!isOnline) return

    const user = await getCurrentUser()
    if (!user) return

    try {
      const cachedLocations = this.getCachedLocations()
      const pendingLocations = cachedLocations.filter(loc => loc._pending)
      
      if (pendingLocations.length === 0) return

      console.log(`Syncing ${pendingLocations.length} pending locations...`)

      for (const location of pendingLocations) {
        try {
          if (location._deleted) {
            // Delete from server
            await savedLocationsService.delete(location.id)
          } else if (location.id.startsWith('temp_')) {
            // Create on server (was created offline)
            await savedLocationsService.create(
              location.name,
              location.latitude,
              location.longitude
            )
          } else {
            // Update on server
            const { _pending, _deleted, ...updateData } = location
            await savedLocationsService.update(location.id, updateData)
          }
        } catch (error) {
          console.error(`Failed to sync location ${location.id}:`, error)
        }
      }

      // Refresh from server after sync
      const freshLocations = await savedLocationsService.getAll()
      this.cacheLocations(freshLocations)
      
      console.log('Sync completed successfully')
    } catch (error) {
      console.error('Error during sync:', error)
    }
  }

  /**
   * Generate a temporary ID for offline-created locations
   * @returns {string} Temporary ID
   */
  generateTempId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Check if there are pending changes to sync
   * @returns {boolean} True if there are pending changes
   */
  hasPendingChanges() {
    const cachedLocations = this.getCachedLocations()
    return cachedLocations.some(loc => loc._pending)
  }

  /**
   * Get sync status information
   * @returns {Object} Sync status details
   */
  getSyncStatus() {
    const cachedLocations = this.getCachedLocations()
    const pendingCount = cachedLocations.filter(loc => loc._pending).length
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    
    return {
      isOnline,
      hasPendingChanges: pendingCount > 0,
      pendingCount,
      lastCacheUpdate: typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_EXPIRY_KEY) : null
    }
  }
}

// Export singleton instance
export const savedLocationsManager = new SavedLocationsManager()