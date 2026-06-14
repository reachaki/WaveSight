# Roadmap

## Stage 1 — Active Devices & AP Discovery (Active)

Uses metadata from standard routers and operating systems to list active networking interfaces and APs.

- [x] Basic project configuration and monorepo structure
- [x] React + Vite frontend with premium dark-mode UI
- [x] Express + SQLite backend with REST API
- [x] Discovered active devices and routers table
- [x] RSSI values, MAC addresses, IP addresses, connection types, and last seen records
- [x] Optional location assignments for static network nodes

## Stage 2 — Manual Signal Scanning (Active)

Site survey mapping using abstract coordinate scanning. Does not assume physical geometry unless supplied by the user.

- [x] Form to manually enter coordinates $(x, y, z)$ and RSSI values
- [x] Click/double-click on the map canvas to immediately open the scan point dialog at those coordinates
- [x] 2D Signal Field map with IDW interpolation and real-time animated wave propagation ripples
- [x] Optional custom floorplan image uploader (local persistence)
- [x] Optional custom wall drawing utility (local persistence)
- [x] 3D Signal Field map (React Three Fiber) rendering signal intensity as marker heights, drawing flat wave ripples, and extruding custom user-drawn walls
- [x] Clear "demo data" labels on pre-seeded records

## Stage 3 — ESP32 CSI & Wave Interference Field Mapping (Planned)

High-resolution subcarrier mapping for advanced physical layer diagnostics.

- [ ] ESP32-S3 Arduino/ESP-IDF firmware for capturing Channel State Information (CSI) subcarriers
- [ ] Time-series endpoints for streaming high-frequency amplitude and phase shift metrics
- [ ] Live WebSocket telemetry updates
- [ ] 2D/3D wave interference rendering mapping phase cancellation and reinforcement contours
- [ ] Machine learning models for spatial fingerprinting and privacy-safe presence detection

## Non-Goals

These features are explicitly **out of scope**:

- ❌ Identifying or tracking specific individuals without consent
- ❌ Through-wall imaging, tracking, or surveillance
- ❌ Intercepting or decoding payload packets or network traffic
- ❌ Cloud-hosted telemetry storage (WaveSight is local-only by design)
