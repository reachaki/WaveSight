import { useEffect, useState, useRef, useCallback } from 'react';

const API = 'http://localhost:3001/api';

interface Floor {
  id: string;
  name: string;
  width: number;
  height: number;
  rooms: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface Reading {
  reading_id: string;
  ssid: string;
  rssi: number;
  x: number;
  y: number;
  z: number;
  label: string | null;
  floor_id: string;
  room_name: string | null;
  device_name: string | null;
}

/** Map RSSI to a colour (green = strong, red = weak) */
function rssiToColor(rssi: number): [number, number, number] {
  // Normalise to 0-1 range (-90 = 0, -20 = 1)
  const t = Math.max(0, Math.min(1, (rssi + 90) / 70));

  // Green → Yellow → Orange → Red
  let r: number, g: number, b: number;
  if (t > 0.66) {
    // Green zone
    const s = (t - 0.66) / 0.34;
    r = Math.round(52 + (110 - 52) * (1 - s));
    g = Math.round(211 + (231 - 211) * (1 - s));
    b = Math.round(153 + (183 - 153) * (1 - s));
  } else if (t > 0.33) {
    // Yellow/orange zone
    const s = (t - 0.33) / 0.33;
    r = Math.round(251 - (251 - 52) * s);
    g = Math.round(191 - (191 - 211) * s);
    b = Math.round(36 + (153 - 36) * s);
  } else {
    // Red zone
    const s = t / 0.33;
    r = Math.round(248 - (248 - 251) * s);
    g = Math.round(113 + (191 - 113) * s);
    b = Math.round(113 - (113 - 36) * s);
  }

  return [r, g, b];
}

/** Inverse Distance Weighting interpolation */
function idwInterpolate(
  x: number,
  y: number,
  points: Array<{ x: number; y: number; rssi: number }>,
  power: number = 2,
): number {
  let weightSum = 0;
  let valueSum = 0;

  for (const p of points) {
    const dx = x - p.x;
    const dy = y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.01) return p.rssi; // Exact match

    const w = 1 / Math.pow(dist, power);
    weightSum += w;
    valueSum += w * p.rssi;
  }

  return weightSum > 0 ? valueSum / weightSum : -100;
}

export default function Heatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<Reading | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const SCALE = 60; // pixels per metre
  const PADDING = 40;

  useEffect(() => {
    Promise.all([
      fetch(`${API}/floors`).then(r => r.json()),
      fetch(`${API}/readings`).then(r => r.json()),
    ]).then(([f, r]) => {
      setFloors(f);
      setReadings(r);
      if (f.length > 0) setSelectedFloorId(f[0].id);
    }).catch(() => {});
  }, []);

  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  const floorReadings = readings.filter(r => r.floor_id === selectedFloorId);

  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedFloor) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const floorW = selectedFloor.width;
    const floorH = selectedFloor.height;
    const canvasW = floorW * SCALE + PADDING * 2;
    const canvasH = floorH * SCALE + PADDING * 2;

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Background
    ctx.fillStyle = '#0f1729';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Heatmap interpolation
    if (floorReadings.length > 0) {
      const points = floorReadings.map(r => ({ x: r.x, y: r.y, rssi: r.rssi }));
      const resolution = 2; // pixels per sample

      for (let px = 0; px < floorW * SCALE; px += resolution) {
        for (let py = 0; py < floorH * SCALE; py += resolution) {
          const mx = px / SCALE;
          const my = py / SCALE;
          const rssi = idwInterpolate(mx, my, points);
          const [r, g, b] = rssiToColor(rssi);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.35)`;
          ctx.fillRect(PADDING + px, PADDING + py, resolution, resolution);
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= floorW; x++) {
      ctx.beginPath();
      ctx.moveTo(PADDING + x * SCALE, PADDING);
      ctx.lineTo(PADDING + x * SCALE, PADDING + floorH * SCALE);
      ctx.stroke();
    }
    for (let y = 0; y <= floorH; y++) {
      ctx.beginPath();
      ctx.moveTo(PADDING, PADDING + y * SCALE);
      ctx.lineTo(PADDING + floorW * SCALE, PADDING + y * SCALE);
      ctx.stroke();
    }

    // Room outlines
    for (const room of selectedFloor.rooms) {
      const rx = PADDING + room.x * SCALE;
      const ry = PADDING + room.y * SCALE;
      const rw = room.width * SCALE;
      const rh = room.height * SCALE;

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);

      // Room label
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, rx + rw / 2, ry + rh / 2 + 4);
    }

    // Floor outline
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(PADDING, PADDING, floorW * SCALE, floorH * SCALE);

    // Measurement points
    for (const reading of floorReadings) {
      const px = PADDING + reading.x * SCALE;
      const py = PADDING + reading.y * SCALE;
      const [r, g, b] = rssiToColor(reading.rssi);

      // Glow
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, 16);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, Math.PI * 2);
      ctx.fill();

      // Dot
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // RSSI label
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${reading.rssi}`, px, py - 10);
    }

    // Axis labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let x = 0; x <= floorW; x += 2) {
      ctx.fillText(`${x}m`, PADDING + x * SCALE, PADDING - 8);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y <= floorH; y += 2) {
      ctx.fillText(`${y}m`, PADDING - 8, PADDING + y * SCALE + 4);
    }
  }, [selectedFloor, floorReadings, SCALE]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x: e.clientX, y: e.clientY });

    // Check if hovering over a point
    const mx = (x - PADDING) / SCALE;
    const my = (y - PADDING) / SCALE;

    let closest: Reading | null = null;
    let closestDist = Infinity;

    for (const r of floorReadings) {
      const dist = Math.sqrt((mx - r.x) ** 2 + (my - r.y) ** 2);
      if (dist < 0.5 && dist < closestDist) {
        closest = r;
        closestDist = dist;
      }
    }

    setHoveredPoint(closest);
  };

  return (
    <div>
      <div className="page-header">
        <h2>2D Signal Heatmap</h2>
        <p>Visualise Wi-Fi signal strength across your floor plan</p>
      </div>

      {/* Floor selector */}
      <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Floor:</label>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '200px' }}
          value={selectedFloorId}
          onChange={e => setSelectedFloorId(e.target.value)}
        >
          {floors.map(f => (
            <option key={f.id} value={f.id}>{f.name} ({f.width}×{f.height}m)</option>
          ))}
        </select>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {floorReadings.length} measurement{floorReadings.length !== 1 ? 's' : ''} on this floor
        </span>
      </div>

      {/* Canvas */}
      <div className="card" style={{ overflow: 'auto', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          style={{ display: 'block', cursor: 'crosshair' }}
        />

        {/* Tooltip */}
        {hoveredPoint && (
          <div style={{
            position: 'fixed',
            left: mousePos.x + 16,
            top: mousePos.y - 16,
            background: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-sm) var(--space-md)',
            fontSize: '0.85rem',
            pointerEvents: 'none',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
            minWidth: '180px',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              {hoveredPoint.label || 'Measurement Point'}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              SSID: <span style={{ color: 'var(--text-primary)' }}>{hoveredPoint.ssid}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              RSSI: <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {hoveredPoint.rssi} dBm
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Position: ({hoveredPoint.x}, {hoveredPoint.y})
            </div>
            {hoveredPoint.room_name && (
              <div style={{ color: 'var(--text-secondary)' }}>
                Room: {hoveredPoint.room_name}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        marginTop: 'var(--space-lg)',
        padding: 'var(--space-md) var(--space-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Signal Strength:</span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flex: 1,
          height: '16px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {Array.from({ length: 50 }, (_, i) => {
            const rssi = -90 + (i / 49) * 70;
            const [r, g, b] = rssiToColor(rssi);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '100%',
                  background: `rgb(${r}, ${g}, ${b})`,
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>-90 dBm (weak)</span>
          <span>-20 dBm (strong)</span>
        </div>
      </div>
    </div>
  );
}
