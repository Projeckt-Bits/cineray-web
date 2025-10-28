'use client'

import { useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { LocationInput, LocationDisplay } from './LocationInput.js'

/**
 * Demo component showing geolocation service usage
 * This can be used for testing and as a reference implementation
 */
export const GeolocationDemo = () => {
  const [manualLocation, setManualLocation] = useState(null)
  
  const {
    location,
    loading,
    error,
    permission,
    accuracy,
    isSupported,
    hasLocation,
    requestLocation,
    setManualLocation: setGeoLocation,
    requestPermission,
    clearLocation,
    isPermissionGranted,
    isPermissionDenied,
    isHighAccuracy,
    isPermissionError,
    isTimeoutError,
    isUnavailableError
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    enableCache: true
  })

  const handleManualLocationChange = (newLocation) => {
    setManualLocation(newLocation)
  }

  const handleManualLocationSelect = (newLocation) => {
    setGeoLocation(newLocation.latitude, newLocation.longitude)
    setManualLocation(newLocation)
  }

  const handleRequestLocation = async () => {
    await requestLocation()
  }

  const handleRequestPermission = async () => {
    await requestPermission()
  }

  return (
    <div className="geolocation-demo">
      <h2>Geolocation Service Demo</h2>
      
      {/* Support Status */}
      <div className="demo-section">
        <h3>Browser Support</h3>
        <p>Geolocation supported: {isSupported ? '✅ Yes' : '❌ No'}</p>
        <p>Permission status: {permission}</p>
        {isPermissionDenied && (
          <button onClick={handleRequestPermission}>
            Request Permission
          </button>
        )}
      </div>

      {/* Current Location */}
      <div className="demo-section">
        <h3>Current Location</h3>
        {loading && <p>🔄 Getting location...</p>}
        
        {error && (
          <div className="error-display">
            <p>❌ Error: {error.message}</p>
            {isPermissionError && <p>💡 Please allow location access</p>}
            {isTimeoutError && <p>💡 Try again or enter location manually</p>}
            {isUnavailableError && <p>💡 Location unavailable, try manual input</p>}
          </div>
        )}
        
        {hasLocation && (
          <div className="location-info">
            <LocationDisplay 
              location={location} 
              showAccuracy={true}
            />
            <div className="location-details">
              <p>Source: {location.source}</p>
              <p>Accuracy level: {location.accuracyLevel}</p>
              {isHighAccuracy && <p>🎯 High accuracy</p>}
              <p>Timestamp: {new Date(location.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}
        
        <div className="location-controls">
          <button 
            onClick={handleRequestLocation}
            disabled={loading || !isSupported}
          >
            {loading ? 'Getting Location...' : 'Get Current Location'}
          </button>
          
          {hasLocation && (
            <button onClick={clearLocation}>
              Clear Location
            </button>
          )}
        </div>
      </div>

      {/* Manual Location Input */}
      <div className="demo-section">
        <h3>Manual Location Input</h3>
        <LocationInput
          onLocationChange={handleManualLocationChange}
          onLocationSelect={handleManualLocationSelect}
          placeholder="Enter coordinates (e.g., 40.7128, -74.0060)"
          showCurrentLocation={true}
          showValidation={true}
        />
        
        {manualLocation && (
          <div className="manual-location-info">
            <h4>Manual Location:</h4>
            <LocationDisplay location={manualLocation} />
          </div>
        )}
      </div>

      {/* Location Comparison */}
      {location && manualLocation && (
        <div className="demo-section">
          <h3>Location Comparison</h3>
          <div className="comparison">
            <div>
              <h4>Browser Location:</h4>
              <LocationDisplay location={location} />
            </div>
            <div>
              <h4>Manual Location:</h4>
              <LocationDisplay location={manualLocation} />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .geolocation-demo {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .demo-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          background: #f8fafc;
        }
        
        .demo-section h3 {
          margin-top: 0;
          color: #1e293b;
        }
        
        .error-display {
          padding: 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          color: #dc2626;
          margin: 1rem 0;
        }
        
        .location-info {
          padding: 1rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
        
        .location-details {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .location-details p {
          margin: 0.25rem 0;
        }
        
        .location-controls {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .location-controls button {
          padding: 0.75rem 1.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }
        
        .location-controls button:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .location-controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .manual-location-info {
          margin-top: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
        }
        
        .manual-location-info h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }
        
        .comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .comparison > div {
          padding: 1rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
        }
        
        .comparison h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }
        
        @media (max-width: 640px) {
          .geolocation-demo {
            padding: 1rem;
          }
          
          .location-controls {
            flex-direction: column;
          }
          
          .comparison {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default GeolocationDemo