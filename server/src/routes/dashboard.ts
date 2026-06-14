import { Router, Request, Response } from 'express';
import { getDb } from '../db';

export const dashboardRouter = Router();

interface RoomAvg {
  room_name: string;
  avg_rssi: number;
}

interface LastReading {
  ssid: string;
  rssi: number;
  room_name: string;
  recorded_at: string;
}

// GET /api/dashboard — summary stats for the dashboard
dashboardRouter.get('/dashboard', (_req: Request, res: Response) => {
  const db = getDb();

  // Total readings
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM wifi_readings').get() as { count: number };

  // Average RSSI per room
  const roomAverages = db.prepare(`
    SELECT r.name as room_name, ROUND(AVG(wr.rssi), 1) as avg_rssi
    FROM wifi_readings wr
    JOIN measurement_points mp ON wr.point_id = mp.id
    LEFT JOIN rooms r ON mp.room_id = r.id
    WHERE r.name IS NOT NULL
    GROUP BY r.id
    ORDER BY avg_rssi DESC
  `).all() as RoomAvg[];

  // Last reading
  const lastReading = db.prepare(`
    SELECT wr.ssid, wr.rssi, r.name as room_name, wr.recorded_at
    FROM wifi_readings wr
    JOIN measurement_points mp ON wr.point_id = mp.id
    LEFT JOIN rooms r ON mp.room_id = r.id
    ORDER BY wr.recorded_at DESC
    LIMIT 1
  `).get() as LastReading | undefined;

  const strongest = roomAverages.length > 0 ? roomAverages[0] : null;
  const weakest = roomAverages.length > 0 ? roomAverages[roomAverages.length - 1] : null;

  res.json({
    totalReadings: totalRow.count,
    strongestRoom: strongest ? { name: strongest.room_name, rssi: strongest.avg_rssi } : null,
    weakestRoom: weakest ? { name: weakest.room_name, rssi: weakest.avg_rssi } : null,
    lastReading: lastReading
      ? {
          ssid: lastReading.ssid,
          rssi: lastReading.rssi,
          room: lastReading.room_name || 'Unknown',
          time: lastReading.recorded_at,
        }
      : null,
  });
});
