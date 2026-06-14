import { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';

const API = 'http://localhost:3001/api';

interface Floor {
  id: string;
  name: string;
  level: number;
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

function rssiToColor(rssi: number): string {
  const t = Math.max(0, Math.min(1, (rssi + 90) / 70));
  if (t > 0.66) return '#34d399';
  if (t > 0.33) return '#fbbf24';
  return '#f87171';
}

function rssiToHeight(rssi: number): number {
  // Map RSSI to height: -20 dBm → 3.2m, -90 dBm → 0.3m
  const t = Math.max(0, Math.min(1, (rssi + 90) / 70));
  return 0.3 + t * 2.9;
}

/** Animated floating measurement sphere */
function SignalMarker({ position, rssi, label, ssid, deviceName }: {
  position: [number, number, number];
  rssi: number;
  label: string | null;
  ssid: string;
  deviceName: string | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = rssiToColor(rssi);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5 + position[0] * 2) * 0.06;
    }
  });

  return (
    <group>
      {/* Glowing sphere */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hovered ? 0.22 : 0.16, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.9 : 0.45}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Vertical line from floor to marker */}
      <mesh position={[position[0], position[1] / 2, position[2]]}>
        <cylinderGeometry args={[0.012, 0.012, position[1], 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.25} />
      </mesh>

      {/* Floor circle indicator */}
      <mesh position={[position[0], 0.015, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Label on hover */}
      {hovered && (
        <Text
          position={[position[0], position[1] + 0.45, position[2]]}
          fontSize={0.18}
          color="#f8fafc"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#070a13"
        >
          {`${label || ssid} · ${rssi} dBm${deviceName ? ` · ${deviceName}` : ''}`}
        </Text>
      )}

      {/* RSSI label (always visible) */}
      <Text
        position={[position[0], position[1] + 0.28, position[2]]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.015}
        outlineColor="#070a13"
      >
        {`${rssi}`}
      </Text>
    </group>
  );
}

/** Animated wave ripple propagating on the floor plane */
function WaveRipple({ position, rssi }: { position: [number, number, number]; rssi: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const color = rssiToColor(rssi);
  const strengthFactor = Math.max(0.2, (rssi + 100) / 90);

  useFrame((state) => {
    if (ringRef.current && materialRef.current) {
      const timeSec = state.clock.getElapsedTime() * 1.5;
      const radius = (((timeSec) * strengthFactor) % 4.0) * 0.7;
      ringRef.current.scale.set(radius, radius, 1);
      
      const maxRadius = 4.0 * 0.7;
      materialRef.current.opacity = Math.max(0, 1 - radius / maxRadius) * 0.25;
    }
  });

  return (
    <mesh ref={ringRef} position={[position[0], 0.012, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.95, 1, 32]} />
      <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Extrude manually drawn walls in 3D */
function ExtrudedWall({ wall }: { wall: Wall }) {
  const { x1, y1, x2, y2 } = wall;
  const cx = (x1 + x2) / 2;
  const cz = (y1 + y2) / 2;
  
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const wallHeight = 2.0;
  const wallThickness = 0.08;

  return (
    <mesh position={[cx, wallHeight / 2, cz]} rotation={[0, -angle, 0]}>
      <boxGeometry args={[len, wallHeight, wallThickness]} />
      <meshStandardMaterial 
        color="#38bdf8" 
        transparent 
        opacity={0.35} 
        roughness={0.2} 
        metalness={0.1}
      />
    </mesh>
  );
}

/** Floor plane with optional background floorplan texture */
function FloorPlane({ width, height, texture }: { width: number; height: number; texture: THREE.Texture | null }) {
  return (
    <mesh position={[width / 2, 0, height / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      {texture ? (
        <meshStandardMaterial
          map={texture}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      ) : (
        <meshStandardMaterial
          color="#0f172a"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}

/** The full 3D scene */
function Scene({ floor, readings, walls, texture }: { 
  floor: Floor; 
  readings: Reading[]; 
  walls: Wall[];
  texture: THREE.Texture | null;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[10, 18, 10]} intensity={0.65} castShadow />
      <pointLight position={[floor.width / 2, 6, floor.height / 2]} intensity={0.4} color="#38bdf8" />

      {/* Floor */}
      <FloorPlane width={floor.width} height={floor.height} texture={texture} />

      {/* Grid */}
      <Grid
        position={[floor.width / 2, 0.005, floor.height / 2]}
        args={[floor.width, floor.height]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#38bdf8"
        fadeDistance={40}
        infiniteGrid={false}
      />

      {/* Extruded drawn walls */}
      {walls.map((wall, index) => (
        <ExtrudedWall key={index} wall={wall} />
      ))}

      {/* Wave ripples */}
      {readings.map(r => (
        <WaveRipple
          key={`ripple-${r.reading_id}`}
          position={[r.x, 0, r.y]}
          rssi={r.rssi}
        />
      ))}

      {/* Signal markers */}
      {readings.map(r => (
        <SignalMarker
          key={r.reading_id}
          position={[r.x, rssiToHeight(r.rssi), r.y]}
          rssi={r.rssi}
          label={r.label}
          ssid={r.ssid}
          deviceName={r.device_name}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        target={[floor.width / 2, 1.2, floor.height / 2]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={3}
        maxDistance={35}
      />
    </>
  );
}

export default function Visualiser3D() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('');
  
  // Floorplan image and walls state
  const [floorplanTexture, setFloorplanTexture] = useState<THREE.Texture | null>(null);
  const [walls, setWalls] = useState<Wall[]>([]);

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

  // Load custom walls and layout texture when floor changes
  useEffect(() => {
    if (!selectedFloorId) return;

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

    // Load Texture
    const storedImg = localStorage.getItem(`floorplan_img_${selectedFloorId}`);
    if (storedImg) {
      const loader = new THREE.TextureLoader();
      loader.load(storedImg, (tex) => {
        tex.minFilter = THREE.LinearFilter;
        setFloorplanTexture(tex);
      }, undefined, () => setFloorplanTexture(null));
    } else {
      setFloorplanTexture(null);
    }
  }, [selectedFloorId]);

  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  const floorReadings = readings.filter(r => r.floor_id === selectedFloorId);

  return (
    <div>
      <div className="page-header">
        <h2>3D Signal Field</h2>
        <p>Interactive 3D field visualisation mapping signal height from RSSI intensity.</p>
      </div>

      {/* Floor selector */}
      <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Floor Field:</label>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '220px' }}
          value={selectedFloorId}
          onChange={e => setSelectedFloorId(e.target.value)}
        >
          {floors.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {floorReadings.length} active signal markers · Drag to rotate · Scroll to zoom
        </span>
      </div>

      {/* 3D Canvas */}
      <div className="card" style={{
        height: '600px',
        padding: 0,
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        position: 'relative'
      }}>
        {selectedFloor ? (
          <>
            <Canvas
              camera={{
                position: [selectedFloor.width * 0.9, 10, selectedFloor.height * 1.3],
                fov: 48,
                near: 0.1,
                far: 100,
              }}
              style={{ background: '#070a13' }}
            >
              <Scene 
                floor={selectedFloor} 
                readings={floorReadings} 
                walls={walls}
                texture={floorplanTexture}
              />
            </Canvas>

            {/* Float overlay warning if no floorplan image is loaded */}
            {!floorplanTexture && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                background: 'rgba(7, 10, 19, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
                backdropFilter: 'blur(4px)'
              }}>
                No floorplan layout image loaded
              </div>
            )}
          </>
        ) : (
          <div className="loading-spinner" style={{ height: '100%' }}>
            <div className="spinner" />
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        marginTop: 'var(--space-lg)',
        padding: 'var(--space-md) var(--space-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Marker Height & Intensity:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#34d399' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Strong (high)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fair (mid)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f87171' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Weak (low)</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          · Extruded blue blocks represent custom walls · Hover markers for logs
        </span>
      </div>
    </div>
  );
}
