# PHOTO MASTER AI secure backend

Beta 0.13 and later are backend-only. The Android app must never contain or request an OpenAI API key.

## Deploy target
Deploy `PHOTO-MASTER-AI/backend` as a Vercel project.

## Required server environment
- `OPENAI_API_KEY` — server-side only
- optional `OPENAI_IMAGE_MODEL` — defaults to the backend's configured image model

## Endpoints
- `GET /api/health` — returns cloud readiness
- `POST /api/edit` — accepts the app image-edit payload and returns generated image data

## Android build configuration
Set GitHub Actions secret `PHOTO_MASTER_AI_ENDPOINT` to the production HTTPS edit endpoint, for example `https://<backend-host>/api/edit`.

The Beta 0.13 workflow intentionally refuses to build a functional APK when this endpoint is missing. This prevents distributing an app that looks connected but cannot perform AI edits.
