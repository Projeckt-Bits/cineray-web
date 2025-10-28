export default function Home() {
  return (
    <div className="container">
      <header style={{ padding: 'var(--spacing-lg) 0', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-3xl)', 
          color: 'var(--primary-color)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Sun Tracking App
        </h1>
        <p style={{ 
          fontSize: 'var(--font-size-lg)', 
          color: 'var(--text-muted)' 
        }}>
          Solar position calculator and visualization tool
        </p>
      </header>

      <main style={{ padding: 'var(--spacing-xl) 0' }}>
        <div style={{
          display: 'grid',
          gap: 'var(--spacing-lg)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            boxShadow: '0 2px 4px var(--shadow)'
          }}>
            <h2 style={{ 
              fontSize: 'var(--font-size-xl)', 
              marginBottom: 'var(--spacing-md)',
              color: 'var(--foreground)'
            }}>
              Current Location
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Sun position data will be displayed here once location services are implemented.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            boxShadow: '0 2px 4px var(--shadow)'
          }}>
            <h2 style={{ 
              fontSize: 'var(--font-size-xl)', 
              marginBottom: 'var(--spacing-md)',
              color: 'var(--foreground)'
            }}>
              Today's Sun Times
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Sunrise, sunset, and golden hour times will be calculated and displayed here.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            boxShadow: '0 2px 4px var(--shadow)'
          }}>
            <h2 style={{ 
              fontSize: 'var(--font-size-xl)', 
              marginBottom: 'var(--spacing-md)',
              color: 'var(--foreground)'
            }}>
              Interactive Map
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Mapbox integration with sun path visualization will be available here.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            boxShadow: '0 2px 4px var(--shadow)'
          }}>
            <h2 style={{ 
              fontSize: 'var(--font-size-xl)', 
              marginBottom: 'var(--spacing-md)',
              color: 'var(--foreground)'
            }}>
              Compass & Orientation
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Device orientation compass showing sun direction will be implemented here.
            </p>
          </div>
        </div>
      </main>

      <footer style={{ 
        padding: 'var(--spacing-lg) 0', 
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        marginTop: 'var(--spacing-xxl)'
      }}>
        <p style={{ 
          fontSize: 'var(--font-size-sm)', 
          color: 'var(--text-muted)' 
        }}>
          Sun Tracking App - Built with Next.js, Mapbox, and Supabase
        </p>
      </footer>
    </div>
  );
}