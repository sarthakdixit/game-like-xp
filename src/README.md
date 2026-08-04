# src layout

- `domain/` — pure TypeScript business logic (XP curves, decay, leveling, quest selection). No React or React Native imports. See `constraints.md`.
- `data/` — SQLite schema, migrations, and the typed repository layer. Components never touch the DB directly.
- `features/<name>/` — screens and feature-specific components, one folder per feature (e.g. `stats`, `quests`).
- `ui/` — shared, reusable UI primitives with no feature-specific logic.
