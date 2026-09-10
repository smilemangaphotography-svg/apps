# PHOTO MASTER AI — Beta 0.9.0

Canonical beta branch: `photo-master-ai-beta`  
Android package: `com.ilia.photomasterai`

## Purpose

PHOTO MASTER AI is a shortcut-driven AI photo editor. The approved mockups are the UI specification. The normal workflow is:

Upload → choose master category → generate → compare → refine → save.

The beta contains working UI/state for Products, Social Media, People, Spaces, Food & Drink, Fix Only, Reference Match, Custom Masters, History, Favorites, Settings and refinement.

## Security model

The Android app **does not contain an OpenAI API key**.

The app calls a secure backend URL. The backend included under `backend/api/edit.mjs` reads `OPENAI_API_KEY` only from the server environment.

For Android builds, configure the GitHub Actions secret:

- `PHOTO_MASTER_AI_ENDPOINT` — full deployed endpoint such as `https://your-domain.example/api/edit`

For the backend host, configure:

- `OPENAI_API_KEY`
- optionally `OPENAI_IMAGE_MODEL` (defaults to `gpt-image-2.5-sunburst`)
- optionally `OPENAI_IMAGE_QUALITY` (defaults to `high`)

During private beta, the backend endpoint can also be entered from Settings without rebuilding. The API key itself must never be entered into the mobile app.

## Build

GitHub Actions workflow: `.github/workflows/build-photo-master-ai-beta.yml`

Artifact:
`PHOTO-MASTER-AI-BETA-A54`

## Mockup-lock acceptance contract

- No dead visible buttons.
- No decorative/fake sliders.
- Reference Strength maps to the AI request.
- Aspect Ratio maps to output size.
- Preserve level and protection toggles alter the master prompt.
- Reference images are included in the image edit request.
- Before/After divider is interactive.
- Refine sends the current result plus the new natural-language instruction.
- History, Favorites, Custom Masters and settings persist locally.
- Android Back and in-app Back both work through browser history.
- Save writes the actual generated image to `Pictures/Photo Master AI`.
- Backend/API failures show a recoverable error; no fake generated result is substituted.

## Current beta gate

The client can be compiled and tested independently. End-to-end AI editing requires a deployed backend endpoint and a valid server-side `OPENAI_API_KEY`. The app intentionally reports a configuration error instead of faking generation if those are absent.
