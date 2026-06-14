export default function About() {
  return (
    <div>
      <div className="page-header">
        <h2>About WaveSight</h2>
        <p>Wi-Fi signal strength and wave field visualiser</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', maxWidth: '900px' }}>
        {/* What it does */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✅ What This Tool Does
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {[
              'Records Wi-Fi signal strength (RSSI) at coordinates you specify',
              'Stores measurements locally in SQLite on your machine',
              'Visualises coverage as 2D signal fields with animation',
              'Renders a 3D scene of your signal field with height-coded markers',
              'Designed for future ESP32 CSI data integration',
              'Runs entirely offline — no cloud, no external services',
            ].map((item, i) => (
              <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '24px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--accent-success)' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What it doesn't do */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ❌ What This Tool Does NOT Do
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {[
              'Does NOT see through walls',
              'Does NOT identify or track people',
              'Does NOT intercept network traffic',
              'Does NOT perform any surveillance',
              'Does NOT scan neighbours\' networks',
              'Does NOT connect to external servers',
            ].map((item, i) => (
              <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '24px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--accent-danger)' }}>✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Tech Stack */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Tech Stack
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {[
              { label: 'Frontend', value: 'React + Vite + TypeScript' },
              { label: '3D', value: 'React Three Fiber + Three.js' },
              { label: 'Backend', value: 'Node.js + Express' },
              { label: 'Database', value: 'SQLite (better-sqlite3)' },
              { label: 'Signal Field', value: 'HTML Canvas + IDW interpolation' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Intended Use */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 Intended Use
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {[
              'Mapping Wi-Fi coverage in your own home or office',
              'Finding weak signal areas to improve router placement',
              'Learning about wireless signal propagation',
              'Experimenting with ESP32 CSI data for research',
              'Educational and hobbyist purposes',
            ].map((item, i) => (
              <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '24px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>📡</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'var(--space-xl)',
        padding: 'var(--space-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        maxWidth: '900px',
      }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          WaveSight v0.1.0 · Built for personal Wi-Fi coverage mapping ·{' '}
          <a href="https://github.com/reachaki/WaveSight" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>{' '}
          ·{' '}
          <a href="https://github.com/reachaki/WaveSight/blob/main/docs/privacy-and-safety.md" target="_blank" rel="noopener noreferrer">
            Privacy & Safety
          </a>
        </p>
      </div>
    </div>
  );
}
