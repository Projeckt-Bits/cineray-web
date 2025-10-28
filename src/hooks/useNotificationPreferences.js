'use client'

import { useState, useEffect } from 'react'
import { notificationPreferencesService } from '../lib/database-service.js'
import { useAuth } from '../contexts/AuthContext.js'

export const useNotificationPreferences = (locationId = null) => {
  const [preferences, setPreferences] = useState(null)
  const [allPreferences, setAllPreferences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  // Load preferences when user or locationId changes
  useEffect(() => {
    if (user) {
      if (locationId) {
        loadPreferencesForLocation(locationId)
      } else {
        loadAllPreferences()
      }
    } else {
      setPreferences(null)
      setAllPreferences([])
      setLoading(false)
    }
  }, [user, locationId])

  const loadPreferencesForLocation = async (locId) => {
    try {
      setLoading(true)
      setError(null)
      const data = await notificationPreferencesService.getByLocationId(locId)
      setPreferences(data)
    } catch (err) {
      console.error('Error loading notification preferences:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAllPreferences = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await notificationPreferencesService.getAll()
      setAllPreferences(data)
    } catch (err) {
      console.error('Error loading all notification preferences:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (locId, newPreferences) => {
    try {
      setError(null)
      const updatedPrefs = await notificationPreferencesService.upsert(locId, newPreferences)
      
      if (locationId === locId) {
        setPreferences(updatedPrefs)
      }
      
      // Update in allPreferences array as well
      setAllPreferences(prev => {
        const existingIndex = prev.findIndex(p => p.location_id === locId)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = updatedPrefs
          return updated
        } else {
          return [updatedPrefs, ...prev]
        }
      })
      
      return updatedPrefs
    } catch (err) {
      console.error('Error updating notification preferences:', err)
      setError(err.message)
      throw err
    }
  }

  const deletePreferences = async (locId) => {
    try {
      setError(null)
      await notificationPreferencesService.delete(locId)
      
      if (locationId === locId) {
        setPreferences(null)
      }
      
      setAllPreferences(prev => prev.filter(p => p.location_id !== locId))
    } catch (err) {
      console.error('Error deleting notification preferences:', err)
      setError(err.message)
      throw err
    }
  }

  return {
    preferences,
    allPreferences,
    loading,
    error,
    updatePreferences,
    deletePreferences,
    refreshPreferences: locationId ? () => loadPreferencesForLocation(locationId) : loadAllPreferences
  }
}