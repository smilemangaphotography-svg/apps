# ChatGPT Shortcut Editor — Beta 0.12 PhotoRoom Flow Lock

This is a functional patch to the existing canonical app lineage. It is not a redesign.

## Locked behavior
- E-Commerce 1:1 uses a true square Add Photo, Processing and Result frame.
- Instagram 1:1 uses a true square Add Photo, Processing and Result frame.
- Instagram 9:16 uses a true vertical 9:16 Add Photo, Processing and Result frame.
- Wedding, Architecture, Portrait, Fix Only and Auto use free/original preview behavior.
- Uploaded images start in Fit/Contain and remain fully visible in the Add Photo preview.
- Add Photo header displays the selected category and output/crop mode.
- Photo Library, Camera and Files remain functional.
- The existing automatic Add Photo → Processing flow is preserved.
- Before/After, variations, Regenerate, Refine, Save, History, Favorites, Saved Presets, Custom Masters, Reference Match and Android Back must remain functional.
- API configuration remains secondary under Settings → API & Account.
- Samsung Galaxy A54 safe-area behavior remains mandatory.

## Release gate
Do not call 0.12 passed unless CI verifies package `com.ilia.photomasterai`, version `0.12.0-beta`, required UI assets, and successful Android compilation. Device acceptance additionally requires checking E-Commerce 1:1, Instagram 1:1, Instagram 9:16, Wedding Free Crop, Refine and Save on the Samsung Galaxy A54.
