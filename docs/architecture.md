# Architecture

## Overview

WaveSight is a monorepo containing a React frontend and a Node.js/Express backend. All data is stored locally in SQLite. The system is designed to run entirely on a single machine for personal use.

## System Diagram

```
┌──────────────────┐     HTTP/REST     ┌──────────────────┐
│                  │ ◄──────────────── │                  │
│  React Frontend  │                   │  Express Backend  │
│  (Vite, port     │ ──────────────►   │  (Node.js, port  │
│   5173)          │                   │   3001)           │
└──────────────────┘                   └────────┬─────────┘
                                                │
                                                │ better-sqlite3
                                                ▼
                                       ┌──────────────────┐
                                       │   SQLite DB      │
                                       │   wavesight.db   │
                                       └──────────────────┘

                    Future (Stage 3):
                    ┌──────────────────┐
                    │  ESP32 Devices   │ ──── HTTP POST ────►  Backend
                    │  (CSI / RSSI)    │
                    └──────────────────┘
```

## Components

### Frontend (`apps/web/`)

- **Framework**: React 19 with TypeScript
- **Build tool**: Vite
- **Routing**: React Router v7
- **3D rendering**: React Three Fiber + @react-three/drei
- **Signal Field**: Custom HTML Canvas renderer with inverse-distance weighting (IDW) interpolation, real-time wave-ripple propagation, manually drawn walls, and imported floorplan image underlays.
- **Styling**: Vanilla CSS with CSS custom properties for theming

### Backend (`server/`)

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript (compiled with tsc)
- **Database**: SQLite via better-sqlite3 (synchronous, no ORM)
- **ID generation**: UUID v4

### Database Schema

Four tables form the core data model:

- **floors** — building levels with name, dimensions
- **rooms** — rectangular areas within a floor (optional, user-created only)
- **measurement_points** — x/y/z coordinates where readings are taken
- **wifi_readings** — SSID, RSSI, device info linked to a measurement point

### Data Flow

1. User creates a floor field via the frontend.
2. User records Wi-Fi scan readings at specific coordinates (either by manual coordinate entry, or by double-clicking coordinates directly on the 2D map).
3. Optionally, the user uploads a layout drawing of their space or sketches wall lines (persisted locally).
4. Frontend fetches readings from the API.
5. 2D page interpolates values across the grid using IDW and overlays animated wave ripples from signal sources.
6. 3D page renders coordinates as floating spheres, extrudes user-drawn wall paths, and projects the layout image onto the floor plane.

### ESP32 CSI Telemetry (Stage 3)

ESP32 devices will POST subcarrier telemetry directly to the backend. This data flow will utilize:

- Authentication tokens for device identification
- Rate limiting for high-frequency CSI subcarriers
- Time-series storage optimization
- WebSocket or SSE for live updates to the frontend

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| SQLite over PostgreSQL | Zero-config, local-only, perfect for personal tool |
| better-sqlite3 over sql.js | Native bindings, synchronous API, much faster |
| Express over FastAPI | Same language (TS) as frontend, simpler monorepo |
| Canvas over D3/Leaflet | Lightweight, no map tiles needed for indoor use |
| React Three Fiber over raw Three.js | Declarative JSX, fits React paradigm |
