# Chronicle — build plan

MVP broken into batches. **Each batch ends with a hard testing gate — the next batch does not start until the current one's gate passes.** See `constraints.md` for the testing standards these gates draw on, and `requirements.md` for what each feature needs to do.

## Batch 0 — Project scaffolding

**Scope:** Expo + TypeScript init, feature-first folder structure, ESLint/Prettier/husky, CI (lint + typecheck + test on every push), Jest configured, empty app shell running on the Android emulator.
**Gate:** CI green on a trivial smoke test. App launches on the Android emulator and shows a blank "Chronicle" screen.

## Batch 1 — Data model & local storage

**Scope:** SQLite schema for domains, child stats, XP events, quests, quest completions. Migration tooling. Typed repository layer.
**Gate:** Unit tests for every repository method (CRUD + migration up/down), ≥90% coverage on this layer. Manual check: a seed script populates a fresh DB and every query round-trips correctly.

## Batch 2 — Stat engine (XP, leveling, decay)

**Scope:** Pure-logic module: XP-to-level curve, decay calculation from last-active timestamp, title/tier unlock thresholds. Zero UI.
**Gate:** Exhaustive unit tests including edge cases — exact level boundary, multi-day decay, decay across an app-reinstall date gap. No merge without a test for every branch of the decay formula.

## Batch 3 — Quest engine

**Scope:** Template quest bank (seeded content, ~5–10 quests per domain), daily selection algorithm (one per domain plus boss-quest chance), completion → XP event wiring.
**Gate:** Unit tests for the selection algorithm (no domain ever skipped, boss-quest frequency within spec, no duplicate quest same day). Integration test: completing a quest updates the correct stat through the Batch 2 engine.

## Batch 4 — Character Sheet screen (Home)

**Scope:** Reusable, data-driven 5-axis radar chart component (not hardcoded to specific domain names), domain list with level/progress bars, matching `design/chronicle-ui-style-guide.html`.
**Gate:** Component tests confirming the chart renders the correct axis count and values purely from props. Manual QA on the Android emulator checked against the style guide.

## Batch 5 — Domain detail screen

**Scope:** Generic N-axis child radar chart, child stat list, decay indicator, XP bar.
**Gate:** Component tests confirming the chart adapts cleanly to 3, 4, or 5 child stats. Manual QA: navigate Home → a domain → back, and verify the data stays consistent.

## Batch 6 — Daily Quests screen

**Scope:** Quest card list wired to the Batch 3 engine, checkbox completion, boss-quest flag, daily progress summary.
**Gate:** End-to-end test (Detox/Maestro) covering the golden path: complete all 5 quests in a day, verify stats update and a level-up fires when a threshold is crossed. This is the core loop — it must be green before continuing.

## Batch 7 — Notifications

**Scope:** Local push scheduling (daily quest reminder, decay nudge), permission request flow.
**Gate:** Manual QA on-device confirming notifications fire at the scheduled time. Unit tests on the scheduling logic (no double-scheduling, respects any quiet-hours setting if implemented).

## Batch 8 — Health/Fit auto-import

**Scope:** Read-only HealthKit (iOS) / Google Fit (Android) integration feeding the Fitness and Sleep child stats.
**Gate:** Manual QA on both platforms with real permission grants. Unit tests for the mapping layer (raw health data → stat delta) run against fixture data, since live health APIs can't run in CI.

## Batch 9 — Backup / export-import

**Scope:** JSON export via the OS share sheet; import with validation and conflict handling (importing into a non-empty database).
**Gate:** Unit tests for the export/import round-trip (export then import reproduces identical state) and for rejecting a malformed or corrupted file.

## Batch 10 — Polish pass

**Scope:** Accessibility audit, performance pass on a real mid-tier Android device, empty states, error boundaries.
**Gate:** Full regression run of the entire test suite, plus a manual pass through every screen with a screen reader enabled.

## Explicitly deferred (Phase 2 — not part of this plan)

- Supabase cloud sync, accounts, multi-device support
- Online AI-personalized quest generation
- Public-release readiness (onboarding for other users, store listing, monetization)
