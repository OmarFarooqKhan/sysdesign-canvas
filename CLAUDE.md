# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Hard rules (from the project owner)

- **100-line cap.** Every `.ts` / `.tsx` **source** file must stay at or under
  100 lines. No exceptions — when a file approaches the limit, split the logic
  into a new small module rather than letting it grow. **Test files
  (`*.test.ts(x)`) are exempt.**
- **Separate the logic.** Keep each module focused on a single responsibility.
  Prefer adding a new small module over expanding an existing one.
- **Latest packages.** Use the latest stable version of every dependency to
  minimise security risk. Dependabot (`.github/dependabot.yml`) keeps npm
  packages and workflow actions current.
- **Keep docs simple.** The README stays short and to the point.

## Architecture

- **React 19 + Vite**, TypeScript, no other UI framework.
- **State is plain, serializable data** — components render declaratively from
  it. Two contexts:
  - `store/GraphContext.tsx` — the undoable graph (nodes/edges/regions).
  - `store/UIContext.tsx` — non-undoable UI state (selection, edge mode).
- **Undo/redo** is a custom `useReducer` history wrapper (`store/history.ts`),
  no external library. A drag/resize coalesces into one undo entry via
  "sessions": the first move pushes a baseline, later moves replace `present`,
  and `END_SESSION` (dispatched on pointer-up) closes the group.
- `data/` holds static data (icons, palette, templates); `lib/` holds pure
  helpers (geometry, io, dom); `hooks/` holds reusable interaction hooks.

## Testing

- **Vitest + React Testing Library + jsdom.** Interaction is tested with real
  pointer/keyboard events, not internal calls.
- Coverage is enforced at **100%** (`vitest.config.ts` thresholds). `App.tsx`
  and `components/Canvas.tsx` are excluded — they are integration glue covered
  by (deferred) integration tests, not unit tests.

## Before committing

- `npm run test:coverage` — all tests pass at 100% coverage.
- `npm run build` — passes `tsc` (strict, no-unused) and the Vite build.
- Deploys run automatically via GitHub Actions on push to `main` (audit →
  tests → build → deploy).
