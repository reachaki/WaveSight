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

                    Future:
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
- **Heatmap**: Custom HTML Canvas renderer with inverse-distance weighting (IDW)
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
- **rooms** — rectangular areas within a floor
- **measurement_points** — x/y/z coordinates where readings are taken
- **wifi_readings** — SSID, RSSI, device info linked to a measurement point

### Data Flow

1. User creates a floor and rooms via the frontend
2. User adds measurement points with coordinates
3. User records Wi-Fi readings at each point
4. Frontend fetches readings from the API
5. Heatmap page interpolates values across the floor grid
6. 3D visualiser renders the floor, rooms, and signal markers

### Future: ESP32 Integration

ESP32 devices will POST readings directly to the backend API using the same `/api/readings` endpoint. The backend will need:

- Authentication tokens for device identification
- Rate limiting for high-frequency CSI data
- Time-series storage optimisation
- WebSocket or SSE for live updates to the frontend

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| SQLite over PostgreSQL | Zero-config, local-only, perfect for personal tool |
| better-sqlite3 over sql.js | Native bindings, synchronous API, much faster |
| Express over FastAPI | Same language (TS) as frontend, simpler monorepo |
| Canvas over D3/Leaflet | Lightweight, no map tiles needed for indoor use |
| React Three Fiber over raw Three.js | Declarative JSX, fits React paradigm |
