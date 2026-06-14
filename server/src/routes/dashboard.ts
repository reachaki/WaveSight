import { Router, Request, Response } from 'express';
import { getDb } from '../db';

export const dashboardRouter = Router();

interface PointReading {
  rssi: number;
  x: number;
  y: number;
  z: number;
  floor_name: string;
  ssid: string;
  device_name: string | null;
  recorded_at: string;
}

interface DeviceRow {
  device_name: string;
  ssid: string;
  rssi: number;
  x: number;
  y: number;
  floor_name: string;
  recorded_at: string;
}

// GET /api/dashboard — summary stats for the dashboard
dashboardRouter.get('/dashboard', (_req: Request, res: Response) => {
  const db = getDb();

  // Total readings
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM wifi_readings').get() as { count: number };

  // Strongest reading point
  const strongestPoint = db.prepare(`
    SELECT wr.rssi, mp.x, mp.y, mp.z, f.name as floor_name, wr.ssid, wr.device_name, wr.recorded_at
    FROM wifi_readings wr
    JOIN measurement_points mp ON wr.point_id = mp.id
    JOIN floors f ON mp.floor_id = f.id
    ORDER BY wr.rssi DESC
    LIMIT 1
  `).get() as PointReading | undefined;

  // Weakest reading point
  const weakestPoint = db.prepare(`
    SELECT wr.rssi, mp.x, mp.y, mp.z, f.name as floor_name, wr.ssid, wr.device_name, wr.recorded_at
    FROM wifi_readings wr
    JOIN measurement_points mp ON wr.point_id = mp.id
    JOIN floors f ON mp.floor_id = f.id
    ORDER BY wr.rssi ASC
    LIMIT 1
  `).get() as PointReading | undefined;

  // Last reading
  const lastReading = db.prepare(`
    SELECT wr.rssi, mp.x, mp.y, mp.z, f.name as floor_name, wr.ssid, wr.device_name, wr.recorded_at
    FROM wifi_readings wr
    JOIN measurement_points mp ON wr.point_id = mp.id
    JOIN floors f ON mp.floor_id = f.id
    ORDER BY wr.recorded_at DESC
    LIMIT 1
  `).get() as PointReading | undefined;

  // Device list (discovered devices from readings)
  // Standard routers/devices info
  const devices = db.prepare(`
    SELECT 
      wr.device_name, 
      wr.ssid, 
      wr.rssi, 
      mp.x, 
      mp.y, 
      f.name as floor_name, 
      wr.recorded_at
    FROM wifi_readings wr
    JOIN measurement_points mp ON wr.point_id = mp.id
    JOIN floors f ON mp.floor_id = f.id
    GROUP BY wr.device_name, wr.ssid
    ORDER BY wr.recorded_at DESC
  `).all() as DeviceRow[];

  // Format device list for Stage 1: Active Devices
  // Generate mock details (MAC/IP/Conn Type) derived from device names where missing
  const activeDevices = devices.map((d, index) => {
    // Generate a deterministically hashed MAC/IP/Connection Type based on device/SSID
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

  // Total anchors
  const anchorsCount = db.prepare('SELECT COUNT(*) as count FROM anchors').get() as { count: number };

  res.json({
    totalReadings: totalRow.count,
    totalAnchors: anchorsCount.count,
    strongestPoint: strongestPoint ? {
      rssi: strongestPoint.rssi,
      label: `${strongestPoint.ssid} (${strongestPoint.floor_name} at ${strongestPoint.x}x, ${strongestPoint.y}y)`
    } : null,
    weakestPoint: weakestPoint ? {
      rssi: weakestPoint.rssi,
      label: `${weakestPoint.ssid} (${weakestPoint.floor_name} at ${weakestPoint.x}x, ${weakestPoint.y}y)`
    } : null,
    lastReading: lastReading ? {
      ssid: lastReading.ssid,
      rssi: lastReading.rssi,
      label: `${lastReading.floor_name} at (${lastReading.x}m, ${lastReading.y}m)`,
      time: lastReading.recorded_at
    } : null,
    activeDevices
  });
});
