# Chronicle — requirements (v2, web rebuild)

Supersedes the original React Native/Expo version of this document. Core game rules (domains, XP,
leveling, decay, quests) are unchanged; platform and a few supporting services are not.

## 1. Vision

Gamify daily life as an RPG character sheet. Real habits and behaviors across five life domains are
tracked as stats; completing daily quests earns XP that levels those stats up over time.

## 2. Platform

- React web app (Vite + React + TypeScript, strict mode), running in a desktop or mobile browser
- No native app — no React Native, no Expo, no app-store install
- Responsive layout: usable on both desktop and mobile browser widths

## 3. Stat system

- 5 top-level domains, each rendered as its own spider/radar chart:
  - **Health** → Fitness, Nutrition, Sleep, Mental wellbeing
  - **Career** → Skill-building, Deep work, Networking
  - **Relationships** → Family, Friends, Partner
  - **Finance** → Savings, Spending discipline, Income growth
  - **Growth** → Learning, Reflection, Creative pursuits
- Leveling is per-stat only — there is no single combined character level
- New players start at level 1 across every stat and child stat
- Leveling up unlocks a cosmetic title (e.g. Novice → Adept → Master) **and** new quest tiers
- Decay: a neglected stat decays moderately (noticeable after 1–2 missed days, steady drop until
  re-engagement); no floor, no pause/vacation mode in MVP

## 4. Quests

- Every template quest is active every day — no daily rotation or random selection; completing
  any of them earns XP toward that quest's domain
- Mixed tone: mostly easy/low-friction quests, plus each domain's template bank includes one
  harder "boss quest" worth more XP
- Optional priority tag on a quest template (P1/P2) exists in the data model but currently has no
  behavioral effect, since nothing is excluded from the daily set anymore
- Generation model: a template bank drives quests; when the AI-personalization layer ships
  (Phase 2), it periodically refreshes/customizes the bank when the device is online
- A starter bank of ~5–10 template quests per domain is drafted as part of the quest-engine batch,
  with more added over time per user request

## 5. Data & sync

- **Firebase Firestore** is the data store — no local SQLite, no offline-only requirement
- **Firebase Auth, Google sign-in only** — every user has a real account; there is no anonymous/
  no-login mode
- **Multi-device sync is in MVP now** (previously Phase 2): signing in on a second device shows the
  same character sheet, quests, and history
- Manual JSON export/import is dropped — Firestore is itself the durable copy, so the local backup
  safety net from the SQLite version no longer serves a purpose
- Firestore's built-in offline cache gives basic resilience to flaky connectivity, but full offline
  operation (e.g. completing quests with no network at all, ever) is not a requirement

## 6. Health/fitness input

- No HealthKit/Google Fit/Health Connect integration — there is no browser API for on-device health
  data, and this is a web app now
- Replaced with **manual entry**: a simple form where the user logs today's steps, sleep duration,
  and exercise minutes; the same category of mapping logic (steps/sleep/exercise → a Fitness/Sleep
  stat delta) still applies, just fed by a form instead of a device API

## 7. Notifications

- Best-effort **Web Notifications API** — daily quest reminder and decay/streak nudges
- Explicit, known limitation: browsers cannot reliably fire a notification on a schedule if the tab
  or browser is fully closed. This works well while the app is open in a tab, and inconsistently
  across browsers/OSes when backgrounded; there is no equivalent to the old app's guaranteed
  native-OS-scheduled delivery
- Exact timing/frequency is an implementation decision for the notifications batch, not pinned here

## 8. Visual identity

- Fantasy/parchment skeuomorphic aesthetic, carried over from the original style guide —
  reference: [design/chronicle-ui-style-guide.html](design/chronicle-ui-style-guide.html) — translated
  from React Native `StyleSheet` to CSS
- App name: **Chronicle**

## 9. Audience & scope

- Primary user is the developer, for personal use; multi-device sync exists for that one person's
  convenience (phone browser + laptop browser), not for a multi-tenant public product
- Content (domains, child stats, quest bank) is data-driven rather than hardcoded, so a public
  release later doesn't require a rewrite — but public-release polish itself (onboarding for other
  users, monetization) is out of scope for now

## 10. In scope for MVP

- Stat/domain data model, spider charts, per-stat leveling, decay
- Daily quest generation (template-based) and completion flow
- Firebase Auth (Google sign-in) + Firestore as the data store, with multi-device sync
- Manual activity-entry form feeding Fitness/Sleep stat deltas
- Best-effort Web Notifications
- Firebase Hosting deployment

## 11. Explicitly out of scope for MVP (Phase 2+)

- Any non-Google sign-in method (email/password, other OAuth providers)
- Online AI-personalized quest generation (MVP ships template-bank-only)
- Vacation/pause mode for decay
- Public release readiness (onboarding for other users, store/marketing listing, monetization)
- True offline-first operation (Firestore's default local cache is enough for MVP)
