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
  floor_name?: string;
  device_name: string;
  room_name: string;
  x: number;
  y: number;
  z: number;
  device_type: string;
  notes: string | null;
  created_at: string;
}

export default function Anchors() {
  const { mode } = useDataMode();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const query = new URLSearchParams(useLocation().search);
  const qX = query.get('x') || '';
  const qY = query.get('y') || '';
  const qFloorId = query.get('floorId') || '';

  // Form state
  const [floorId, setFloorId] = useState(qFloorId);
  const [deviceName, setDeviceName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [x, setX] = useState(qX);
  const [y, setY] = useState(qY);
  const [z, setZ] = useState('');
  const [deviceType, setDeviceType] = useState('Router');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'demo') {
      fetch('http://localhost:3001/api/demo-data')
        .then(res => res.json())
        .then(data => {
          setFloors(data.floors);
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

    const body = {
      floor_id: floorId,
      device_name: deviceName,
      room_name: roomName,
      x: parseFloat(x),
      y: parseFloat(y),
      z: z ? parseFloat(z) : 0,
      device_type: deviceType,
      notes: notes || undefined
    };

    try {
      const res = await fetch(`${API}/anchors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register anchor');
      }

      showToast('success', 'Location Anchor registered successfully!');
      
      // Reset form fields
      setDeviceName('');
      setRoomName('');
      setX('');
      setY('');
      setZ('');
      setNotes('');
      setDeviceType('Router');

      // Refresh list
      const updated = await fetch(`${API}/anchors`).then(r => r.json());
      setAnchors(updated);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this location anchor?')) return;

    try {
      const res = await fetch(`${API}/anchors/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete anchor');
      }

      showToast('success', 'Anchor deleted successfully');
      setAnchors(anchors.filter(a => a.id !== id));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Anchor Mode Setup</h2>
        <p>Register trusted devices at fixed coordinates to map approximate room-level zones and evaluate signal coverage confidence.</p>
      </div>

      {/* Anchor Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.12) 0%, rgba(129, 140, 248, 0.04) 100%)',
        border: '1px solid rgba(167, 139, 250, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ fontSize: '1.5rem' }}>⚓</span>
        <div>
          <h4 style={{ color: '#c084fc', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Rough Zone Estimation Notice</h4>
          <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', fontSize: '0.85rem', lineHeight: '1.4' }}>
            Location Anchors are used as reference beacons. By checking signal strengths relative to these fixed devices, WaveSight calculates whether scan points have <strong>High</strong>, <strong>Medium</strong>, or <strong>Low</strong> spatial confidence. This is a zone mapping technique, not an exact indoor GPS.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
        {/* Registration Form / Sandbox locked notice */}
        <div className="card">
          {mode === 'demo' ? (
            <div style={{ padding: 'var(--space-md) 0', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--space-md)' }}>🔒</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Registration Locked
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                You are currently exploring the <strong>Demo Sandbox</strong>. Real-world anchor registration is disabled. Toggle to <strong>Real Mode</strong> in the sidebar to register your home devices.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                ⚓ Register Location Anchor
              </h3>

            {/* Floor selection */}
            <div className="form-group">
              <label>Floor Field</label>
              <select
                className="form-select"
                value={floorId}
                onChange={e => setFloorId(e.target.value)}
                required
              >
                <option value="">Select floor...</option>
                {floors.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Device Name */}
            <div className="form-group">
              <label>Device Name / Label</label>
              <input
                className="form-input"
                type="text"
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                placeholder="e.g. iPad in Kitchen, Central Router"
                required
              />
            </div>

            {/* Room Name */}
            <div className="form-group">
              <label>Room / Zone Name</label>
              <input
                className="form-input"
                type="text"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                placeholder="e.g. Kitchen, Living Room, Bedroom"
                required
              />
            </div>

            {/* Coordinates */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Coordinates (metres)</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Relative to chosen origin (0,0,0)</span>
              </div>
              <div className="form-row-3">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>X (Left/Right)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    value={x}
                    onChange={e => setX(e.target.value)}
                    placeholder="e.g. -2.74"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Y (Forward/Back)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    value={y}
                    onChange={e => setY(e.target.value)}
                    placeholder="e.g. 0.0"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Z (Height)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    value={z}
                    onChange={e => setZ(e.target.value)}
                    placeholder="e.g. 0.30"
                  />
                </div>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                💡 Coordinates are relative to your origin device (e.g. Router at 0,0,0). Left of the router represents a <strong>negative X</strong>. If forward/back is not yet measured, enter <strong>0 for Y</strong> and update it later.
              </p>
            </div>

            {/* Device Type */}
            <div className="form-group">
              <label>Device Type</label>
              <select
                className="form-select"
                value={deviceType}
                onChange={e => setDeviceType(e.target.value)}
                required
              >
                <option value="Router">Router / Access Point</option>
                <option value="Smartphone">Smartphone</option>
                <option value="Tablet">Tablet</option>
                <option value="Laptop">Laptop</option>
                <option value="ESP32 CSI Node">ESP32 CSI Node</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe anchor location or parameters..."
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? 'Registering...' : '⚓ Register Anchor'}
            </button>
          </form>
        )}
      </div>

        {/* Anchors Table */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1.1rem', fontWeight: 600 }}>
            ⚓ Active Beacons ({anchors.length})
          </h3>

          {anchors.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">⚓</div>
              <p>No location anchors registered. Add anchor nodes to start zone-level mapping!</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Floor</th>
                    <th>Device / Room</th>
                    <th>Type</th>
                    <th>Coordinates</th>
                    <th>Notes</th>
                    {mode === 'real' && <th style={{ textAlign: 'right' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {anchors.map(a => {
                    const isDemo = a.device_name.includes('[Demo');
                    const displayName = isDemo ? a.device_name.replace('[Demo Anchor] ', '') : a.device_name;
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td>{a.floor_name || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: isDemo ? 'rgba(234, 179, 8, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                              color: isDemo ? '#eab308' : '#38bdf8',
                              border: `1px solid ${isDemo ? 'rgba(234, 179, 8, 0.25)' : 'rgba(56, 189, 248, 0.25)'}`
                            }}>
                              {isDemo ? 'Demo' : 'Manual'}
                            </span>
                            <span style={{ fontWeight: 500 }}>{displayName}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '3px' }}>Zone: {a.room_name}</div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.75rem',
                            background: 'rgba(167, 139, 250, 0.12)',
                            color: '#a78bfa',
                            padding: '2px 8px',
                            borderRadius: '8px',
                          }}>
                            {a.device_type}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          ({a.x.toFixed(2)}m, {a.y.toFixed(2)}m{a.z !== null && a.z !== undefined ? `, ${a.z.toFixed(2)}m` : ''})
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.notes || '—'}</td>
                        {mode === 'real' && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="btn btn-secondary"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                color: '#ef4444',
                                borderColor: 'rgba(239, 68, 68, 0.2)'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
}
