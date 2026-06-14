import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db';

interface SampleFloor {
  id: string;
  name: string;
  level: number;
  width: number;
  height: number;
}

interface SampleRoom {
  id: string;
  floor_id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SampleMeasurement {
  floor_id: string;
  anchor_id?: string | null;
  room_id?: string | null;
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

interface SampleData {
  floors: SampleFloor[];
  anchors?: SampleAnchor[];
  rooms?: SampleRoom[];
  measurements: SampleMeasurement[];
}

export function seedIfEmpty(): void {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as count FROM floors').get() as { count: number };

  if (count.count > 0) {
    console.log('📊 Database already has data, skipping seed');
    return;
  }

  const samplePath = path.join(__dirname, '..', '..', 'data', 'sample-measurements.json');

  if (!fs.existsSync(samplePath)) {
    console.log('⚠️  No sample data file found at', samplePath);
    return;
  }

  const raw = fs.readFileSync(samplePath, 'utf-8');
  const data: SampleData = JSON.parse(raw);

  const insertFloor = db.prepare(`
    INSERT INTO floors (id, name, level, width, height) VALUES (?, ?, ?, ?, ?)
  `);
  const insertAnchor = db.prepare(`
    INSERT INTO anchors (id, floor_id, device_name, room_name, x, y, z, device_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPoint = db.prepare(`
    INSERT INTO measurement_points (id, floor_id, room_id, x, y, z, label) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertReading = db.prepare(`
    INSERT INTO wifi_readings (id, point_id, anchor_id, ssid, rssi, frequency_mhz, channel, device_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    // Insert floors
    for (const floor of data.floors) {
      insertFloor.run(floor.id, floor.name, floor.level, floor.width, floor.height);
    }

    // Insert anchors
    if (data.anchors) {
      for (const anchor of data.anchors) {
        insertAnchor.run(
          anchor.id,
          anchor.floor_id,
          anchor.device_name,
          anchor.room_name,
          anchor.x,
          anchor.y,
          anchor.z,
          anchor.device_type,
          anchor.notes || null
        );
      }
    }

    // Insert measurements
    for (const m of data.measurements) {
      const pointId = uuidv4();
      insertPoint.run(pointId, m.floor_id, null, m.x, m.y, m.z, m.label);
      insertReading.run(
        uuidv4(),
        pointId,
        m.anchor_id || null,
        m.ssid,
        m.rssi,
        m.frequency_mhz,
        m.channel,
        m.device_name,
        m.notes
      );
    }
  });

  transaction();
  console.log(`🌱 Seeded database with ${data.floors.length} floors, ${(data.anchors || []).length} anchors, ${data.measurements.length} readings`);
}

// Allow running directly: npx tsx src/seed.ts
if (require.main === module) {
  seedIfEmpty();
  console.log('Done.');
}
