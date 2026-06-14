import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useDataMode } from '../App';

const API = 'http://localhost:3001/api';

interface Floor {
  id: string;
  name: string;
}

interface Anchor {
  id: string;
  floor_id: string;
  device_name: string;
  room_name: string;
  x: number;
  y: number;
  z: number;
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
  floor_id: string;
  room_name: string | null;
  anchor_id: string | null;
  anchor_name: string | null;
}

function getRssiClass(rssi: number): string {
  if (rssi >= -40) return 'rssi-excellent';
  if (rssi >= -55) return 'rssi-good';
  if (rssi >= -65) return 'rssi-fair';
  if (rssi >= -75) return 'rssi-weak';
  return 'rssi-poor';
}

function calculateConfidence(
  x: number,
  y: number,
  rssi: number,
  anchors: Anchor[],
  floorId: string
): 'High' | 'Medium' | 'Low' {
  if (rssi <= -80) return 'Low';

  const floorAnchors = anchors.filter(a => a.floor_id === floorId);
  let nearbyCount = 0;

  for (const a of floorAnchors) {
    const dist = Math.sqrt((x - a.x) ** 2 + (y - a.y) ** 2);
    if (dist <= 4.5) {
      nearbyCount++;
    }
  }

  if (nearbyCount >= 3 && rssi >= -75) return 'High';
  if (nearbyCount >= 1) return 'Medium';
  return 'Low';
}

function getConfidenceBadge(confidence: 'High' | 'Medium' | 'Low') {
  let bg = 'rgba(248, 113, 113, 0.15)';
  let color = '#f87171';
  if (confidence === 'High') {
    bg = 'rgba(52, 211, 153, 0.15)';
    color = '#34d399';
  } else if (confidence === 'Medium') {
    bg = 'rgba(251, 191, 36, 0.15)';
    color = '#fbbf24';
  }
  return (
    <span style={{
      fontSize: '0.75rem',
      background: bg,
      color: color,
      padding: '2px 8px',
      borderRadius: '8px',
      fontWeight: 600
    }}>
      {confidence}
    </span>
  );
}

export default function AddReading() {
  const { mode } = useDataMode();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Query params for direct click mapping
  const query = new URLSearchParams(useLocation().search);
  const qX = query.get('x') || '';
  const qY = query.get('y') || '';
  const qFloorId = query.get('floorId') || '';

  // Form state
  const [floorId, setFloorId] = useState(qFloorId);
  const [newFloorName, setNewFloorName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [anchorId, setAnchorId] = useState('');
  const [label, setLabel] = useState('');
  const [x, setX] = useState(qX);
  const [y, setY] = useState(qY);
  const [z, setZ] = useState('');
  const [ssid, setSsid] = useState('');
  const [rssi, setRssi] = useState(-50);
  const [frequencyMhz, setFrequencyMhz] = useState('');
  const [channelNum, setChannelNum] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch floors, readings, anchors based on operating mode
  useEffect(() => {
    if (mode === 'demo') {
      fetch('http://localhost:3001/api/demo-data')
        .then(res => res.json())
        .then(data => {
          setFloors(data.floors);
          setReadings(data.readings);
          setAnchors(data.anchors);
          if (qFloorId) {
            setFloorId(qFloorId);
          } else if (data.floors.length > 0) {
            setFloorId(data.floors[0].id);
          }
        })
        .catch(() => {});
    } else {
      fetch(`${API}/floors`).then(r => r.json()).then(data => {
        setFloors(data);
        if (qFloorId) {
          setFloorId(qFloorId);
        } else if (data.length > 0) {
          setFloorId(data[0].id);
        }
      }).catch(() => {});
      
      fetch(`${API}/readings`).then(r => r.json()).then(setReadings).catch(() => {});
      fetch(`${API}/anchors`).then(r => r.json()).then(setAnchors).catch(() => {});
    }
  }, [qFloorId, mode]);

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
      label: label || undefined,
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

    // Optional Room / Zone Name
    if (roomName) {
      body.room_name = roomName;
    }

    // Optional Linked Anchor
    if (anchorId) {
      body.anchor_id = anchorId;
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

      // Reset form (keep floor selection)
      setX('');
      setY('');
      setZ('');
      setLabel('');
      setSsid('');
      setRssi(-50);
      setFrequencyMhz('');
      setChannelNum('');
      setDeviceName('');
      setNotes('');
      setRoomName('');
      setAnchorId('');

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

  const floorAnchors = anchors.filter(a => a.floor_id === floorId);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            Add Reading
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              background: mode === 'demo' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(56, 189, 248, 0.12)',
              color: mode === 'demo' ? '#eab308' : '#38bdf8',
              border: `1px solid ${mode === 'demo' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(56, 189, 248, 0.2)'}`
            }}>
              {mode === 'demo' ? '🔬 Demo Sandbox' : '🏠 Real Home'}
            </span>
          </h2>
          <p>Record a live Wi-Fi signal strength measurement</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
        {/* Form / Locked Notice in Demo Mode */}
        <div className="card">
          {mode === 'demo' ? (
            <div style={{ padding: 'var(--space-lg) 0', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--space-md)' }}>🔒</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Recording Locked
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                You are currently exploring the <strong>Demo Sandbox</strong>. Live manual reading entry is disabled. Toggle to <strong>Real Mode</strong> in the sidebar to record real signals for your home setup.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem', fontWeight: 600 }}>
                📡 New Measurement
              </h3>

            {/* Floor */}
            <div className="form-group">
              <label>Floor Field</label>
              <select
                className="form-select"
                value={floorId}
                onChange={e => { setFloorId(e.target.value); setAnchorId(''); }}
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

            {/* Room / Location label */}
            <div className="form-row">
              <div className="form-group">
                <label>Scan Point Label</label>
                <input
                  className="form-input"
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Near window, Router AP"
                />
              </div>
              <div className="form-group">
                <label>User Room (Optional)</label>
                <input
                  className="form-input"
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g. Office, Living Room"
                />
              </div>
            </div>

            {/* Linked Location Anchor */}
            {floorAnchors.length > 0 && (
              <div className="form-group">
                <label>Linked Reference Anchor (Optional)</label>
                <select
                  className="form-select"
                  value={anchorId}
                  onChange={e => setAnchorId(e.target.value)}
                >
                  <option value="">No link (autonomous scan)</option>
                  {floorAnchors.map(a => (
                    <option key={a.id} value={a.id}>{a.device_name} ({a.room_name})</option>
                  ))}
                </select>
              </div>
            )}

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
                placeholder="Any observations about this scan location..."
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
          )}
        </div>

        {/* Readings Table */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1.1rem', fontWeight: 600 }}>
            📋 All Scanned Points ({readings.length})
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
                    <th>Room / Label</th>
                    <th>SSID / Reference</th>
                    <th>RSSI</th>
                    <th>Confidence</th>
                    <th>Coordinates</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map(r => {
                    const confidence = calculateConfidence(r.x, r.y, r.rssi, anchors, r.floor_id);
                    return (
                      <tr key={r.reading_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td>{r.floor_name}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{r.label || '—'}</div>
                          {r.room_name && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room: {r.room_name}</div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{r.ssid}</div>
                          {r.anchor_name && (
                            <div style={{ fontSize: '0.75rem', color: '#a78bfa' }}>⚓ Anchor: {r.anchor_name}</div>
                          )}
                        </td>
                        <td>
                          <span className={`rssi-badge ${getRssiClass(r.rssi)}`}>
                            {r.rssi} dBm
                          </span>
                        </td>
                        <td>{getConfidenceBadge(confidence)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          ({r.x.toFixed(1)}m, {r.y.toFixed(1)}m)
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(r.recorded_at + 'Z').toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
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
