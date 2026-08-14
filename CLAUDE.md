# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Hard rules (from the project owner)

- **100-line cap.** Every `.ts` / `.tsx` **source** file must stay at or under
  100 lines. No exceptions — when a file approaches the limit, split the logic
  into a new small module rather than letting it grow. **Test files
  (`*.test.ts(x)`) are exempt.**
- **Separate the logic.** Keep each module focused on a single responsibility.
  Prefer adding a new small module over expanding an existing one.
- **No `any`.** Never use the TypeScript `any` type (including `as any`) —
  find or write a real type instead (e.g. an intersection cast for a CSS
  custom property, a proper generic, `unknown` + a narrowing check). Enforced
  by `npm run check:no-any` (`scripts/check-no-any.mjs`) — see *Before
  committing* below. It's a text-based check (strips comments/strings, then
  regexes for the keyword), not a real parser: `typescript-eslint` doesn't
  support TypeScript 7 yet (peer range `<6.1.0`, which the *Latest packages*
  rule below rules out installing anyway), and TS 7's own public API dropped
  the classic `createSourceFile`/`forEachChild` surface a hand-rolled AST
  walk would need. Revisit this once either catches up.
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

## Feature requests → feature-writer agent

Whenever the user asks for a **new feature, enhancement, or capability**
("add X", "I want Y", "can we build Z"), invoke the `feature-writer` agent
(`.claude/agents/feature-writer.md`; it runs on the Fable model) **before any
implementation**. Pass it the user's request verbatim plus every constraint or
design decision already agreed in the conversation. It writes a
`task-<feature-name>.md` execution plan at the repo root, decomposed for
multiple agents to execute in parallel where the work allows. Implementation
starts only from that file, after the user has seen the plan. Bug fixes,
refactors, and tweaks to existing behavior do not go through this agent.

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
│   ├── main.tsx              # Vite entry point, mounts <App> (in <StrictMode>)
│   ├── App.tsx                # top-level layout: providers, startup load, Shell (presenting class)
│   ├── types.ts                # shared domain types (GraphState, GraphNode, Edge, DbTable, ...)
│   ├── vite-env.d.ts
│   ├── index.css               # global styles
│   ├── components/
│   │   ├── AlertDialog.tsx      # generic dismiss-only modal, window.alert() replacement (Escape closes)
│   │   ├── Canvas.tsx           # main drop/drag surface (integration glue, untested directly)
│   │   ├── ConfirmDialog.tsx    # generic OK/Cancel modal, window.confirm() replacement (Escape cancels)
│   │   ├── ContextMenu.tsx      # generic right-click menu, closes on outside click
│   │   ├── EdgeLayer.tsx        # renders all edges + handles edge interactions
│   │   ├── EdgeView.tsx         # single edge (path + arrowhead + drag-to-bend)
│   │   ├── EmptyState.tsx
│   │   ├── Guides.tsx           # alignment-guide lines for an in-progress node drag
│   │   ├── Icon.tsx
│   │   ├── ImportButton.tsx     # toolbar entry point for importing a diagram from a JSON file
│   │   ├── LibraryButton.tsx    # toolbar entry point for the named diagram library
│   │   ├── LibraryDialog.tsx    # named save/load/delete modal
│   │   ├── LibraryRow.tsx       # one row of LibraryDialog's save list
│   │   ├── LinkPreview.tsx      # in-progress link-drag preview arrow
│   │   ├── Marquee.tsx          # drag-to-select rectangle (+ useMarquee hook)
│   │   ├── NodeLabel.tsx        # node caption, dblclick-to-rename (split from NodeView for the line cap)
│   │   ├── NodeMenu.tsx         # node right-click menu: notes + playthrough-step authoring
│   │   ├── NodeView.tsx
│   │   ├── NotesEditor.tsx      # per-node free-text notes modal
│   │   ├── Palette.tsx          # draggable component palette sidebar; hidden while presenting
│   │   ├── PlaythroughButton.tsx # toolbar toggle for guided playthrough mode
│   │   ├── PlaythroughDot.tsx   # neon "request" dot layer with SMIL motion along the hop edge
│   │   ├── PlaythroughPanel.tsx # translucent right-hand step panel (Back/Next/Done + hints)
│   │   ├── PresentButton.tsx    # toolbar toggle for presentation mode
│   │   ├── ProgressDots.tsx     # clickable per-step progress dots (split from PlaythroughPanel)
│   │   ├── RegionView.tsx
│   │   ├── ShareButton.tsx      # toolbar entry point for shareable links
│   │   ├── TemplateSelect.tsx   # Templates… dropdown (split from Toolbar for the line cap)
│   │   ├── Toolbar.tsx
│   │   ├── WalkStepEditor.tsx   # playthrough-step textarea modal, mirrors NotesEditor
│   │   ├── ZoomControls.tsx     # floating zoom cluster (bottom-right of the canvas)
│   │   └── db/                  # SQL DB node schema editor (opened via node double-click)
│   │       ├── ColumnRow.tsx
│   │       ├── DbInspector.tsx    # modal shell: open/save/cancel/Escape
│   │       ├── StringList.tsx     # shared indexes/constraints chip editor
│   │       ├── TableEditor.tsx
│   │       └── dbModel.ts          # pure table/column CRUD helpers, isDbNode, dbTableCount
│   ├── data/
│   │   ├── icons.ts              # icon set for palette/nodes (inline <svg> strings)
│   │   ├── palette.ts             # palette entries (component types)
│   │   └── templates/              # starter graph templates, one small file per template
│   │       ├── index.ts              # assembles TEMPLATES/TEMPLATE_OPTIONS/templateToData
│   │       ├── types.ts               # shared Tpl/TplNode shapes
│   │       └── chat.ts, feed.ts, url.ts, rateLimiter.ts, rideSharing.ts, videoStreaming.ts, notificationSystem.ts
│   ├── hooks/
│   │   ├── useAutoHideScrollbars.ts   # theme scrollbars that fade out after idle
│   │   ├── useAutosave.ts              # debounced localStorage autosave of graph state
│   │   ├── useClipboardKeys.ts          # mod+C/V/D copy/paste/duplicate shortcuts
│   │   ├── useConfirmAction.ts           # pending confirm-then-run request state, for ConfirmDialog
│   │   ├── useKeyboard.ts                # undo/redo/delete/nudge shortcuts
│   │   ├── useLinkDrag.ts                 # port-to-port edge-creation drag, per NodeView
│   │   ├── useNodeDrag.ts                  # node drag incl. group move + snap-to-grid/guides
│   │   ├── usePlaythroughCamera.ts          # playthrough camera: capture, pan-to-step, restore
│   │   └── usePointerDrag.ts                 # shared pointer drag/resize/session logic
│   ├── lib/
│   │   ├── clipboard.ts                # copy/paste snapshot + paste-offset helpers
│   │   ├── dom.ts                       # small DOM helpers (textOf, downloadBlob)
│   │   ├── edgeBend.ts                   # edge midpoint/bend-delta helpers for drag-to-bend
│   │   ├── edgePath.ts                    # SVG path string for an edge (curved/ortho)
│   │   ├── exportPng.ts                    # rasterize .canvas-inner to a content-bounded PNG
│   │   ├── exportSvg.ts                     # buildSvg/downloadSvg: state -> standalone .svg
│   │   ├── geometry.ts                       # node/edge coordinate math (anchors, insets)
│   │   ├── io.ts                              # JSON export/import (download/parse/toData)
│   │   ├── library.ts                          # named diagram CRUD over localStorage
│   │   ├── persist.ts                           # autosave load/save over localStorage
│   │   ├── playthrough.ts                        # pure playthrough logic: resolver/clamp/hop/park/pan + DOT_COLOR
│   │   ├── reciprocalBend.ts                      # default bend for reciprocal edge pairs
│   │   ├── selection.ts                           # rect math + node snapshot helpers
│   │   ├── shareUrl.ts                             # encode/decode a diagram into a URL hash
│   │   ├── snap.ts                                  # grid + alignment-guide snapping
│   │   ├── svgParts.ts                               # per-element SVG string builders for exportSvg
│   │   └── viewport.ts                                # zoom clamp/step, coords, fit-to-view, contentBounds
│   ├── store/
│   │   ├── GraphContext.tsx            # undoable graph state provider
│   │   ├── PlaythroughContext.tsx       # ephemeral playthrough player (playing/stepIndex) + keyboard
│   │   ├── UIContext.tsx                 # non-undoable UI state (selection, edge mode, clipboard)
│   │   ├── ViewportContext.tsx            # non-undoable, non-serialized zoom/pan/pan-mode/presenting
│   │   ├── actions.ts                      # graph action creators + helpers
│   │   ├── graphReducer.ts                  # pure reducer for graph actions, delegates node/walk cases
│   │   ├── history.ts                        # generic useReducer undo/redo wrapper
│   │   ├── nodeReducer.ts                     # node-shaped graph action cases (split out of graphReducer)
│   │   └── walkReducer.ts                      # walkthrough-step action cases (split out of graphReducer)
│   └── test/                                # ALL tests live here, mirroring src/ subfolders
│       ├── setup.ts                          # RTL/jest-dom setup (wired via vitest.config.ts)
│       ├── components/*.test.tsx (+ db/*.test.tsx)
│       ├── data/templates.test.ts
│       ├── hooks/*.test.tsx
│       ├── lib/*.test.ts
│       └── store/*.test.(ts|tsx)
├── .claude/
│   ├── agents/feature-writer.md # plans new features into task-<name>.md files (see Feature requests above)
│   └── launch.json              # dev-server launch config for the in-app preview
├── .github/
│   ├── dependabot.yml           # keeps npm + workflow actions current
│   └── workflows/deploy.yml     # push to main → audit → test → build → deploy (GitHub Pages, no `any`-check gate)
├── scripts/
│   └── check-no-any.mjs         # bans the `any` type; see the No `any` hard rule above
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
- `npm run check:no-any` — no TypeScript `any` usages. Local-only: this does
  not gate CI/deploy (see below), so run it yourself before committing.
- Deploys run automatically via GitHub Actions on push to `main` (audit →
  tests → build → deploy). The no-`any` check is intentionally not part of
  that pipeline.
