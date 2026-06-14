# WaveSight

**Visualising wireless wave fields in 2D and 3D.**

WaveSight is an experimental full-stack platform designed to map real-world Wi-Fi signal propagation. Unlike traditional mapping tools that rely on hard-coded floorplans or preset layouts, WaveSight is built around real signal collection, manual coordinates, and abstract wave-field visualisation.

> **Safety Notice:** This tool maps Wi-Fi signal coverage in spaces you own or have permission to survey. It does **not** see through walls, identify people, or perform any form of surveillance. See [Privacy & Safety](docs/privacy-and-safety.md) for full details.

---

## 🚀 Product Stages

WaveSight is designed to work in three progressive stages of wireless signal collection:

### 📶 Stage 1: Active Devices / AP Discovery (Currently Active)
Use existing Wi-Fi/router/device data where available:
- Lists discovered access points and connected clients.
- Captures SSID, RSSI (signal strength), MAC/vendor, IP address, connection type (Wi-Fi 5 / Wi-Fi 6), last seen time, and manual location assignments.
- *Note:* Standard commercial routers usually only provide limited RSSI and client device metadata.

### 📐 Stage 2: Manual Signal Scanning (Currently Active)
Perform physical site surveys:
- Walk around your environment with a phone or laptop.
- Record signal RSSI at specific coordinates $(x, y, z)$.
- Build a real-time signal field heatmap showing physical propagation.
- **No fake walls or rooms:** The grid is abstract unless you choose to upload a floorplan image underlay or draw custom walls directly onto the canvas (no hard-coded geometry).

### ⚡ Stage 3: ESP32 Channel State Information (CSI) (Future)
High-resolution physical layer telemetry:
- Multiple receivers collect CSI amplitude and phase across subcarrier frequencies.
- Backend stores high-frequency time-series signal data.
- Visualiser shows physical wave interference fields rather than simple static gradients.
- Future ML models can infer rough spatial fingerprints and presence without cameras.
- *Note:* This stage requires specialised hardware, such as ESP32-S3 development boards running custom firmware.

---

## Features

- 🌐 **2D Signal Field** — HTML Canvas-based abstract field visualiser. Supports real-time animated wave ripples, custom wall drawing, and click-to-add scan point shortcuts.
- 📡 **3D Signal Field** — Interactive Three.js (React Three Fiber) scene mapping signal strength to marker height, extruding custom walls in 3D, and animating wave propagation on the ground plane.
- 📁 **Floorplan Underlay** — Option to import a PNG/JPG floorplan image to local storage to overlay mapping on your actual space.
- 📊 **Signal Field Dashboard** — Shows total readings, peak intensity coordinates, floor noise spots, and lists discovered device telemetry.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Vite · TypeScript · React Router |
| 3D | React Three Fiber · Three.js · Drei |
| Backend | Node.js · Express · TypeScript · SQLite |
| Heatmap | HTML Canvas · IDW interpolation · Animated wave rings |

---

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

The API runs at `http://localhost:3001`. On first start, it seeds `wavesight.db` with sample data from `data/sample-measurements.json`. All sample data is clearly labeled as `[Demo Data]`.

### 3. Start the frontend

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
WaveSight/
├── apps/
│   └── web/              # React + Vite frontend (dashboard, 2D/3D signal fields)
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

---

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
