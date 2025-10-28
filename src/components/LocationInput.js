'use client'

import { useState, useCallback } from 'react'
import { validateManualLocation, formatLocationForDisplay } from '../lib/geolocation-service.js'

/**
 * LocationInput Component
 * Provides manual location input with validation
 */
export const LocationInput = ({
  onLocationChange,
  onLocationSelect,
  initialLocation = null,
  placeholder = 'Enter coordinates (lat, lng)',
  className = '',
  disabled = false,
  showCurrentLocation = true,
  showValidation = true
}) => {
  const [inputValue, setInputValue] = useState(
    initialLocation ? formatLocationForDisplay(initialLocation) : ''
  )
  const [validationError, setValidationError] = useState(null)
  const [isValid, setIsValid] = useState(!!initialLocation)

  /**
   * Parses coordinate input string
   * Supports formats: "lat,lng", "lat, lng", "lat lng"
   */
  const parseCoordinates = useCallback((input) => {
    if (!input || typeof input !== 'string') {
      return null
    }

    // Clean and split the input
    const cleaned = input.trim().replace(/[^\d.,-\s]/g, '')
    const parts = cleaned.split(/[,\s]+/).filter(part => part.length > 0)

    if (parts.length !== 2) {
      return null
    }

    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])

    if (isNaN(lat) || isNaN(lng)) {
      return null
    }

    return { latitude: lat, longitude: lng }
  }, [])

  /**
   * Validates and updates location
   */
  const validateAndUpdate = useCallback((input) => {
    setValidationError(null)
    setIsValid(false)

    if (!input.trim()) {
      setIsValid(false)
      onLocationChange?.(null)
      return
    }

    const coords = parseCoordinates(input)
    if (!coords) {
      const error = 'Invalid format. Use: latitude, longitude (e.g., 40.7128, -74.0060)'
      setValidationError(error)
      onLocationChange?.(null)
      return
    }

    try {
      const location = validateManualLocation(coords.latitude, coords.longitude)
      setIsValid(true)
      onLocationChange?.(location)
    } catch (error) {
      setValidationError(error.message)
      onLocationChange?.(null)
    }
  }, [parseCoordinates, onLocationChange])

  /**
   * Handles input change
   */
  const handleInputChange = useCallback((e) => {
    const value = e.target.value
    setInputValue(value)
    validateAndUpdate(value)
  }, [validateAndUpdate])

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    
    if (isValid && onLocationSelect) {
      const coords = parseCoordinates(inputValue)
      if (coords) {
        try {
          const location = validateManualLocation(coords.latitude, coords.longitude)
          onLocationSelect(location)
        } catch (error) {
          setValidationError(error.message)
        }
      }
    }
  }, [isValid, inputValue, parseCoordinates, onLocationSelect])

  /**
   * Handles current location button click
   */
  const handleCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const location = {
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            source: 'browser_geolocation'
          }
          
          setInputValue(formatLocationForDisplay(location))
          setIsValid(true)
          setValidationError(null)
          onLocationChange?.(location)
          onLocationSelect?.(location)
        },
        (error) => {
          let message = 'Unable to get current location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location unavailable'
              break
            case error.TIMEOUT:
              message = 'Location request timed out'
              break
          }
          setValidationError(message)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    } else {
      setValidationError('Geolocation is not supported by this browser')
    }
  }, [onLocationChange, onLocationSelect])

  return (
    <div className={`location-input ${className}`}>
      <form onSubmit={handleSubmit} className="location-input__form">
        <div className="location-input__field">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`location-input__input ${
              validationError ? 'location-input__input--error' : ''
            } ${isValid ? 'location-input__input--valid' : ''}`}
            aria-label="Location coordinates"
            aria-describedby={validationError ? 'location-error' : undefined}
          />
          
          {showCurrentLocation && (
            <button
              type="button"
              onClick={handleCurrentLocation}
              disabled={disabled}
              className="location-input__current-btn"
              title="Use current location"
              aria-label="Use current location"
            >
              📍
            </button>
          )}
          
          {onLocationSelect && (
            <button
              type="submit"
              disabled={disabled || !isValid}
              className="location-input__submit-btn"
              title="Use this location"
              aria-label="Use this location"
            >
              ✓
            </button>
          )}
        </div>
        
        {showValidation && validationError && (
          <div 
            id="location-error"
            className="location-input__error"
            role="alert"
          >
            {validationError}
          </div>
        )}
        
        {showValidation && isValid && !validationError && (
          <div className="location-input__success">
            Valid coordinates
          </div>
        )}
      </form>
      
      <style jsx>{`
        .location-input {
          width: 100%;
        }
        
        .location-input__form {
          width: 100%;
        }
        
        .location-input__field {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        
        .location-input__input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }
        
        .location-input__input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .location-input__input--error {
          border-color: #ef4444;
        }
        
        .location-input__input--valid {
          border-color: #10b981;
        }
        
        .location-input__input:disabled {
          background-color: #f8fafc;
          color: #64748b;
          cursor: not-allowed;
        }
        
        .location-input__current-btn,
        .location-input__submit-btn {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          background: white;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
          min-width: 3rem;
        }
        
        .location-input__current-btn:hover,
        .location-input__submit-btn:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
        }
        
        .location-input__current-btn:disabled,
        .location-input__submit-btn:disabled {
          background-color: #f8fafc;
          color: #64748b;
          cursor: not-allowed;
          border-color: #e2e8f0;
        }
        
        .location-input__submit-btn:disabled {
          opacity: 0.5;
        }
        
        .location-input__error {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          color: #dc2626;
          font-size: 0.875rem;
        }
        
        .location-input__success {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 0.375rem;
          color: #166534;
          font-size: 0.875rem;
        }
        
        @media (max-width: 640px) {
          .location-input__field {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .location-input__input {
            width: 100%;
          }
          
          .location-input__current-btn,
          .location-input__submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Simple coordinate display component
 */
export const LocationDisplay = ({ 
  location, 
  precision = 4, 
  showAccuracy = true,
  className = '' 
}) => {
  if (!location) {
    return <span className={`location-display ${className}`}>No location</span>
  }

  const formatted = formatLocationForDisplay(location, precision)
  
  return (
    <div className={`location-display ${className}`}>
      <span className="location-display__coords">{formatted}</span>
      {showAccuracy && location.accuracy && (
        <span className="location-display__accuracy">
          ±{Math.round(location.accuracy)}m
        </span>
      )}
      
      <style jsx>{`
        .location-display {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: monospace;
        }
        
        .location-display__coords {
          font-weight: 500;
        }
        
        .location-display__accuracy {
          font-size: 0.875rem;
          color: #64748b;
          background-color: #f1f5f9;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }
      `}</style>
    </div>
  )
}

export default LocationInput