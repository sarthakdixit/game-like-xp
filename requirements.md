# Chronicle — requirements

## 1. Vision

Gamify daily life as an RPG character sheet. Real habits and behaviors across five life domains are tracked as stats; completing daily quests earns XP that levels those stats up over time.

## 2. Platform

- React Native (Expo), targeting iOS and Android
- Primary dev/test target: Android
- iOS built and supported throughout, tested less frequently in early batches

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
- Decay: a neglected stat decays moderately (noticeable after 1–2 missed days, steady drop until re-engagement); no floor, no pause/vacation mode in MVP

## 4. Quests

- 5 active daily quests, one per top-level domain
- Mixed tone: mostly easy/low-friction quests plus an occasional harder "boss quest" for bigger XP
- Generation model: a local template bank drives day-to-day quests; when the AI-personalization layer ships (Phase 2), it periodically refreshes/customizes the bank when the device is online
- A starter bank of ~5–10 template quests per domain is drafted as part of Batch 3 (see PLAN.md)

## 5. Data & sync

- Local-first: SQLite on-device, fully offline-capable for all MVP functionality
- HealthKit (iOS) / Google Fit (Android) auto-import is in MVP scope, feeding the Health domain's child stats (steps, sleep, workouts)
- Manual JSON export/import via the OS share sheet ships in MVP as a backup safety net against reinstall data loss
- Cloud sync / accounts (Supabase) is explicitly **out** of MVP — Phase 2

## 6. Notifications

- Core MVP feature: daily quest delivery reminder and decay/streak nudges
- Exact timing/frequency is a Batch 7 implementation decision, not yet pinned

## 7. Visual identity

- Fantasy/parchment skeuomorphic aesthetic — reference: [design/chronicle-ui-style-guide.html](design/chronicle-ui-style-guide.html)
- App name: **Chronicle**

## 8. Audience & scope

- Primary user is the developer, for personal use
- Content (domains, child stats, quest bank) is data-driven rather than hardcoded, so a public release later doesn't require a rewrite — but public-release polish itself (onboarding for others, store listing, monetization) is out of scope for now

## 9. In scope for MVP

- Stat/domain data model, spider charts, per-stat leveling, decay
- Daily quest generation (template-based) and completion flow
- HealthKit / Google Fit auto-import for the Health domain
- Local notifications
- Local SQLite storage plus manual export/import backup

## 10. Explicitly out of scope for MVP (Phase 2+)

- Supabase cloud sync, accounts, multi-device
- Online AI-personalized quest generation (MVP ships template-bank-only)
- Vacation/pause mode for decay
- Public release readiness
