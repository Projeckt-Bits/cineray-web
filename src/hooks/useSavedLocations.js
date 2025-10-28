'use client'

import { useState, useEffect } from 'react'
import { savedLocationsService } from '../lib/database-service.js'
import { useAuth } from '../contexts/AuthContext.js'

export const useSavedLocations = () => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  // Load saved locations when user changes
  useEffect(() => {
    if (user) {
      loadLocations()
    } else {
      setLocations([])
      setLoading(false)
    }
  }, [user])

  const loadLocations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await savedLocationsService.getAll()
      setLocations(data)
    } catch (err) {
      console.error('Error loading saved locations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveLocation = async (name, latitude, longitude) => {
    try {
      setError(null)
      const newLocation = await savedLocationsService.create(name, latitude, longitude)
      setLocations(prev => [newLocation, ...prev])
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
      const updatedLocation = await savedLocationsService.update(id, updates)
      setLocations(prev => 
        prev.map(loc => loc.id === id ? updatedLocation : loc)
      )
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
      await savedLocationsService.delete(id)
      setLocations(prev => prev.filter(loc => loc.id !== id))
    } catch (err) {
      console.error('Error deleting location:', err)
      setError(err.message)
      throw err
    }
  }

  return {
    locations,
    loading,
    error,
    saveLocation,
    updateLocation,
    deleteLocation,
    refreshLocations: loadLocations
  }
}