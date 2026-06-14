import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:3001/api';

interface Floor {
  id: string;
  name: string;
  width: number;
  height: number;
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

interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function rssiToColor(rssi: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (rssi + 90) / 70));
  let r: number, g: number, b: number;
  if (t > 0.66) {
    const s = (t - 0.66) / 0.34;
    r = Math.round(52 + (110 - 52) * (1 - s));
    g = Math.round(211 + (231 - 211) * (1 - s));
    b = Math.round(153 + (183 - 153) * (1 - s));
  } else if (t > 0.33) {
    const s = (t - 0.33) / 0.33;
    r = Math.round(251 - (251 - 52) * s);
    g = Math.round(191 - (191 - 211) * s);
    b = Math.round(36 + (153 - 36) * s);
  } else {
    const s = t / 0.33;
    r = Math.round(248 - (248 - 251) * s);
    g = Math.round(113 + (191 - 113) * s);
    b = Math.round(113 - (113 - 36) * s);
  }
  return [r, g, b];
}

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

    if (dist < 0.01) return p.rssi;

    const w = 1 / Math.pow(dist, power);
    weightSum += w;
    valueSum += w * p.rssi;
  }

  return weightSum > 0 ? valueSum / weightSum : -100;
}

export default function Heatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<Reading | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Floorplan background image and walls state
  const [floorplanImage, setFloorplanImage] = useState<HTMLImageElement | null>(null);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [drawMode, setDrawMode] = useState<boolean>(false);
  const [showWaves, setShowWaves] = useState<boolean>(true);

  // Drawing state
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [drawingCurrent, setDrawingCurrent] = useState<{ x: number; y: number } | null>(null);

  const SCALE = 65;
  const PADDING = 40;

  // Load floors and readings
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

  // Load persisted floorplan image & walls for selected floor
  useEffect(() => {
    if (!selectedFloorId) return;

    // Load Image
    const storedImg = localStorage.getItem(`floorplan_img_${selectedFloorId}`);
    if (storedImg) {
      const img = new Image();
      img.src = storedImg;
      img.onload = () => setFloorplanImage(img);
    } else {
      setFloorplanImage(null);
    }

    // Load Walls
    const storedWalls = localStorage.getItem(`floorplan_walls_${selectedFloorId}`);
    if (storedWalls) {
      try {
        setWalls(JSON.parse(storedWalls));
      } catch {
        setWalls([]);
      }
    } else {
      setWalls([]);
    }
  }, [selectedFloorId]);

  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  const floorReadings = readings.filter(r => r.floor_id === selectedFloorId);

  // Draw loop
  const draw = useCallback((animTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedFloor) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const floorW = selectedFloor.width;
    const floorH = selectedFloor.height;
    const canvasW = floorW * SCALE + PADDING * 2;
    const canvasH = floorH * SCALE + PADDING * 2;

    if (canvas.width !== canvasW || canvas.height !== canvasH) {
      canvas.width = canvasW;
      canvas.height = canvasH;
    }

    // 1. Background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // 2. Draw Floorplan Image (underlay) if loaded
    if (floorplanImage) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(floorplanImage, PADDING, PADDING, floorW * SCALE, floorH * SCALE);
      ctx.restore();
    }

    // 3. Render Interpolated Signal Intensity Field
    if (floorReadings.length > 0) {
      const points = floorReadings.map(r => ({ x: r.x, y: r.y, rssi: r.rssi }));
      const resolution = 3;

      for (let px = 0; px < floorW * SCALE; px += resolution) {
        for (let py = 0; py < floorH * SCALE; py += resolution) {
          const mx = px / SCALE;
          const my = py / SCALE;
          const rssi = idwInterpolate(mx, my, points);
          const [r, g, b] = rssiToColor(rssi);

          // Render with radial-like soft interpolation
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.28)`;
          ctx.fillRect(PADDING + px, PADDING + py, resolution, resolution);
        }
      }
    }

    // 4. Wave-field concentric circular propagation animation (Stage 3 vibe)
    if (showWaves && floorReadings.length > 0) {
      const timeSec = animTime * 0.0015;
      for (const reading of floorReadings) {
        const px = PADDING + reading.x * SCALE;
        const py = PADDING + reading.y * SCALE;
        const [r, g, b] = rssiToColor(reading.rssi);

        // Stronger signals propagate faster/further
        const strengthFactor = Math.max(0.2, (reading.rssi + 100) / 90);

        for (let ring = 0; ring < 3; ring++) {
          const radius = (((timeSec + ring * 1.2) * strengthFactor) % 4.0) * SCALE * 0.6;
          const maxRadius = 4.0 * SCALE * 0.6;
          const opacity = Math.max(0, 1 - radius / maxRadius) * 0.18;

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // 5. Grid overlay
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
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

    // 6. User-drawn walls
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const wall of walls) {
      ctx.beginPath();
      ctx.moveTo(PADDING + wall.x1 * SCALE, PADDING + wall.y1 * SCALE);
      ctx.lineTo(PADDING + wall.x2 * SCALE, PADDING + wall.y2 * SCALE);
      ctx.stroke();
    }

    // Draw active drawing line
    if (drawingStart && drawingCurrent) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(PADDING + drawingStart.x * SCALE, PADDING + drawingStart.y * SCALE);
      ctx.lineTo(PADDING + drawingCurrent.x * SCALE, PADDING + drawingCurrent.y * SCALE);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
    }

    // 7. Outer field boundary
    ctx.strokeStyle = isDemoMode ? 'rgba(234, 179, 8, 0.4)' : 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(PADDING, PADDING, floorW * SCALE, floorH * SCALE);

    // 8. Plot Scanned Points (Glow + dot)
    for (const reading of floorReadings) {
      const px = PADDING + reading.x * SCALE;
      const py = PADDING + reading.y * SCALE;
      const [r, g, b] = rssiToColor(reading.rssi);

      // Radial glow
      const grad = ctx.createRadialGradient(px, py, 0, px, py, 18);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fill();

      // Dot
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // RSSI value label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${reading.rssi}`, px, py - 11);
    }

    // 9. Coordinate Axis Labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let x = 0; x <= floorW; x += 2) {
      ctx.fillText(`${x}m`, PADDING + x * SCALE, PADDING - 8);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y <= floorH; y += 2) {
      ctx.fillText(`${y}m`, PADDING - 8, PADDING + y * SCALE + 4);
    }
  }, [selectedFloor, floorReadings, floorplanImage, walls, drawMode, drawingStart, drawingCurrent, showWaves, SCALE]);

  // Request Animation Frame loop
  useEffect(() => {
    let animId: number;
    const renderLoop = (timestamp: number) => {
      draw(timestamp);
      animId = requestAnimationFrame(renderLoop);
    };
    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFloorId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      localStorage.setItem(`floorplan_img_${selectedFloorId}`, result);
      const img = new Image();
      img.src = result;
      img.onload = () => setFloorplanImage(img);
    };
    reader.readAsDataURL(file);
  };

  // Clear floorplan image
  const clearFloorplan = () => {
    if (!selectedFloorId) return;
    localStorage.removeItem(`floorplan_img_${selectedFloorId}`);
    setFloorplanImage(null);
  };

  // Clear drawn walls
  const clearWalls = () => {
    if (!selectedFloorId) return;
    localStorage.removeItem(`floorplan_walls_${selectedFloorId}`);
    setWalls([]);
  };

  // Mouse interactivity handler (Coordinates, drawing, click-to-add)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedFloor) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - PADDING;
    const y = e.clientY - rect.top - PADDING;

    const mx = Math.max(0, Math.min(selectedFloor.width, x / SCALE));
    const my = Math.max(0, Math.min(selectedFloor.height, y / SCALE));

    if (drawMode) {
      setDrawingStart({ x: mx, y: my });
      setDrawingCurrent({ x: mx, y: my });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedFloor) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x: e.clientX, y: e.clientY });

    const mx = Math.max(0, Math.min(selectedFloor.width, (x - PADDING) / SCALE));
    const my = Math.max(0, Math.min(selectedFloor.height, (y - PADDING) / SCALE));

    if (drawMode && drawingStart) {
      setDrawingCurrent({ x: mx, y: my });
    }

    // Hover tooltip detection
    let closest: Reading | null = null;
    let closestDist = Infinity;
    for (const r of floorReadings) {
      const dist = Math.sqrt((mx - r.x) ** 2 + (my - r.y) ** 2);
      if (dist < 0.4 && dist < closestDist) {
        closest = r;
        closestDist = dist;
      }
    }
    setHoveredPoint(closest);
  };

  const handleMouseUp = () => {
    if (!selectedFloorId || !selectedFloor) return;

    if (drawMode && drawingStart && drawingCurrent) {
      const dx = drawingStart.x - drawingCurrent.x;
      const dy = drawingStart.y - drawingCurrent.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Save only if it's a valid line (length > 0.2m)
      if (dist > 0.2) {
        const newWall: Wall = {
          x1: parseFloat(drawingStart.x.toFixed(2)),
          y1: parseFloat(drawingStart.y.toFixed(2)),
          x2: parseFloat(drawingCurrent.x.toFixed(2)),
          y2: parseFloat(drawingCurrent.y.toFixed(2)),
        };
        const updatedWalls = [...walls, newWall];
        setWalls(updatedWalls);
        localStorage.setItem(`floorplan_walls_${selectedFloorId}`, JSON.stringify(updatedWalls));
      }
    }
    setDrawingStart(null);
    setDrawingCurrent(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedFloor || drawMode) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - PADDING;
    const y = e.clientY - rect.top - PADDING;

    const mx = Math.max(0, Math.min(selectedFloor.width, x / SCALE)).toFixed(1);
    const my = Math.max(0, Math.min(selectedFloor.height, y / SCALE)).toFixed(1);

    // Direct navigate to AddReading pre-populated with coordinates!
    navigate(`/add-reading?x=${mx}&y=${my}&floorId=${selectedFloorId}`);
  };

  const isDemoMode = selectedFloor?.name.includes('Demo') || false;

  return (
    <div>
      <div className="page-header">
        <h2>2D Signal Field</h2>
        <p>Dynamic wave propagation and signal intensity mapping. Double-click anywhere to record a live scan point.</p>
      </div>

      {/* Control bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-md)',
        flexWrap: 'wrap'
      }}>
        {/* Floor selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Floor Field:</label>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '220px' }}
            value={selectedFloorId}
            onChange={e => setSelectedFloorId(e.target.value)}
          >
            {floors.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.width}×{f.height}m)</option>
            ))}
          </select>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {floorReadings.length} scan points
          </span>
        </div>

        {/* Action Toggles */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            onClick={() => setShowWaves(!showWaves)}
            className={`btn ${showWaves ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
          >
            {showWaves ? '⏸ Stop Waves' : '▶ Animate Waves'}
          </button>

          <button
            onClick={() => setDrawMode(!drawMode)}
            className={`btn ${drawMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '6px 12px', borderColor: drawMode ? '#ef4444' : undefined }}
          >
            {drawMode ? '✏️ Drawing Walls (Click & Drag)' : '🧱 Draw Wall'}
          </button>

          {walls.length > 0 && (
            <button
              onClick={clearWalls}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '6px 12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              Clear Walls
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Visualiser canvas on left, utilities on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-lg)', alignItems: 'start' }}>
        {/* Canvas container */}
        <div className="card" style={{ overflow: 'auto', position: 'relative', background: '#070a13', border: '1px solid var(--border-subtle)', padding: 'var(--space-md)' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            style={{ display: 'block', cursor: drawMode ? 'crosshair' : 'pointer', margin: '0 auto', borderRadius: '4px' }}
          />

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div style={{
              position: 'fixed',
              left: mousePos.x + 16,
              top: mousePos.y - 16,
              background: 'rgba(10, 15, 30, 0.96)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm) var(--space-md)',
              fontSize: '0.85rem',
              pointerEvents: 'none',
              zIndex: 1000,
              backdropFilter: 'blur(8px)',
              minWidth: '200px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                {hoveredPoint.label || 'Scan Location'}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                SSID: <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{hoveredPoint.ssid}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Intensity: <span style={{ fontWeight: 600, color: '#f43f5e' }}>{hoveredPoint.rssi} dBm</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Location: ({hoveredPoint.x.toFixed(1)}m, {hoveredPoint.y.toFixed(1)}m)
              </div>
              {hoveredPoint.device_name && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                  Captured by: {hoveredPoint.device_name}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* No Floorplan Loaded alert */}
          {!floorplanImage && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.02) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)',
              fontSize: '0.85rem',
              lineHeight: '1.5',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 600, color: '#38bdf8' }}>
                <span>ℹ️</span> No floorplan loaded
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Rendering is currently positioned in an abstract grid. Import a physical layout image (PNG/JPG) below to align signals with your physical walls.
              </p>
            </div>
          )}

          {/* Underlay / Floorplan image loader */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 600 }}>Floorplan Layout Image</h4>
            {floorplanImage ? (
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Custom layout loaded and overlayed.
                </p>
                <button onClick={clearFloorplan} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '6px' }}>
                  Remove Image
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="floorplan-upload-input"
                />
                <label
                  htmlFor="floorplan-upload-input"
                  className="btn btn-secondary"
                  style={{ display: 'block', textAlign: 'center', cursor: 'pointer', fontSize: '0.8rem', padding: '8px' }}
                >
                  📁 Select Layout File
                </label>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="card" style={{ padding: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scanner Guide</h4>
            <ol style={{ paddingLeft: '14px', margin: 0, lineHeight: '1.5' }}>
              <li style={{ marginBottom: '6px' }}>Double-click on the map area to record RSSI at those coordinates.</li>
              <li style={{ marginBottom: '6px' }}>Turn on <strong>Draw Wall</strong> to sketch partition boundaries.</li>
              <li>Toggle animation using <strong>Stop Waves</strong> if CPU usage is high.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Signal Strength Legend */}
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
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Signal Intensity:</span>
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
