import { useEffect, useState } from 'react';

interface DashboardStats {
  totalReadings: number;
  totalAnchors: number;
  strongestPoint: { rssi: number; label: string } | null;
  weakestPoint: { rssi: number; label: string } | null;
  lastReading: { ssid: string; rssi: number; label: string; time: string } | null;
  activeDevices: Array<{
    deviceName: string;
    macAddress: string;
    ipAddress: string;
    connectionType: string;
    rssi: number;
    lastSeen: string;
    assignedLocation: string;
  }>;
}

function getRssiClass(rssi: number): string {
  if (rssi >= -40) return 'rssi-excellent';
  if (rssi >= -55) return 'rssi-good';
  if (rssi >= -65) return 'rssi-fair';
  if (rssi >= -75) return 'rssi-weak';
  return 'rssi-poor';
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString();
  } catch {
    return isoString;
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h2>Dashboard</h2>
          <p>Overview of real-time network and signal statistics</p>
        </div>
        <div className="card empty-state">
          <div className="empty-icon">⚠️</div>
          <p>Could not connect to the backend at <code>localhost:3001</code></p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Make sure the server is running: <code>cd server && npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  const isDemoMode = stats?.strongestPoint?.label.includes('Demo') || stats?.totalReadings === 20;

  return (
    <div>
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(202, 138, 4, 0.05) 100%)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md) var(--space-lg)',
          marginBottom: 'var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)',
          animation: 'pulse 3s infinite alternate'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <h4 style={{ color: '#facc15', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Demo Mode Active</h4>
            <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', fontSize: '0.85rem' }}>
              Currently displaying pre-seeded demonstration readings. To map your physical environment, navigate to <strong>2D Signal Field</strong> or <strong>Add Reading</strong> to record live points.
            </p>
          </div>
        </div>
      )}

      <div className="page-header">
        <h2>Signal Field Dashboard</h2>
        <p>Overview of wireless signal scans and active device telemetry</p>
      </div>

      {/* Stats Grid */}
      <div className="stat-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="card stat-card accent-blue" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="stat-icon">📡</div>
          <div className="stat-value">{stats?.totalReadings ?? 0}</div>
          <div className="stat-label">Total Readings</div>
          <div className="stat-detail">Across all scanned fields</div>
        </div>

        <div className="card stat-card accent-purple" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="stat-icon">⚓</div>
          <div className="stat-value">{stats?.totalAnchors ?? 0}</div>
          <div className="stat-label">Active Anchors</div>
          <div className="stat-detail">Trusted location beacons</div>
        </div>

        <div className="card stat-card accent-green">
          <div className="stat-icon">💪</div>
          <div className="stat-value">
            {stats?.strongestPoint ? (
              <span className={`rssi-badge ${getRssiClass(stats.strongestPoint.rssi)}`}>
                {stats.strongestPoint.rssi} dBm
              </span>
            ) : '—'}
          </div>
          <div className="stat-label">Peak Intensity</div>
          <div className="stat-detail" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {stats?.strongestPoint?.label ?? 'No data'}
          </div>
        </div>

        <div className="card stat-card accent-red">
          <div className="stat-icon">📉</div>
          <div className="stat-value">
            {stats?.weakestPoint ? (
              <span className={`rssi-badge ${getRssiClass(stats.weakestPoint.rssi)}`}>
                {stats.weakestPoint.rssi} dBm
              </span>
            ) : '—'}
          </div>
          <div className="stat-label">Floor Noise</div>
          <div className="stat-detail" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {stats?.weakestPoint?.label ?? 'No data'}
          </div>
        </div>

        <div className="card stat-card accent-purple">
          <div className="stat-icon">🕐</div>
          <div className="stat-value">
            {stats?.lastReading ? (
              <span className={`rssi-badge ${getRssiClass(stats.lastReading.rssi)}`}>
                {stats.lastReading.rssi} dBm
              </span>
            ) : '—'}
          </div>
          <div className="stat-label">Last Captured Scan</div>
          <div className="stat-detail" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {stats?.lastReading ? `${stats.lastReading.ssid} · ${formatTime(stats.lastReading.time)}` : 'No data'}
          </div>
        </div>
      </div>

      {/* Stage 1: Active Devices / AP Discovery */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Stage 1: Discovered Devices & Routers</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Real-time telemetry parsed from accessible router data or local wireless interfaces.
            </p>
          </div>
          <span style={{
            fontSize: '0.75rem',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            padding: '4px 10px',
            borderRadius: '12px',
            fontWeight: 600,
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            Active Telemetry
          </span>
        </div>

        {stats?.activeDevices && stats.activeDevices.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="readings-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-sm)' }}>Device / SSID</th>
                  <th style={{ padding: 'var(--space-sm)' }}>MAC Address</th>
                  <th style={{ padding: 'var(--space-sm)' }}>IP Address</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Connection Type</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Last Seen</th>
                  <th style={{ padding: 'var(--space-sm)' }}>Assigned Position</th>
                  <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Signal (RSSI)</th>
                </tr>
              </thead>
              <tbody>
                {stats.activeDevices.map((device, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: 'var(--space-sm)', fontWeight: 500 }}>{device.deviceName}</td>
                    <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{device.macAddress}</td>
                    <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{device.ipAddress}</td>
                    <td style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}>{device.connectionType}</td>
                    <td style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}>{formatTime(device.lastSeen)}</td>
                    <td style={{ padding: 'var(--space-sm)', color: 'var(--text-secondary)' }}>{device.assignedLocation}</td>
                    <td style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>
                      <span className={`rssi-badge ${getRssiClass(device.rssi)}`}>
                        {device.rssi} dBm
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
            No active devices discovered yet. Walk around or perform a manual scan to capture wireless signals.
          </div>
        )}
      </div>

      {/* WaveSight Roadmap Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 600 }}>System Capabilities</h3>
          <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Stage 1 (Router Telemetry)</strong>: Displays SSID, connection types, IP/MAC details, and signal logs where accessible.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Stage 2 (Manual Signal Scanner)</strong>: Record RSSI at physical coordinates to map dynamic wireless fields without artificial assumptions about floor geometry.
            </li>
            <li>
              <strong>Stage 3 (ESP32 CSI integration)</strong>: Future extension using ESP32 subcarriers to map phase shift and wave interference for fine-grained space sensing.
            </li>
          </ul>
        </div>

        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 600 }}>Data Notice</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Wireless signals are naturally dynamic and affected by multiple variables such as humidity, moving objects, and materials.
            This app does <strong>not</strong> spy or peer through walls; it visualizes the overlaying wave fields generated by the devices you own, allowing you to optimize receiver locations.
          </p>
        </div>
      </div>
    </div>
  );
}
