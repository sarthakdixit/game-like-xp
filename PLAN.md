# Chronicle — build plan (v2, web rebuild)

Supersedes the React Native/Expo build plan. MVP broken into batches. **Each batch ends with a hard
testing gate — the next batch does not start until the current one's gate passes.** See
`constraints.md` for the testing standards these gates draw on, and `requirements.md` for what each
feature needs to do.

## Batch 0 — Project scaffolding

**Scope:** Vite + React + TypeScript init, feature-first folder structure, ESLint/Prettier/husky, CI
(lint + typecheck + test on every push), Vitest configured, empty app shell running in the browser.
**Gate:** CI green on a trivial smoke test. App launches via `npm run dev` and shows a blank
"Chronicle" screen.

## Batch 1 — Firebase project, Auth, and hosting skeleton

**Scope:** Create the Firebase project (user does this in their own browser/console — not something
an agent can do on their behalf), wire up the Firebase SDK, Google sign-in via Firebase Auth, a
signed-in/signed-out app shell, and a minimal Firestore security-rules file that denies all access
by default.
**Gate:** Manual QA: sign in with Google, see a signed-in shell; sign out, see a signed-out shell.
Unit tests for any pure auth-state-derivation logic. Security rules reviewed by hand (no automated
gate for rules yet — that lands with Batch 2's data model).

## Batch 2 — Data model & Firestore repository layer

**Scope:** Typed Firestore collections for domains, child stats, quests, daily quests, XP events —
all scoped under `users/{uid}/...`. Typed repository layer with a fake/test-double seam (mirroring
the old `SqliteClient` pattern) so business logic and hooks don't need a real Firebase project to
test. Firestore security rules enforcing per-user isolation.
**Gate:** Unit tests for every repository method against the fake double, ≥90% coverage on this
layer. Manual check: a seed script populates a fresh signed-in user's Firestore data and every query
round-trips correctly. Security rules tested with the Firebase emulator (reject cross-user reads).

## Batch 3 — Stat engine (XP, leveling, decay)

**Scope:** Pure-logic module, rewritten from scratch: XP-to-level curve, decay calculation from
last-active timestamp, title/tier unlock thresholds. Zero UI, zero Firebase imports.
**Gate:** Exhaustive unit tests including edge cases — exact level boundary, multi-day decay, decay
across a long gap. No merge without a test for every branch of the decay formula.

## Batch 4 — Quest engine

**Scope:** Template quest bank (seeded content, ~5–10 quests per domain), daily selection algorithm
(one per domain plus boss-quest chance), completion → XP event wiring, all rewritten against the new
Firestore repository layer.
**Gate:** Unit tests for the selection algorithm (no domain ever skipped, boss-quest frequency
within spec, no duplicate quest same day). Integration test: completing a quest updates the correct
stat through the Batch 3 engine.

## Batch 5 — Character Sheet screen (Home)

**Scope:** Reusable, data-driven 5-axis radar chart component (plain SVG, not hardcoded to specific
domain names), domain list with level/progress bars, matching `design/chronicle-ui-style-guide.html`
translated to CSS.
**Gate:** Component tests confirming the chart renders the correct axis count and values purely from
props. Manual QA in a desktop and a mobile-width browser, checked against the style guide.

## Batch 6 — Domain detail screen

**Scope:** Generic N-axis child radar chart, child stat list, decay indicator, XP bar.
**Gate:** Component tests confirming the chart adapts cleanly to 3, 4, or 5 child stats. Manual QA:
navigate Home → a domain → back, and verify the data stays consistent.

## Batch 7 — Daily Quests screen

**Scope:** Quest card list wired to the Batch 4 engine, checkbox completion, boss-quest flag, daily
progress summary.
**Gate:** End-to-end test (Playwright) covering the golden path: sign in, complete all 5 quests in a
day, verify stats update and a level-up fires when a threshold is crossed. This is the core loop —
it must be green before continuing.

## Batch 8 — Web Notifications

**Scope:** Web Notifications API permission flow, best-effort quest reminder and decay/streak nudge
scheduling while the tab is open/backgrounded.
**Gate:** Manual QA confirming notifications fire while the app is open in a tab. Unit tests on the
scheduling logic (no double-scheduling, respects any quiet-hours setting if implemented). The
known browser limitation (no delivery once the tab/browser is fully closed) is documented, not
"fixed."

## Batch 9 — Manual activity entry

**Scope:** A form for logging today's steps, sleep duration, and exercise minutes, feeding a
rewritten mapping layer (steps/sleep/exercise → a Fitness/Sleep stat delta) — replaces the old
native HealthKit/Health Connect auto-import.
**Gate:** Unit tests for the mapping layer against fixture inputs, covering the tier boundaries.
Component test for the form (validation, submit, idempotent-per-day behavior).

## Batch 10 — Firebase Hosting deployment

**Scope:** Production build pipeline, Firebase Hosting config, `firebase deploy`, environment-based
config for local vs. deployed Firebase project.
**Gate:** Manual QA on the deployed URL: sign in, see real data, complete a quest, confirm it
persists across a reload.

## Batch 11 — Polish pass

**Scope:** Accessibility audit (keyboard navigation + screen reader), responsive check across
desktop and mobile browser widths, empty states, error boundaries.
**Gate:** Full regression run of the entire test suite, plus a manual pass through every screen with
a screen reader enabled and with mouse-only/keyboard-only input.

## Explicitly deferred (Phase 2 — not part of this plan)

- Email/password or other OAuth sign-in methods beyond Google
- Online AI-personalized quest generation
- Vacation/pause mode for decay
- Public-release readiness (onboarding for other users, store/marketing listing, monetization)
