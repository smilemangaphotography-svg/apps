# ILIA COACH — Garmin Watch Companion

Target device: Garmin vívoactive 5 (Connect IQ product id `vivoactive5`)

Connect IQ app id: `6f45763b-8a9e-4e7f-a70d-a0d915f6d013`

## Purpose

This is the watch companion for the official ILIA COACH Android app.

The watch UI is intentionally smaller than the phone app. The phone remains the place for AI Coach, plan editing, exercise upload, equipment management, anatomical motion library, detailed ratings and analytics.

The watch is optimized for execution during a session:

- Today's workout
- Exercise-by-exercise set / rep display
- Rest timer
- Next / previous exercise
- Haptic set feedback
- Run recording
- Live pace / distance / heart rate
- Target-pace coaching: SPEED UP / ON PACE / SLOW DOWN
- Haptic pace cues
- BLE plan sync protocol scaffold for the Android ILIA COACH app

## Controls on vívoactive 5

- Tap / Enter: select, complete set, or start/stop run
- Swipe up/down: move selection or change exercise
- Back: return to Home
- Menu during a rest timer: skip rest

## Phone sync payload

The watch accepts a Connect IQ phone-app message in this format:

```
{
  "type": "plan",
  "plan": {
    "title": "Lower Strength",
    "duration": 45,
    "exercises": [
      {"name":"45 Leg Press","sets":4,"reps":"8-12","rest":90},
      {"name":"Step-Up","sets":3,"reps":"10 / side","rest":75}
    ],
    "run": {
      "distanceKm": 10.0,
      "targetPaceSec": 310
    }
  }
}
```

The Sync Phone action transmits:

```
{"type":"sync_request","app":"ILIA_COACH","version":"0.1.0"}
```

## Build

Garmin's Connect IQ SDK is licensed separately. Install the official Connect IQ SDK Manager and use the latest SDK.

From this directory after Garmin's SDK is active:

```bash
openssl genrsa -out developer_key.pem 4096
openssl pkcs8 -topk8 -inform PEM -outform DER -in developer_key.pem -out developer_key.der -nocrypt

monkeyc -d vivoactive5 -f monkey.jungle -o bin/ILIA-COACH-vivoactive5.prg -y developer_key.der
```

Run in simulator:

```bash
connectiq
monkeydo bin/ILIA-COACH-vivoactive5.prg vivoactive5
```

For Connect IQ Store distribution, export the project to an `.iq` package with Garmin's official tooling.

## Version

Watch companion source: 0.1.0
Phone production line: ILIA COACH 3.0.0
