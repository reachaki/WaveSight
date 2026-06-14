# ESP32 CSI Integration Notes

## Overview

ESP32 Channel State Information (CSI) provides detailed sub-carrier amplitude and phase data from Wi-Fi frames. This is significantly richer than simple RSSI and can be used for experimental indoor sensing applications.

> **Important:** CSI-based sensing is experimental. Any presence or motion detection features must be used responsibly, with consent from all occupants. See [Privacy & Safety](../docs/privacy-and-safety.md).

## Recommended Hardware

| Board | CSI Support | Notes |
|-------|------------|-------|
| ESP32-S3 | ✅ Full | Best CSI support, recommended |
| ESP32-C3 | ✅ Partial | Lower cost, fewer antennas |
| ESP32 (original) | ✅ Full | Widely available, well documented |

## CSI Data Format

Each CSI reading from an ESP32 contains:

```json
{
  "device_id": "esp32-living-room-01",
  "timestamp": "2024-01-15T14:30:00Z",
  "rssi": -45,
  "mac": "AA:BB:CC:DD:EE:FF",
  "channel": 6,
  "bandwidth": 20,
  "subcarriers": 52,
  "csi_amplitude": [12.3, 15.1, 11.8, ...],
  "csi_phase": [0.42, -1.23, 0.87, ...]
}
```

## Planned Architecture

```
ESP32 Board                    WaveSight Backend
┌─────────────┐    HTTP POST   ┌─────────────────┐
│ CSI Capture  │ ─────────────► │ /api/csi/ingest │
│ (promiscuous │                │                 │
│  mode)       │                │ Store in SQLite │
└─────────────┘                │ (time-series)   │
                               └────────┬────────┘
                                        │ WebSocket
                                        ▼
                               ┌─────────────────┐
                               │ React Frontend  │
                               │ (live heatmap)  │
                               └─────────────────┘
```

## Connection Protocol

1. ESP32 boots and connects to the local Wi-Fi network
2. Device registers with the backend: `POST /api/devices/register`
3. Backend returns an auth token
4. ESP32 sends CSI readings every N seconds: `POST /api/csi/ingest`
5. Backend stores readings and notifies connected frontends via WebSocket

## Firmware Notes

**Not implemented yet.** When ready, firmware will:

- Use ESP-IDF or Arduino framework
- Enable promiscuous mode for CSI capture
- Filter for specific MACs or broadcast frames
- Batch readings and POST to backend every 1-5 seconds
- Include watchdog timer and WiFi reconnection logic
- Support OTA updates for firmware upgrades

## Useful Resources

- [ESP-IDF CSI Guide](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/wifi.html#wi-fi-channel-state-information)
- [ESP32 CSI Tool](https://github.com/espressif/esp-csi) — Espressif's official CSI toolkit
- [SenseFi](https://github.com/chenxinyan-sg/SenseFi) — Wi-Fi sensing research framework

## Phase 2 Milestones

1. [ ] Basic ESP32 firmware that POSTs RSSI to backend
2. [ ] Device registration and management API
3. [ ] CSI capture firmware with amplitude/phase extraction
4. [ ] Time-series storage in SQLite
5. [ ] Live heatmap updates via WebSocket
6. [ ] CSI amplitude visualisation chart
7. [ ] Experimental presence detection (room occupied yes/no)
