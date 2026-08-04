# Chronicle — engineering constraints

Coding standards for this project. Follow these by default; deviations need a reason written down in the PR/commit, not just convenience.

## Language & tooling

- TypeScript in `strict` mode. No implicit `any`. `// @ts-ignore` (or `@ts-expect-error`) requires a one-line comment explaining why.
- Expo managed workflow + React Native.
- One package manager, chosen at Batch 0 and locked — commit the lockfile, don't mix `npm` and `yarn`/`pnpm` artifacts.
- Node version pinned in `.nvmrc`.

## Code style

- ESLint via Expo's official config (`eslint-config-universe`); extend it, don't fight it with sweeping rule overrides.
- Prettier for formatting, enforced pre-commit via husky + lint-staged — not left to reviewer nitpicking.
- Functional components and hooks only. No class components.
- Named exports for components and modules — no default exports. Easier to refactor and auto-import.
- Absolute imports via `tsconfig` path aliases (`@/features/...`), not long `../../../` chains.

## Project structure

- Feature-first folders (`src/features/quests`, `src/features/stats`, ...), not type-first folders that scatter one feature's files across unrelated buckets.
- Shared, reusable UI primitives live in `src/ui`.
- Business logic — XP curves, decay math, leveling thresholds — lives in plain TypeScript with zero React/React Native imports. If testing a formula requires rendering a component, the code is structured wrong.

## State & data

- SQLite behind a typed repository layer (e.g. drizzle-orm, or a thin hand-written repository). No raw SQL strings inline in UI code.
- Schema changes are numbered migrations, always. Never hand-edit an existing table in place outside a migration.
- Components call hooks/services; services call the data layer. No direct DB access from a component.

## Testing

- Unit tests: Jest, colocated as `*.test.ts` next to the source file.
- Component tests: React Native Testing Library, asserting behavior (what the user sees/does) rather than implementation details or snapshot-only coverage for logic-bearing components.
- E2E: Detox or Maestro, covering the golden path (complete a quest → stat updates → level-up fires).
- Coverage gate: 80% minimum on `src/domain` (pure business logic). No fixed percentage is enforced on UI glue code, but every new component ships with at least a render + interaction test.
- A batch is not "done" until its tests pass — see `PLAN.md` for the per-batch testing gate.

## Git & review

- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `refactor:`, ...).
- One short-lived branch per batch; merge only after its testing gate passes and CI is green.
- CI (lint + typecheck + test) is required before merge, even solo — it's the thing that catches regressions a solo dev won't notice by eye.

## Privacy & security

- No analytics/telemetry SDK without explicit, separate opt-in — this app stores personal health, financial, and relationship data.
- No secrets committed in plaintext. `.env` + `app.config.ts` for local config; EAS secrets once Phase 2 introduces Supabase keys.
- MVP relies on OS-level app sandboxing for data at rest; revisit on-device encryption if/when Phase 2 adds cloud sync.

## Performance

- No synchronous SQLite calls that block the JS thread on large datasets — paginate or batch stat-history queries.
- Radar chart and list rendering must hold 60fps on a mid-tier Android device (the primary dev/test target), not just the simulator.

## Accessibility

- Every interactive element (quest checkboxes, buttons, nav) has an accessible label. Screen-reader parity is a day-one default, not a later pass — it costs little to do now and a lot to retrofit.
