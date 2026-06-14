import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';

export const floorsRouter = Router();

// GET /api/floors — list all floors with their rooms
floorsRouter.get('/floors', (_req: Request, res: Response) => {
  const db = getDb();

  const floors = db.prepare(`
    SELECT id, name, level, width, height, created_at
    FROM floors
    ORDER BY level ASC
  `).all() as Array<{
    id: string;
    name: string;
    level: number;
    width: number;
    height: number;
    created_at: string;
  }>;

  const rooms = db.prepare(`
    SELECT id, floor_id, name, x, y, width, height, created_at
    FROM rooms
    ORDER BY name ASC
  `).all() as Array<{
    id: string;
    floor_id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    created_at: string;
  }>;

  const result = floors.map(floor => ({
    ...floor,
    rooms: rooms.filter(r => r.floor_id === floor.id),
  }));

  res.json(result);
});

// POST /api/floors — create a new floor (optionally with rooms)
floorsRouter.post('/floors', (req: Request, res: Response) => {
  const db = getDb();
  const { name, level = 0, width = 10, height = 10, rooms = [] } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Floor name is required' });
    return;
  }

  const floorId = uuidv4();

  const insertFloor = db.prepare(`
    INSERT INTO floors (id, name, level, width, height)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, floor_id, name, x, y, width, height)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertFloor.run(floorId, name, level, width, height);

    for (const room of rooms as Array<{ name: string; x?: number; y?: number; width?: number; height?: number }>) {
      insertRoom.run(
        uuidv4(),
        floorId,
        room.name,
        room.x ?? 0,
        room.y ?? 0,
        room.width ?? 3,
        room.height ?? 3,
      );
    }
  });

  transaction();

  res.status(201).json({ id: floorId, message: 'Floor created' });
});
