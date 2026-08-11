# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Hard rules (from the project owner)

- **100-line cap.** Every `.ts` / `.tsx` file must stay at or under 100 lines.
  No exceptions — when a file approaches the limit, split the logic into a new
  small module rather than letting it grow.
- **Separate the logic.** Keep each module focused on a single responsibility
  (e.g. node CRUD and node interaction wiring live in different files). Prefer
  adding a new small module over expanding an existing one.
- **Keep docs simple.** The README stays short and to the point.

## Project shape

- Vanilla TypeScript + Vite, no UI framework.
- Shared mutable state lives in `src/state.ts`; never reassign its exported
  containers (mutate them in place).
- `npm run build` type-checks under `strict` (plus no-unused locals/params)
  and bundles to `dist/`.

## Before committing

- Run `npm run build` — it must pass both `tsc` and the Vite build.
- Deploys happen automatically via GitHub Actions on push to `main`.
