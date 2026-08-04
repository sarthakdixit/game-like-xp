# Chronicle — engineering constraints (v2, web rebuild)

Coding standards for this project. Follow these by default; deviations need a reason written down
in the PR/commit, not just convenience. Supersedes the React Native/Expo version of this document.

## Language & tooling

- TypeScript in `strict` mode. No implicit `any`. `// @ts-ignore` (or `@ts-expect-error`) requires a
  one-line comment explaining why.
- Vite + React (web). No React Native, no Expo.
- One package manager, chosen at Batch 0 and locked — commit the lockfile, don't mix `npm` and
  `yarn`/`pnpm` artifacts.
- Node version pinned in `.nvmrc`.

## Code style

- ESLint (flat config) with the standard React + TypeScript rule sets; extend it, don't fight it
  with sweeping rule overrides.
- Prettier for formatting, enforced pre-commit via husky + lint-staged — not left to reviewer
  nitpicking.
- Functional components and hooks only. No class components.
- Named exports for components and modules — no default exports. Easier to refactor and auto-import.
- Absolute imports via `tsconfig`/Vite path aliases (`@/features/...`), not long `../../../` chains.

## Project structure

- Feature-first folders (`src/features/quests`, `src/features/stats`, ...), not type-first folders
  that scatter one feature's files across unrelated buckets.
- Shared, reusable UI primitives live in `src/ui`.
- Business logic — XP curves, decay math, leveling thresholds, quest selection — lives in plain
  TypeScript with zero React or Firebase imports. If testing a formula requires rendering a
  component or hitting Firestore, the code is structured wrong.

## State & data

- Firestore behind a typed repository/service layer — no raw Firestore calls inline in components.
- Data is scoped per signed-in user (e.g. `users/{uid}/domains/{domainId}`, ...); every read/write
  path includes the current `uid`, and Firestore security rules enforce that a user can only read/
  write their own subtree — never trust the client alone for this.
- Components call hooks/services; services call the Firestore layer. No direct Firestore access
  from a component.
- Firestore's client SDK is mocked/faked in tests via a thin interface (same seam pattern as the
  old `SqliteClient`), so business logic and hooks are testable without a real Firebase project.

## Testing

- Unit tests: Vitest, colocated as `*.test.ts` next to the source file.
- Component tests: React Testing Library (web), asserting behavior (what the user sees/does) rather
  than implementation details or snapshot-only coverage for logic-bearing components.
- E2E: Playwright, covering the golden path (sign in → complete a quest → stat updates → level-up
  fires).
- Coverage gate: 80% minimum on `src/domain` (pure business logic). No fixed percentage is enforced
  on UI glue code, but every new component ships with at least a render + interaction test.
- A batch is not "done" until its tests pass — see `PLAN.md` for the per-batch testing gate.

## Git & review

- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `refactor:`, ...).
- One short-lived branch per batch; merge only after its testing gate passes and CI is green.
- CI (lint + typecheck + test) is required before merge, even solo — it's the thing that catches
  regressions a solo dev won't notice by eye.

## Privacy & security

- No analytics/telemetry SDK without explicit, separate opt-in — this app stores personal health,
  financial, and relationship data.
- No secrets committed in plaintext. Firebase web config (`apiKey`, etc.) is not a secret in the
  traditional sense — it's meant to ship to the client — but Firestore security rules are the real
  access-control boundary and must be reviewed whenever the data model changes.
- No user's data is ever readable by another user; enforced in Firestore security rules, not just
  client-side query scoping.

## Performance

- No blocking synchronous work on large Firestore result sets — paginate or limit stat-history
  queries.
- Radar chart and list rendering should stay smooth on both desktop and a mid-tier mobile browser.

## Accessibility

- Every interactive element (quest checkboxes, buttons, nav) has an accessible label. Screen-reader
  parity is a day-one default, not a later pass — it costs little to do now and a lot to retrofit.
- Keyboard navigation works for every interactive element (a web-specific requirement that didn't
  apply to the native app).
