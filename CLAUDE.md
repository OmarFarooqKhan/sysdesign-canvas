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
- **Tests live under `src/test/`, never next to source.** Mirror the source
  subfolder inside it (e.g. `src/lib/geometry.ts` → `src/test/lib/geometry.test.ts`).
  This keeps `src/components/`, `src/lib/`, etc. holding only implementation
  files. `src/test/setup.ts` (the Vitest/RTL setup file, wired in
  `vitest.config.ts`) stays at the root of that folder, not in a subfolder.
- **No visual/manual inspection after building a feature.** Once a change
  compiles, typechecks, and its tests pass, that's the deliverable — don't
  spend a turn opening the app in a browser/simulator to eyeball it "just to
  be sure." Verification is `npm run test:coverage` + `npm run build` (see
  *Before committing* below). Leave visual review of the running app to the
  human.

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

## File & folder structure

Verified against the working tree; keep this in sync when files move.

```
sysdesign-canvas/
├── src/
│   ├── main.tsx              # Vite entry point, mounts <App>
│   ├── App.tsx                # top-level layout, wires providers + Canvas
│   ├── types.ts                # shared domain types (GraphState, GraphNode, Edge, DbTable, ...)
│   ├── vite-env.d.ts
│   ├── index.css               # global styles
│   ├── components/
│   │   ├── Canvas.tsx           # main drop/drag surface (integration glue, untested directly)
│   │   ├── ContextMenu.tsx
│   │   ├── EdgeLayer.tsx        # renders all edges + handles edge interactions
│   │   ├── EdgeView.tsx         # single edge (path + arrowhead + drag-to-bend)
│   │   ├── EmptyState.tsx
│   │   ├── Icon.tsx
│   │   ├── LinkPreview.tsx      # in-progress link-drag preview arrow
│   │   ├── Marquee.tsx          # drag-to-select rectangle (+ useMarquee hook)
│   │   ├── NodeView.tsx
│   │   ├── Palette.tsx          # draggable component palette sidebar
│   │   ├── RegionView.tsx
│   │   ├── Toolbar.tsx
│   │   ├── ZoomControls.tsx     # floating zoom cluster (bottom-right of the canvas)
│   │   └── db/                  # SQL DB node schema editor (opened via node double-click)
│   │       ├── ColumnRow.tsx
│   │       ├── DbInspector.tsx    # modal shell: open/save/cancel/Escape
│   │       ├── StringList.tsx     # shared indexes/constraints chip editor
│   │       ├── TableEditor.tsx
│   │       └── dbModel.ts          # pure table/column CRUD helpers, isDbNode, dbTableCount
│   ├── data/
│   │   ├── icons.ts              # icon set for palette/nodes
│   │   ├── palette.ts             # palette entries (component types)
│   │   └── templates.ts            # starter graph templates
│   ├── hooks/
│   │   ├── useKeyboard.ts          # undo/redo/delete (incl. group delete) shortcuts
│   │   ├── useLinkDrag.ts           # port-to-port edge-creation drag, per NodeView
│   │   ├── useNodeDrag.ts            # node drag, incl. group move for a multi-selection
│   │   └── usePointerDrag.ts          # shared pointer drag/resize/session logic
│   ├── lib/
│   │   ├── dom.ts                    # small DOM helpers
│   │   ├── edgeBend.ts                # edge midpoint/bend-delta helpers for drag-to-bend
│   │   ├── geometry.ts                 # node/edge coordinate math (anchors, insets, paths)
│   │   ├── io.ts                        # JSON export/import (download/parse/toData)
│   │   ├── selection.ts                  # rect math + node snapshot helpers (marquee, group move)
│   │   └── viewport.ts                    # zoom clamp/step, coordinate conversion, fit-to-view
│   ├── store/
│   │   ├── GraphContext.tsx            # undoable graph state provider
│   │   ├── UIContext.tsx                # non-undoable UI state (selection incl. multi-select)
│   │   ├── ViewportContext.tsx           # non-undoable, non-serialized zoom/pan/pan-mode state
│   │   ├── actions.ts                    # graph action creators + helpers
│   │   ├── graphReducer.ts                # pure reducer for graph actions
│   │   └── history.ts                      # generic useReducer undo/redo wrapper
│   └── test/                                # ALL tests live here, mirroring src/ subfolders
│       ├── setup.ts                          # RTL/jest-dom setup (wired via vitest.config.ts)
│       ├── components/*.test.tsx (+ db/*.test.tsx)
│       ├── data/templates.test.ts
│       ├── hooks/*.test.tsx
│       ├── lib/*.test.ts
│       └── store/*.test.(ts|tsx)
├── .github/
│   ├── dependabot.yml           # keeps npm + workflow actions current
│   └── workflows/deploy.yml     # push to main → audit → test → build → deploy (GitHub Pages)
├── index.html
├── vite.config.ts
├── vitest.config.ts             # coverage thresholds (100%), setupFiles, excludes .claude/ worktrees
├── tsconfig.json                # strict, noUnusedLocals/Parameters, no emit
├── package.json
└── README.md
```

## Testing

- **Vitest + React Testing Library + jsdom.** Interaction is tested with real
  pointer/keyboard events, not internal calls.
- Coverage is enforced at **100%** (`vitest.config.ts` thresholds). `App.tsx`
  and `components/Canvas.tsx` are excluded — they are integration glue covered
  by (deferred) integration tests, not unit tests.
- Test files live under `src/test/`, one subfolder per mirrored source
  directory (see *File & folder structure* above) — see the tests-location
  rule above.

## Before committing

- `npm run test:coverage` — all tests pass at 100% coverage.
- `npm run build` — passes `tsc` (strict, no-unused) and the Vite build.
- Deploys run automatically via GitHub Actions on push to `main` (audit →
  tests → build → deploy).
