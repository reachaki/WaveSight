import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

const API = 'http://localhost:3001/api';

interface Floor {
  id: string;
  name: string;
  rooms: Array<{ id: string; name: string }>;
}

interface Reading {
  reading_id: string;
  ssid: string;
  rssi: number;
  frequency_mhz: number | null;
  channel: number | null;
  device_name: string | null;
  notes: string | null;
  recorded_at: string;
  x: number;
  y: number;
  z: number;
  label: string | null;
  floor_name: string;
  room_name: string | null;
}

function getRssiClass(rssi: number): string {
  if (rssi >= -40) return 'rssi-excellent';
  if (rssi >= -55) return 'rssi-good';
  if (rssi >= -65) return 'rssi-fair';
  if (rssi >= -75) return 'rssi-weak';
  return 'rssi-poor';
}

export default function AddReading() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [floorId, setFloorId] = useState('');
  const [newFloorName, setNewFloorName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [z, setZ] = useState('');
  const [ssid, setSsid] = useState('');
  const [rssi, setRssi] = useState(-50);
  const [frequencyMhz, setFrequencyMhz] = useState('');
  const [channelNum, setChannelNum] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch floors and readings
  useEffect(() => {
    fetch(`${API}/floors`).then(r => r.json()).then(setFloors).catch(() => {});
    fetch(`${API}/readings`).then(r => r.json()).then(setReadings).catch(() => {});
  }, []);

  const selectedFloor = floors.find(f => f.id === floorId);
  const rooms = selectedFloor?.rooms ?? [];

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const body: Record<string, unknown> = {
      x: parseFloat(x),
      y: parseFloat(y),
      z: z ? parseFloat(z) : 0,
      ssid,
      rssi,
      frequency_mhz: frequencyMhz ? parseInt(frequencyMhz) : undefined,
      channel: channelNum ? parseInt(channelNum) : undefined,
      device_name: deviceName || undefined,
      notes: notes || undefined,
    };

    // Floor
    if (floorId === '__new__') {
      body.floor_name = newFloorName;
    } else {
      body.floor_id = floorId;
    }

    // Room
    if (roomId === '__new__') {
      body.room_name = newRoomName;
    } else if (roomId) {
      body.room_id = roomId;
    }

    try {
      const res = await fetch(`${API}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create reading');
      }

      showToast('success', 'Reading saved successfully!');

      // Reset form (keep floor/room selection)
      setX('');
      setY('');
      setZ('');
      setSsid('');
      setRssi(-50);
      setFrequencyMhz('');
      setChannelNum('');
      setDeviceName('');
      setNotes('');

      // Refresh data
      const [newFloors, newReadings] = await Promise.all([
        fetch(`${API}/floors`).then(r => r.json()),
        fetch(`${API}/readings`).then(r => r.json()),
      ]);
      setFloors(newFloors);
      setReadings(newReadings);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Add Reading</h2>
        <p>Record a Wi-Fi signal strength measurement</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem', fontWeight: 600 }}>
              📡 New Measurement
            </h3>

            {/* Floor */}
            <div className="form-group">
              <label>Floor</label>
              <select
                className="form-select"
                value={floorId}
                onChange={e => { setFloorId(e.target.value); setRoomId(''); }}
                required
              >
                <option value="">Select a floor...</option>
                {floors.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
                <option value="__new__">+ Create new floor</option>
              </select>
            </div>

            {floorId === '__new__' && (
              <div className="form-group">
                <label>New Floor Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={newFloorName}
                  onChange={e => setNewFloorName(e.target.value)}
                  placeholder="e.g. Ground Floor"
                  required
                />
              </div>
            )}

            {/* Room */}
            <div className="form-group">
              <label>Room</label>
              <select
                className="form-select"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
              >
                <option value="">No room (optional)</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
                <option value="__new__">+ Create new room</option>
              </select>
            </div>

            {roomId === '__new__' && (
              <div className="form-group">
                <label>New Room Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  placeholder="e.g. Living Room"
                  required
                />
              </div>
            )}

            {/* Coordinates */}
            <div className="form-row-3">
              <div className="form-group">
                <label>X (metres)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  value={x}
                  onChange={e => setX(e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Y (metres)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  value={y}
                  onChange={e => setY(e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Z (optional)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  value={z}
                  onChange={e => setZ(e.target.value)}
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* SSID & RSSI */}
            <div className="form-row">
              <div className="form-group">
                <label>SSID</label>
                <input
                  className="form-input"
                  type="text"
                  value={ssid}
                  onChange={e => setSsid(e.target.value)}
                  placeholder="MyWiFi-5G"
                  required
                />
              </div>
              <div className="form-group">
                <label>RSSI (dBm): <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{rssi}</span></label>
                <input
                  type="range"
                  min="-100"
                  max="-10"
                  value={rssi}
                  onChange={e => setRssi(parseInt(e.target.value))}
                  style={{ width: '100%', marginTop: '4px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>-100 (weak)</span>
                  <span>-10 (strong)</span>
                </div>
              </div>
            </div>

            {/* Frequency & Channel */}
            <div className="form-row">
              <div className="form-group">
                <label>Frequency (MHz)</label>
                <input
                  className="form-input"
                  type="number"
                  value={frequencyMhz}
                  onChange={e => setFrequencyMhz(e.target.value)}
                  placeholder="5180"
                />
              </div>
              <div className="form-group">
                <label>Channel</label>
                <input
                  className="form-input"
                  type="number"
                  value={channelNum}
                  onChange={e => setChannelNum(e.target.value)}
                  placeholder="36"
                />
              </div>
            </div>

            {/* Device & Notes */}
            <div className="form-group">
              <label>Device Name</label>
              <input
                className="form-input"
                type="text"
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                placeholder="e.g. iPhone 15, MacBook Pro"
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any observations about this location..."
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? 'Saving...' : '💾 Save Reading'}
            </button>
          </form>
        </div>

        {/* Readings Table */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1.1rem', fontWeight: 600 }}>
            📋 All Readings ({readings.length})
          </h3>

          {readings.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">📡</div>
              <p>No readings yet. Add your first measurement!</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Floor</th>
                    <th>Room</th>
                    <th>SSID</th>
                    <th>RSSI</th>
                    <th>Position</th>
                    <th>Device</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map(r => (
                    <tr key={r.reading_id}>
                      <td>{r.floor_name}</td>
                      <td>{r.room_name || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{r.ssid}</td>
                      <td>
                        <span className={`rssi-badge ${getRssiClass(r.rssi)}`}>
                          {r.rssi} dBm
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        ({r.x}, {r.y}{r.z ? `, ${r.z}` : ''})
                      </td>
                      <td>{r.device_name || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(r.recorded_at + 'Z').toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
}
