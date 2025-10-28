import { supabase, getCurrentUser } from './supabase.js'

/**
 * Database service for managing saved locations and notification preferences
 */

// Saved Locations Operations
export const savedLocationsService = {
  /**
   * Get all saved locations for the current user
   * @returns {Promise<Array>} Array of saved locations
   */
  async getAll() {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('User must be authenticated to access saved locations')
    }

    const { data, error } = await supabase
      .from('saved_locations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved locations:', error)
      throw error
    }

    return data || []
  },

  /**
   * Save a new location
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

    const { data, error } = await supabase
      .from('saved_locations')
      .insert([
        {
          user_id: user.id,
          name: name.trim(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error saving location:', error)
      throw error
    }

    return data
  },

  /**
   * Update an existing saved location
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

    const { data, error } = await supabase
      .from('saved_locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating location:', error)
      throw error
    }

    return data
  },

  /**
   * Delete a saved location
   * @param {string} id - Location ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('User must be authenticated to delete locations')
    }

    const { error } = await supabase
      .from('saved_locations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting location:', error)
      throw error
    }
  }
}

// Notification Preferences Operations
export const notificationPreferencesService = {
  /**
   * Get notification preferences for a specific location
   * @param {string} locationId - Location ID
   * @returns {Promise<Object|null>} Notification preferences or null if not found
   */
  async getByLocationId(locationId) {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('User must be authenticated to access notification preferences')
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('location_id', locationId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching notification preferences:', error)
      throw error
    }

    return data
  },

  /**
   * Get all notification preferences for the current user
   * @returns {Promise<Array>} Array of notification preferences
   */
  async getAll() {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('User must be authenticated to access notification preferences')
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select(`
        *,
        saved_locations (
          id,
          name,
          latitude,
          longitude
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notification preferences:', error)
      throw error
    }

    return data || []
  },

  /**
   * Create or update notification preferences for a location
   * @param {string} locationId - Location ID
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} The created/updated preferences
   */
  async upsert(locationId, preferences) {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('User must be authenticated to manage notification preferences')
    }

    // Validate notification_minutes_before
    if (preferences.notification_minutes_before !== undefined) {
      const minutes = parseInt(preferences.notification_minutes_before)
      if (minutes < 0 || minutes > 1440) {
        throw new Error('Notification minutes before must be between 0 and 1440 (24 hours)')
      }
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert([
        {
          user_id: user.id,
          location_id: locationId,
          ...preferences
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error upserting notification preferences:', error)
      throw error
    }

    return data
  },

  /**
   * Delete notification preferences for a location
   * @param {string} locationId - Location ID
   * @returns {Promise<void>}
   */
  async delete(locationId) {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('User must be authenticated to delete notification preferences')
    }

    const { error } = await supabase
      .from('notification_preferences')
      .delete()
      .eq('location_id', locationId)

    if (error) {
      console.error('Error deleting notification preferences:', error)
      throw error
    }
  }
}

// Authentication helpers
export const authService = {
  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth response
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Error signing in:', error)
      throw error
    }

    return data
  },

  /**
   * Sign up with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth response
   */
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      console.error('Error signing up:', error)
      throw error
    }

    return data
  },

  /**
   * Get the current authentication session
   * @returns {Promise<Object|null>} Current session or null
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      throw error
    }

    return session
  },

  /**
   * Listen for authentication state changes
   * @param {Function} callback - Callback function to handle auth state changes
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
    return () => subscription.unsubscribe()
  }
}