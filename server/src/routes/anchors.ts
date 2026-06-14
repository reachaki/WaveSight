import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';

export const anchorsRouter = Router();

interface AnchorRow {
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

// GET /api/anchors — list all anchors
anchorsRouter.get('/anchors', (req: Request, res: Response) => {
  const db = getDb();
  const { floor_id } = req.query;

  let query = `
    SELECT a.id, a.floor_id, f.name as floor_name, a.device_name, a.room_name, a.x, a.y, a.z, a.device_type, a.notes, a.created_at
    FROM anchors a
    JOIN floors f ON a.floor_id = f.id
  `;
  const params: unknown[] = [];

  if (floor_id) {
    query += ' WHERE a.floor_id = ?';
    params.push(floor_id);
  }

  query += ' ORDER BY a.created_at DESC';

  try {
    const anchors = db.prepare(query).all(...params) as AnchorRow[];
    res.json(anchors);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /api/anchors — register a new anchor
anchorsRouter.post('/anchors', (req: Request, res: Response) => {
  const db = getDb();
  const {
    floor_id,
    floor_name,
    device_name,
    room_name,
    x,
    y,
    z = 0,
    device_type,
    notes
  } = req.body;

  if ((!floor_id && !floor_name) || !device_name || !room_name || x === undefined || y === undefined || !device_type) {
    res.status(400).json({ error: 'Required fields: floor_id (or floor_name), device_name, room_name, x, y, device_type' });
    return;
  }

  const insertFloor = db.prepare(`
    INSERT INTO floors (id, name, level, width, height) VALUES (?, ?, ?, ?, ?)
  `);

  const insertAnchor = db.prepare(`
    INSERT INTO anchors (id, floor_id, device_name, room_name, x, y, z, device_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
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
      throw new Error('Floor resolution failed');
    }

    const anchorId = uuidv4();
    insertAnchor.run(
      anchorId,
      resolvedFloorId,
      device_name,
      room_name,
      parseFloat(x),
      parseFloat(y),
      parseFloat(z),
      device_type,
      notes || null
    );

    return anchorId;
  });

  try {
    const anchorId = transaction();
    res.status(201).json({ message: 'Anchor registered successfully', id: anchorId });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// DELETE /api/anchors/:id — delete an anchor
anchorsRouter.delete('/anchors/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  try {
    const info = db.prepare('DELETE FROM anchors WHERE id = ?').run(id);
    if (info.changes === 0) {
      res.status(404).json({ error: 'Anchor not found' });
    } else {
      res.json({ message: 'Anchor deleted successfully' });
    }
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
