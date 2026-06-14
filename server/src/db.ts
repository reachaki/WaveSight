import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'wavesight.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS floors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level INTEGER DEFAULT 0,
      width REAL DEFAULT 10,
      height REAL DEFAULT 10,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      floor_id TEXT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      x REAL DEFAULT 0,
      y REAL DEFAULT 0,
      width REAL DEFAULT 3,
      height REAL DEFAULT 3,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS measurement_points (
      id TEXT PRIMARY KEY,
      floor_id TEXT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
      room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      z REAL DEFAULT 0,
      label TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wifi_readings (
      id TEXT PRIMARY KEY,
      point_id TEXT NOT NULL REFERENCES measurement_points(id) ON DELETE CASCADE,
      ssid TEXT NOT NULL,
      rssi INTEGER NOT NULL,
      frequency_mhz INTEGER,
      channel INTEGER,
      device_name TEXT,
      notes TEXT,
      recorded_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Database schema initialised');
}
