import { useEffect, useState } from 'react';

interface DashboardStats {
  totalReadings: number;
  strongestRoom: { name: string; rssi: number } | null;
  weakestRoom: { name: string; rssi: number } | null;
  lastReading: { ssid: string; rssi: number; room: string; time: string } | null;
}

function getRssiClass(rssi: number): string {
  if (rssi >= -40) return 'rssi-excellent';
  if (rssi >= -55) return 'rssi-good';
  if (rssi >= -65) return 'rssi-fair';
  if (rssi >= -75) return 'rssi-weak';
  return 'rssi-poor';
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
          <p>Overview of your Wi-Fi signal measurements</p>
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

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your Wi-Fi signal measurements</p>
      </div>

      <div className="stat-cards">
        <div className="card stat-card accent-blue">
          <div className="stat-icon">📡</div>
          <div className="stat-value">{stats?.totalReadings ?? 0}</div>
          <div className="stat-label">Total Readings</div>
          <div className="stat-detail">Across all floors & rooms</div>
        </div>

        <div className="card stat-card accent-green">
          <div className="stat-icon">💪</div>
          <div className="stat-value">
            {stats?.strongestRoom ? (
              <span className={`rssi-badge ${getRssiClass(stats.strongestRoom.rssi)}`}>
                {stats.strongestRoom.rssi} dBm
              </span>
            ) : '—'}
          </div>
          <div className="stat-label">Strongest Room</div>
          <div className="stat-detail">{stats?.strongestRoom?.name ?? 'No data'}</div>
        </div>

        <div className="card stat-card accent-red">
          <div className="stat-icon">📉</div>
          <div className="stat-value">
            {stats?.weakestRoom ? (
              <span className={`rssi-badge ${getRssiClass(stats.weakestRoom.rssi)}`}>
                {stats.weakestRoom.rssi} dBm
              </span>
            ) : '—'}
          </div>
          <div className="stat-label">Weakest Room</div>
          <div className="stat-detail">{stats?.weakestRoom?.name ?? 'No data'}</div>
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
          <div className="stat-label">Last Reading</div>
          <div className="stat-detail">
            {stats?.lastReading
              ? `${stats.lastReading.ssid} · ${stats.lastReading.room}`
              : 'No data'}
          </div>
        </div>
      </div>
    </div>
  );
}
