'use client'

import SavedLocationsManager from '../../components/SavedLocationsManager.js'

export default function LocationsPage() {
  return (
    <div className="locations-page">
      <div className="container">
        <SavedLocationsManager />
      </div>

      <style jsx>{`
        .locations-page {
          min-height: 100vh;
          background-color: #f8f9fa;
          padding: 20px 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  )
}