'use client'

import { useState } from 'react'
import { useSavedLocations } from '../hooks/useSavedLocations.js'
import { useAuth } from '../contexts/AuthContext.js'

export default function SavedLocationsManager() {
  const { user } = useAuth()
  const {
    locations,
    loading,
    error,
    syncStatus,
    saveLocation,
    updateLocation,
    deleteLocation,
    refreshLocations,
    syncWithServer
  } = useSavedLocations()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, {
          name: formData.name,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        })
        setEditingLocation(null)
      } else {
        await saveLocation(
          formData.name,
          parseFloat(formData.latitude),
          parseFloat(formData.longitude)
        )
        setShowAddForm(false)
      }
      
      setFormData({ name: '', latitude: '', longitude: '' })
    } catch (err) {
      // Error is handled by the hook
    }
  }

  const handleEdit = (location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString()
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      await deleteLocation(id)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingLocation(null)
    setFormData({ name: '', latitude: '', longitude: '' })
  }

  const formatCoordinate = (value, type) => {
    const direction = type === 'latitude' 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W')
    return `${Math.abs(value).toFixed(6)}° ${direction}`
  }

  if (!user) {
    return (
      <div className="saved-locations-manager">
        <div className="auth-required">
          <h3>Authentication Required</h3>
          <p>Please sign in to manage your saved locations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="saved-locations-manager">
      <div className="header">
        <h2>Saved Locations</h2>
        
        {/* Sync Status Indicator */}
        <div className={`sync-status ${syncStatus.isOnline ? 'online' : 'offline'}`}>
          <span className="status-indicator"></span>
          <span className="status-text">
            {syncStatus.isOnline ? 'Online' : 'Offline'}
            {syncStatus.hasPendingChanges && ` (${syncStatus.pendingCount} pending)`}
          </span>
          {syncStatus.hasPendingChanges && syncStatus.isOnline && (
            <button 
              onClick={syncWithServer}
              className="sync-button"
              title="Sync pending changes"
            >
              ↻ Sync
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={refreshLocations}>Retry</button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="location-form">
          <h3>{editingLocation ? 'Edit Location' : 'Add New Location'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Location Name:</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., Golden Gate Bridge"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitude">Latitude:</label>
                <input
                  type="number"
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  step="any"
                  min="-90"
                  max="90"
                  required
                  placeholder="37.8199"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="longitude">Longitude:</label>
                <input
                  type="number"
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  step="any"
                  min="-180"
                  max="180"
                  required
                  placeholder="-122.4783"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="save-button">
                {editingLocation ? 'Update' : 'Save'} Location
              </button>
              <button type="button" onClick={handleCancel} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Location Button */}
      {!showAddForm && (
        <button 
          onClick={() => setShowAddForm(true)}
          className="add-location-button"
        >
          + Add Location
        </button>
      )}

      {/* Locations List */}
      {loading ? (
        <div className="loading">Loading saved locations...</div>
      ) : (
        <div className="locations-list">
          {locations.length === 0 ? (
            <div className="empty-state">
              <p>No saved locations yet.</p>
              <p>Add your first location to get started!</p>
            </div>
          ) : (
            locations.map((location) => (
              <div key={location.id} className="location-item">
                <div className="location-info">
                  <h4 className="location-name">
                    {location.name}
                    {location._pending && (
                      <span className="pending-indicator" title="Pending sync">
                        ⏳
                      </span>
                    )}
                  </h4>
                  <div className="coordinates">
                    <span className="latitude">
                      {formatCoordinate(location.latitude, 'latitude')}
                    </span>
                    <span className="longitude">
                      {formatCoordinate(location.longitude, 'longitude')}
                    </span>
                  </div>
                  <div className="metadata">
                    <span className="created-date">
                      Added: {new Date(location.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="location-actions">
                  <button 
                    onClick={() => handleEdit(location)}
                    className="edit-button"
                    title="Edit location"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(location.id)}
                    className="delete-button"
                    title="Delete location"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .saved-locations-manager {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header h2 {
          margin: 0;
          color: #333;
        }

        .sync-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .sync-status.online {
          background-color: #e8f5e8;
          color: #2d5a2d;
        }

        .sync-status.offline {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: currentColor;
        }

        .sync-button {
          background: none;
          border: 1px solid currentColor;
          color: inherit;
          padding: 4px 8px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 12px;
        }

        .sync-button:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .auth-required {
          text-align: center;
          padding: 40px 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-message button {
          background-color: #721c24;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .location-form {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .location-form h3 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #555;
        }

        .form-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .save-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .save-button:hover {
          background-color: #0056b3;
        }

        .cancel-button {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
        }

        .cancel-button:hover {
          background-color: #545b62;
        }

        .add-location-button {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .add-location-button:hover {
          background-color: #218838;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .locations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .location-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          background-color: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .location-info {
          flex: 1;
        }

        .location-name {
          margin: 0 0 8px 0;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pending-indicator {
          font-size: 12px;
          opacity: 0.7;
        }

        .coordinates {
          display: flex;
          gap: 16px;
          margin-bottom: 4px;
          font-family: monospace;
          font-size: 14px;
          color: #666;
        }

        .metadata {
          font-size: 12px;
          color: #999;
        }

        .location-actions {
          display: flex;
          gap: 8px;
        }

        .edit-button,
        .delete-button {
          background: none;
          border: 1px solid #ddd;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .edit-button:hover {
          background-color: #e9ecef;
        }

        .delete-button:hover {
          background-color: #f8d7da;
          border-color: #f5c6cb;
        }

        @media (max-width: 768px) {
          .saved-locations-manager {
            padding: 16px;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .coordinates {
            flex-direction: column;
            gap: 4px;
          }

          .location-item {
            flex-direction: column;
            gap: 12px;
          }

          .location-actions {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  )
}