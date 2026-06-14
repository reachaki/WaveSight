# Privacy & Safety

## Purpose

WaveSight is a personal tool for mapping Wi-Fi signal strength inside your own home or office. It helps you understand wireless coverage, find dead zones, and optimise router placement.

## What This Tool Does

- Records Wi-Fi signal strength (RSSI in dBm) at coordinates you specify
- Stores measurements in a local SQLite database on your computer
- Visualises signal strength as 2D signal fields and 3D scenes
- Runs entirely on your local machine — no cloud, no external services

## What This Tool Does NOT Do

- **Does not see through walls.** Wi-Fi signal mapping shows coverage strength, not images or shapes.
- **Does not identify people.** No facial recognition, no person tracking, no biometric data.
- **Does not intercept traffic.** It records signal strength metadata only, not packet contents.
- **Does not perform surveillance.** It is not designed to monitor, spy on, or track anyone.
- **Does not connect to external servers.** All data stays on your machine.
- **Does not scan neighbours' networks.** You manually enter your own network details.

## Data Handling

| Aspect | Detail |
|--------|--------|
| Storage | Local SQLite database (`wavesight.db`) |
| Location | Your machine only, never uploaded |
| Contents | Floor details, user-created rooms, coordinates, SSID names, signal strength values |
| Sensitive data | No passwords, no traffic captures, no personal identifiers |
| Deletion | Delete `wavesight.db` to remove all data |
| Sharing | Data is never shared unless you manually export and send it |

## Intended Use

This tool is intended for:

- ✅ Mapping Wi-Fi coverage in your own home
- ✅ Finding weak signal areas to improve router placement
- ✅ Learning about wireless signal propagation
- ✅ Experimenting with ESP32 CSI data for indoor sensing research
- ✅ Educational and hobbyist purposes

## Not Intended For

- ❌ Monitoring other people's homes or networks
- ❌ Tracking individuals' movements or presence without consent
- ❌ Any law enforcement or intelligence application
- ❌ Commercial surveillance products
- ❌ Anything that violates privacy laws or ethical standards

## Future ESP32 Features

When ESP32 CSI integration is added in Phase 2:

- CSI data will be processed locally only
- Any presence-detection features will be clearly labelled as experimental
- Users must have consent from all occupants before using motion/presence sensing
- No data will be transmitted to external services

## Responsible Use

By using WaveSight, you agree to:

1. Only survey spaces you own or have explicit permission to survey
2. Not use the tool to monitor or track people without their knowledge and consent
3. Comply with all applicable local laws regarding wireless monitoring
4. Use ESP32 sensing features responsibly and with occupant consent

## Contact

If you have concerns about the privacy or safety implications of this tool, please open a GitHub issue.
