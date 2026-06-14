import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const demoRouter = Router();

interface SampleFloor {
  id: string;
  name: string;
  level: number;
  width: number;
  height: number;
}

interface SampleAnchor {
  id: string;
  floor_id: string;
  device_name: string;
  room_name: string;
  x: number;
  y: number;
  z: number;
  device_type: string;
  notes?: string;
}

interface SampleMeasurement {
  floor_id: string;
  anchor_id?: string | null;
  x: number;
  y: number;
  z: number;
  label: string;
  ssid: string;
  rssi: number;
  frequency_mhz: number;
  channel: number;
  device_name: string;
  notes: string;
}

interface SampleData {
  floors: SampleFloor[];
  anchors?: SampleAnchor[];
  measurements: SampleMeasurement[];
}

demoRouter.get('/demo-data', (_req: Request, res: Response) => {
  const samplePath = path.join(__dirname, '..', '..', '..', 'data', 'sample-measurements.json');

  if (!fs.existsSync(samplePath)) {
    return res.status(404).json({ error: 'Demo measurements data file not found' });
  }

  const raw = fs.readFileSync(samplePath, 'utf-8');
  const data: SampleData = JSON.parse(raw);

  // 1. Filter out real anchors (keep only those starting with standard demo keys)
  const demoAnchors = (data.anchors || []).filter(a => !a.id.startsWith('anchor-real-'));
  const demoFloors = data.floors;

  // 2. Map measurements to the standard ReadingRow shape
  const floorsMap = new Map(demoFloors.map(f => [f.id, f.name]));
  const anchorsMap = new Map(demoAnchors.map(a => [a.id, a.device_name]));

  const demoReadings = data.measurements.map((m, index) => {
    // Only link to demo anchors
    const isDemoAnchor = m.anchor_id ? !m.anchor_id.startsWith('anchor-real-') : false;
    
    return {
      reading_id: `demo-reading-${index}`,
      ssid: m.ssid,
      rssi: m.rssi,
      frequency_mhz: m.frequency_mhz || null,
      channel: m.channel || null,
      device_name: m.device_name || null,
      notes: m.notes || null,
      recorded_at: new Date(Date.now() - index * 600000).toISOString(),
      point_id: `demo-point-${index}`,
      x: m.x,
      y: m.y,
      z: m.z,
      label: m.label || null,
      floor_id: m.floor_id,
      floor_name: floorsMap.get(m.floor_id) || 'Ground Floor',
      room_id: null,
      room_name: null,
      anchor_id: isDemoAnchor ? m.anchor_id : null,
      anchor_name: isDemoAnchor ? anchorsMap.get(m.anchor_id!) || null : null
    };
  });

  // 3. Compute dashboard metrics for demo data dynamically
  const totalReadings = demoReadings.length;
  const totalAnchors = demoAnchors.length;

  const sortedByRssi = [...demoReadings].sort((a, b) => b.rssi - a.rssi);
  const strongest = sortedByRssi[0] || null;
  const weakest = sortedByRssi[sortedByRssi.length - 1] || null;
  const latest = demoReadings[0] || null;

  // Group devices for Active Devices list
  const deviceGroups = new Map<string, typeof demoReadings[0]>();
  for (const r of demoReadings) {
    const key = `${r.device_name}-${r.ssid}`;
    if (!deviceGroups.has(key)) {
      deviceGroups.set(key, r);
    }
  }

  const activeDevices = Array.from(deviceGroups.values()).map((d, index) => {
    const hash = (d.device_name || 'unknown').charCodeAt(0) + (d.ssid || '').charCodeAt(0);
    const macPrefix = "00:1A:2B:3C:4D";
    const macHex = (hash % 256).toString(16).padStart(2, '0').toUpperCase();
    const macAddress = `${macPrefix}:${macHex}`;
    const ipAddress = `192.168.1.${10 + (hash % 200)}`;
    const connectionType = hash % 2 === 0 ? 'Wi-Fi 6 (802.11ax)' : 'Wi-Fi 5 (802.11ac)';

    return {
      deviceName: d.device_name || 'Discovered Router / AP',
      macAddress,
      ipAddress,
      connectionType,
      rssi: d.rssi,
      lastSeen: d.recorded_at,
      assignedLocation: `${d.floor_name} at (${d.x.toFixed(1)}m, ${d.y.toFixed(1)}m)`
    };
  });

  res.json({
    floors: demoFloors,
    anchors: demoAnchors,
    readings: demoReadings,
    dashboard: {
      totalReadings,
      totalAnchors,
      strongestPoint: strongest ? {
        rssi: strongest.rssi,
        label: `${strongest.ssid} (${strongest.floor_name} at ${strongest.x}x, ${strongest.y}y)`
      } : null,
      weakestPoint: weakest ? {
        rssi: weakest.rssi,
        label: `${weakest.ssid} (${weakest.floor_name} at ${weakest.x}x, ${weakest.y}y)`
      } : null,
      lastReading: latest ? {
        ssid: latest.ssid,
        rssi: latest.rssi,
        label: `${latest.floor_name} at (${latest.x}m, ${latest.y}m)`,
        time: latest.recorded_at
      } : null,
      activeDevices
    }
  });
});
