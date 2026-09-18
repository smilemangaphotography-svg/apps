# ILIA COACH Garmin Companion Architecture

## Device target
The first production target is Garmin vívoactive 5:
- Product id: `vivoactive5`
- 390x390 round AMOLED
- Touch + Enter/Menu/Esc inputs
- Connect IQ watch-app runtime

## Split of responsibilities

### Android ILIA COACH
Owns:
- AI Coach
- My Plan / Recommended / AI Recommended
- real calendar planning
- exercise ratings and substitutions
- exercise upload
- equipment manager
- anatomical motion library
- plan history and analytics

### Garmin companion
Owns:
- today's execution view
- exercise / set / rep progression
- rest timing
- run recording
- current pace, distance and heart rate
- pace guidance
- haptic feedback
- local copy of the latest phone plan

## Sync contract
Communication uses Garmin Connect IQ Communications over the phone/watch BLE bridge.

The watch app requests a sync with `sync_request`.
The Android app will respond with a compact `plan` dictionary.
The watch persists the plan in Application.Storage so the workout remains available when the phone is not nearby.

## Safety
The watch does not independently redesign the plan. It executes the plan received from ILIA COACH. Live Run Coach cues compare actual pace with the selected target pace only.
