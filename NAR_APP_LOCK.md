# NĀR — Permanent App Lock

## Canonical source of truth

- Repository: `smilemangaphotography-svg/apps`
- Permanent branch: `nar-main`
- Baseline: commit `dc424d80137b341e104d05e22e2e5004d74c1a16`
- Baseline lineage: NĀR Mix 4.5 → NĀR Mix 4.6 → current canonical NĀR
- Android source is extracted from `ILIA-SAFE-SOURCE.bin` and updated by the NĀR patch chain.

## Non-negotiable rule

There is ONE NĀR app. Future work must update this app. Do not generate a separate replacement app, separate source ZIP, parallel NĀR project, or unrelated rebuild when the request is an update.

## Identity lock

Treat the existing Android identity, stored user data, navigation model, catalog, and owner/admin state as persistent. The existing Java package path previously validated by the build is `com.iliaperformance.narowner2026`. Do not change package/application identity, reset storage, or discard catalog/admin data unless explicitly approved as a migration.

## Required workflow for every future change

1. Start from the latest `nar-main` commit.
2. Make the smallest change needed to the existing app.
3. Preserve all previously approved functionality unless the new request explicitly replaces it.
4. Record the change in `NAR_CHANGELOG.md` with status and commit.
5. Build the same NĀR application through the canonical GitHub Actions workflow.
6. Do not treat a mockup or preview as a new app source.
7. If a change fails, fix or revert that change; do not abandon the app and start another NĀR project.

## Update constraints

- **One lineage:** all releases descend from `nar-main`.
- **No silent resets:** never replace working source with an older snapshot.
- **No feature loss:** existing features remain unless explicitly removed.
- **Data preservation:** local persistence must remain compatible or be migrated.
- **UI lock:** approved mockups are design requirements applied to the existing app, not permission to rebuild from scratch.
- **Admin lock:** owner/admin editing remains part of the same app.
- **Catalog lock:** catalog data must not be accidentally deleted, reduced, or replaced.
- **Build lock:** a change is not considered complete until the canonical app builds successfully.
- **History lock:** every material update gets a descriptive Git commit and changelog entry.

## Release gate

Before calling an update complete, verify at minimum:

- App installs/builds as the same NĀR application.
- Launch/age screen opens and enters the app.
- Bottom navigation works: Home, Search, Mix, GPT, Learn, My NĀR (for every item currently enabled).
- Learn navigation is specifically tested because it has been reported broken.
- Flavor search/detail opens.
- Owner Studio opens.
- Flavor editing and image/cover controls remain available.
- Existing saved/local data is not intentionally cleared.
- JavaScript syntax validation passes.
- APK artifact and SHA-256 checksum are produced.

## Version policy

Use sequential versions. Never reuse a version label for materially different code. A future NĀR 4.7 must be an update of 4.6/canonical, not a new app.
