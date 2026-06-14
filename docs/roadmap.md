# Roadmap

## Phase 1 — Manual Signal Mapping (Current)

The MVP: a fully functional web app for manually recording and visualising Wi-Fi signal strength.

- [x] Project structure and documentation
- [x] React + Vite frontend with dark-mode UI
- [x] Express + SQLite backend with REST API
- [x] Dashboard with summary statistics
- [x] Manual reading form (floor, room, coordinates, SSID, RSSI)
- [x] Readings table with all recorded data
- [x] 2D canvas heatmap with IDW interpolation
- [x] 3D visualiser with React Three Fiber
- [x] Sample data for immediate demonstration

## Phase 2 — ESP32 Live Data Feeds

Connect ESP32 microcontrollers to stream Wi-Fi CSI and RSSI data in real time.

- [ ] ESP32-S3 firmware for CSI capture (Arduino/ESP-IDF)
- [ ] Device registration and authentication API
- [ ] HTTP POST endpoint for device readings
- [ ] WebSocket or SSE for live frontend updates
- [ ] Time-series storage for high-frequency data
- [ ] Live heatmap that updates as readings arrive
- [ ] Device management page (status, battery, last seen)
- [ ] Multi-device support (mesh of ESP32 boards)

## Phase 3 — Analytics & Experimental Sensing

Advanced features for signal analysis and experimental indoor sensing.

- [ ] Signal strength over time charts
- [ ] Coverage gap detection and alerts
- [ ] CSI amplitude/phase visualisation
- [ ] Experimental presence detection (room occupied yes/no)
- [ ] Signal propagation modelling
- [ ] Export data as CSV/JSON
- [ ] Shareable reports

## Non-Goals

These features are explicitly **out of scope**:

- ❌ Identifying specific people or devices without consent
- ❌ Through-wall imaging or surveillance
- ❌ Intercepting or decoding network traffic
- ❌ Any feature that could be used to spy on others
- ❌ Cloud-hosted data storage (local-only by design)
