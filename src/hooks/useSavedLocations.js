'use client'

import { useState, useEffect, useCallback } from 'react'
import { savedLocationsManager } from '../lib/saved-locations-manager.js'
import { useAuth } from '../contexts/AuthContext.js'

export const useSavedLocations = () => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncStatus, setSyncStatus] = useState(savedLocationsManager.getSyncStatus())
  const { user } = useAuth()

  // Update sync status periodically
  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(savedLocationsManager.getSyncStatus())
    }

    // Update sync status every 5 seconds
    const interval = setInterval(updateSyncStatus, 5000)
    
    // Listen for online/offline events
    const handleOnline = () => {
      updateSyncStatus()
      // Trigger sync when coming back online
      savedLocationsManager.syncWithServer().then(() => {
        loadLocations()
      })
    }
    
    const handleOffline = () => {
      updateSyncStatus()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load saved locations when user changes
  useEffect(() => {
    if (user) {
      loadLocations()
    } else {
      setLocations([])
      setLoading(false)
    }
  }, [user])

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await savedLocationsManager.getAll()
      // Filter out deleted items for display
      const activeLocations = data.filter(loc => !loc._deleted)
      setLocations(activeLocations)
      setSyncStatus(savedLocationsManager.getSyncStatus())
    } catch (err) {
      console.error('Error loading saved locations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveLocation = async (name, latitude, longitude) => {
    try {
      setError(null)
      const newLocation = await savedLocationsManager.create(name, latitude, longitude)
      setLocations(prev => [newLocation, ...prev])
      setSyncStatus(savedLocationsManager.getSyncStatus())
      return newLocation
    } catch (err) {
      console.error('Error saving location:', err)
      setError(err.message)
      throw err
    }
  }

  const updateLocation = async (id, updates) => {
    try {
      setError(null)
      const updatedLocation = await savedLocationsManager.update(id, updates)
      setLocations(prev => 
        prev.map(loc => loc.id === id ? updatedLocation : loc)
      )
      setSyncStatus(savedLocationsManager.getSyncStatus())
      return updatedLocation
    } catch (err) {
      console.error('Error updating location:', err)
      setError(err.message)
      throw err
    }
  }

  const deleteLocation = async (id) => {
    try {
      setError(null)
      await savedLocationsManager.delete(id)
      setLocations(prev => prev.filter(loc => loc.id !== id))
      setSyncStatus(savedLocationsManager.getSyncStatus())
    } catch (err) {
      console.error('Error deleting location:', err)
      setError(err.message)
      throw err
    }
  }

  const syncWithServer = async () => {
    try {
      setError(null)
      await savedLocationsManager.syncWithServer()
      await loadLocations() // Refresh after sync
    } catch (err) {
      console.error('Error syncing with server:', err)
      setError(err.message)
    }
  }

  return {
    locations,
    loading,
    error,
    syncStatus,
    saveLocation,
    updateLocation,
    deleteLocation,
    refreshLocations: loadLocations,
    syncWithServer
  }
}