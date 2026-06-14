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

function rssiToColor(rssi: number): string {
  const t = Math.max(0, Math.min(1, (rssi + 90) / 70));
  if (t > 0.66) return '#34d399';
  if (t > 0.33) return '#fbbf24';
  return '#f87171';
}

function rssiToHeight(rssi: number): number {
  // Map RSSI to height: -20 dBm → 3m, -90 dBm → 0.2m
  const t = Math.max(0, Math.min(1, (rssi + 90) / 70));
  return 0.2 + t * 2.8;
}

/** Animated floating measurement sphere */
function SignalMarker({ position, rssi, label, ssid, roomName }: {
  position: [number, number, number];
  rssi: number;
  label: string | null;
  ssid: string;
  roomName: string | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = rssiToColor(rssi);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5 + position[0] * 2) * 0.05;
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
        <sphereGeometry args={[hovered ? 0.2 : 0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Vertical line from floor to marker */}
      <mesh position={[position[0], position[1] / 2, position[2]]}>
        <cylinderGeometry args={[0.015, 0.015, position[1], 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {/* Floor circle indicator */}
      <mesh position={[position[0], 0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Label on hover */}
      {hovered && (
        <Text
          position={[position[0], position[1] + 0.4, position[2]]}
          fontSize={0.18}
          color="#f1f5f9"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#0a0e17"
        >
          {`${label || ssid} · ${rssi} dBm${roomName ? ` · ${roomName}` : ''}`}
        </Text>
      )}

      {/* RSSI label (always visible) */}
      <Text
        position={[position[0], position[1] + 0.25, position[2]]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.015}
        outlineColor="#0a0e17"
      >
        {`${rssi}`}
      </Text>
    </group>
  );
}

/** Semi-transparent room walls */
function RoomWalls({ room, yOffset }: {
  room: { name: string; x: number; y: number; width: number; height: number };
  yOffset: number;
}) {
  const wallHeight = 2.5;
  const wallThickness = 0.06;
  const wallColor = '#38bdf8';
  const opacity = 0.12;

  // Centre of the room in 3D (x → x, y → z in 3D)
  const cx = room.x + room.width / 2;
  const cz = room.y + room.height / 2;

  return (
    <group position={[0, yOffset, 0]}>
      {/* Front wall (along x-axis at room.y) */}
      <mesh position={[cx, wallHeight / 2, room.y]}>
        <boxGeometry args={[room.width, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} transparent opacity={opacity} />
      </mesh>
      {/* Back wall */}
      <mesh position={[cx, wallHeight / 2, room.y + room.height]}>
        <boxGeometry args={[room.width, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} transparent opacity={opacity} />
      </mesh>
      {/* Left wall */}
      <mesh position={[room.x, wallHeight / 2, cz]}>
        <boxGeometry args={[wallThickness, wallHeight, room.height]} />
        <meshStandardMaterial color={wallColor} transparent opacity={opacity} />
      </mesh>
      {/* Right wall */}
      <mesh position={[room.x + room.width, wallHeight / 2, cz]}>
        <boxGeometry args={[wallThickness, wallHeight, room.height]} />
        <meshStandardMaterial color={wallColor} transparent opacity={opacity} />
      </mesh>
      {/* Room label on floor */}
      <Text
        position={[cx, 0.02, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        color="rgba(148, 163, 184, 0.5)"
        anchorX="center"
        anchorY="middle"
      >
        {room.name}
      </Text>
    </group>
  );
}

/** Floor plane */
function FloorPlane({ width, height }: { width: number; height: number }) {
  return (
    <mesh position={[width / 2, 0, height / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color="#111827"
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** The full 3D scene */
function Scene({ floor, readings }: { floor: Floor; readings: Reading[] }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.6} castShadow />
      <pointLight position={[floor.width / 2, 5, floor.height / 2]} intensity={0.3} color="#38bdf8" />

      {/* Floor */}
      <FloorPlane width={floor.width} height={floor.height} />

      {/* Grid */}
      <Grid
        position={[floor.width / 2, 0.005, floor.height / 2]}
        args={[floor.width, floor.height]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={30}
        infiniteGrid={false}
      />

      {/* Room walls */}
      {floor.rooms.map(room => (
        <RoomWalls key={room.id} room={room} yOffset={0} />
      ))}

      {/* Signal markers */}
      {readings.map(r => (
        <SignalMarker
          key={r.reading_id}
          position={[r.x, rssiToHeight(r.rssi), r.y]}
          rssi={r.rssi}
          label={r.label}
          ssid={r.ssid}
          roomName={r.room_name}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        target={[floor.width / 2, 1, floor.height / 2]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={3}
        maxDistance={30}
      />
    </>
  );
}

export default function Visualiser3D() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('');

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

  return (
    <div>
      <div className="page-header">
        <h2>3D Visualiser</h2>
        <p>Interactive 3D view of your Wi-Fi signal measurements</p>
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
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {floorReadings.length} markers · Drag to rotate · Scroll to zoom
        </span>
      </div>

      {/* 3D Canvas */}
      <div className="card" style={{
        height: '600px',
        padding: 0,
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
      }}>
        {selectedFloor ? (
          <Canvas
            camera={{
              position: [selectedFloor.width * 0.8, 8, selectedFloor.height * 1.2],
              fov: 50,
              near: 0.1,
              far: 100,
            }}
            style={{ background: '#0a0e17' }}
          >
            <Scene floor={selectedFloor} readings={floorReadings} />
          </Canvas>
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
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Marker Height & Colour:</span>
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
          · Higher markers = stronger signal · Hover for details
        </span>
      </div>
    </div>
  );
}
