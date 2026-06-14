# WaveSight

**Visualising wireless environments in 2D and 3D.**

WaveSight is an experimental platform for collecting Wi-Fi signal-strength measurements inside your own home or office, then rendering them as interactive 2D heatmaps and 3D visualisations. It is designed for personal use on your own network and premises.

> **Safety notice:** This tool maps Wi-Fi signal coverage in spaces you own or have permission to survey. It does **not** see through walls, identify people, or perform any form of surveillance. See [Privacy & Safety](docs/privacy-and-safety.md) for full details.

---

## Features

- 📐 **Floor & room layout** — define floors, rooms, and dimensions
- 📡 **Manual signal readings** — record SSID, RSSI (dBm), device, location
- 🗺️ **2D heatmap** — canvas-based signal-strength visualisation with interpolation
- 🏠 **3D visualiser** — interactive Three.js scene with colour-coded signal markers
- 📊 **Dashboard** — overview stats: total readings, strongest/weakest rooms
- 🔌 **ESP32 ready** — designed for future CSI/RSSI live-feed integration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Vite · TypeScript |
| 3D | React Three Fiber · Three.js |
| Backend | Node.js · Express · TypeScript |
| Database | SQLite (better-sqlite3) |
| Heatmap | HTML Canvas · IDW interpolation |

## Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### 1. Clone the repo

```bash
git clone https://github.com/reachaki/WaveSight.git
cd WaveSight
```

### 2. Start the backend

```bash
cd server
npm install
npm run dev
```

The API runs at `http://localhost:3001`. On first start it creates `wavesight.db` and seeds it with sample data from `data/sample-measurements.json`.

### 3. Start the frontend

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Project Structure

```
WaveSight/
├── apps/
│   └── web/              # React + Vite frontend
├── server/               # Express + SQLite backend
├── data/
│   └── sample-measurements.json
├── docs/
│   ├── architecture.md
│   ├── roadmap.md
│   └── privacy-and-safety.md
├── hardware/
│   └── esp32-csi-notes.md
├── assets/               # Images, screenshots
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/floors` | List all floors with rooms |
| POST | `/api/floors` | Create a floor |
| GET | `/api/readings` | List all readings (with filters) |
| POST | `/api/readings` | Add a new reading |

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full plan.

- **Phase 1** ✅ Manual readings, heatmap, 3D visualiser
- **Phase 2** 🔜 ESP32 CSI live data feeds
- **Phase 3** 📋 Presence sensing, analytics, time-series

## Safety & Privacy

This project is built for mapping **your own** Wi-Fi coverage. It:

- ✅ Records signal strength you manually enter
- ✅ Stores data locally in SQLite
- ✅ Runs entirely on your local machine
- ❌ Does **not** see through walls
- ❌ Does **not** identify or track people
- ❌ Does **not** intercept network traffic
- ❌ Does **not** connect to external services

See [docs/privacy-and-safety.md](docs/privacy-and-safety.md) for the complete policy.

## License

MIT
