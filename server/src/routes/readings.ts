import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';

export const readingsRouter = Router();

interface ReadingRow {
  reading_id: string;
  ssid: string;
  rssi: number;
  frequency_mhz: number | null;
  channel: number | null;
  device_name: string | null;
  notes: string | null;
  recorded_at: string;
  point_id: string;
  x: number;
  y: number;
  z: number;
  label: string | null;
  floor_id: string;
  floor_name: string;
  room_id: string | null;
  room_name: string | null;
  anchor_id: string | null;
  anchor_name: string | null;
}

// GET /api/readings — list all readings with point/floor/room info
readingsRouter.get('/readings', (req: Request, res: Response) => {
  const db = getDb();
  const { floor_id, room_id, ssid } = req.query;

  let query = `
    SELECT
      wr.id as reading_id,
      wr.ssid,
      wr.rssi,
      wr.frequency_mhz,
      wr.channel,
      wr.device_name,
      wr.notes,
      wr.recorded_at,
      mp.id as point_id,
      mp.x,
      mp.y,
      mp.z,
      mp.label,
      f.id as floor_id,
      f.name as floor_name,
      r.id as room_id,
      r.name as room_name,
      a.id as anchor_id,
      a.device_name as anchor_name
    FROM wifi_readings wr
    JOIN measurement_points mp ON wr.point_id = mp.id
    JOIN floors f ON mp.floor_id = f.id
    LEFT JOIN rooms r ON mp.room_id = r.id
    LEFT JOIN anchors a ON wr.anchor_id = a.id
  `;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (floor_id) {
    conditions.push('f.id = ?');
    params.push(floor_id);
  }
  if (room_id) {
    conditions.push('r.id = ?');
    params.push(room_id);
  }
  if (ssid) {
    conditions.push('wr.ssid = ?');
    params.push(ssid);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY wr.recorded_at DESC';

  const readings = db.prepare(query).all(...params) as ReadingRow[];
  res.json(readings);
});

// POST /api/readings — add a new reading
readingsRouter.post('/readings', (req: Request, res: Response) => {
  const db = getDb();
  const {
    floor_id,
    floor_name,
    room_id,
    room_name,
    anchor_id,
    x,
    y,
    z = 0,
    label,
    ssid,
    rssi,
    frequency_mhz,
    channel,
    device_name,
    notes,
  } = req.body;

  // Validate required fields
  if (!ssid || rssi === undefined || x === undefined || y === undefined) {
    res.status(400).json({
      error: 'Required fields: ssid, rssi, x, y. Also need floor_id or floor_name.',
    });
    return;
  }

  const insertFloor = db.prepare(`
    INSERT INTO floors (id, name, level, width, height) VALUES (?, ?, ?, ?, ?)
  `);
  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, floor_id, name, x, y, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPoint = db.prepare(`
    INSERT INTO measurement_points (id, floor_id, room_id, x, y, z, label) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertReading = db.prepare(`
    INSERT INTO wifi_readings (id, point_id, anchor_id, ssid, rssi, frequency_mhz, channel, device_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    // Resolve or create floor
    let resolvedFloorId = floor_id as string | undefined;
    if (!resolvedFloorId && floor_name) {
      const existing = db.prepare('SELECT id FROM floors WHERE name = ?').get(floor_name) as { id: string } | undefined;
      if (existing) {
        resolvedFloorId = existing.id;
      } else {
        resolvedFloorId = uuidv4();
        insertFloor.run(resolvedFloorId, floor_name, 0, 10, 10);
      }
    }

    if (!resolvedFloorId) {
      throw new Error('Either floor_id or floor_name is required');
    }

    // Resolve or create room
    let resolvedRoomId = room_id as string | undefined;
    if (!resolvedRoomId && room_name) {
      const existing = db.prepare('SELECT id FROM rooms WHERE name = ? AND floor_id = ?').get(room_name, resolvedFloorId) as { id: string } | undefined;
      if (existing) {
        resolvedRoomId = existing.id;
      } else {
        resolvedRoomId = uuidv4();
        insertRoom.run(resolvedRoomId, resolvedFloorId, room_name, 0, 0, 3, 3);
      }
    }

    // Create measurement point
    const pointId = uuidv4();
    insertPoint.run(pointId, resolvedFloorId, resolvedRoomId || null, x, y, z, label || null);

    // Create reading
    const readingId = uuidv4();
    insertReading.run(
      readingId,
      pointId,
      anchor_id || null,
      ssid,
      rssi,
      frequency_mhz || null,
      channel || null,
      device_name || null,
      notes || null,
    );

    return { readingId, pointId, floorId: resolvedFloorId, roomId: resolvedRoomId, anchorId: anchor_id || null };
  });

  try {
    const result = transaction();
    res.status(201).json({
      message: 'Reading created',
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});
