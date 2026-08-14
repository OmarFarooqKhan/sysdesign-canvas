# task-new-features.md — Next-wave features (parallel work plan)

Ten features, grouped into **four tracks (A–D)** so multiple agents can work
simultaneously with minimal merge conflicts. Each track is one agent on one
branch (or git worktree). Read this whole file before starting a track —
especially **Shared rules** and **Coordination & merge order**.

## Shared rules (every track)

These come from `CLAUDE.md` and are non-negotiable:

- **100-line cap** on every `.ts`/`.tsx` source file (tests exempt). Split into
  new small modules instead of growing existing ones.
- **100% test coverage** enforced (`npm run test:coverage`). `App.tsx` and
  `components/Canvas.tsx` are excluded from coverage — put logic in testable
  modules, keep those two as glue.
- Tests use **real pointer/keyboard events** (React Testing Library), not
  internal calls. Tests live under `src/test/`, mirroring the source folder.
- **State stays plain and serializable.** Undoable graph changes go through
  `store/graphReducer.ts` + `store/actions.ts`; ephemeral UI state lives in a
  context. Drag-like interactions coalesce into one undo entry via the session
  mechanism (`isSessionAction` + `END_SESSION`) — see `store/history.ts`.
- **No `any`** (`npm run check:no-any`). New dependencies must be the latest
  stable version.
- Before finishing: `npm run test:coverage`, `npm run build`, and
  `npm run check:no-any` all pass.

Facts you'll need: nodes are fixed-size `NODE_W = 96` × `NODE_H = 64`
(`lib/geometry.ts`); serialization is `lib/io.ts` (`toData`/`parse` — nodes
serialize wholesale, so **optional** new fields round-trip for free);
`GraphData.edgeMode` is already part of the exported document; the generic
`components/ContextMenu.tsx` and `components/AlertDialog.tsx` are reusable;
`lib/viewport.ts` has `contentBounds(state)`.

---

## Track A — Persistence & sharing

**Branch:** `feat/persist-share` · **Features:** #1 autosave, #2 named diagram
library, #3 shareable link.

**Primary files:** new `lib/persist.ts`, new `lib/library.ts`, new
`lib/shareUrl.ts`, new `hooks/useAutosave.ts`, new
`components/LibraryDialog.tsx`, `components/Toolbar.tsx`, `App.tsx` (glue),
`store/GraphContext.tsx` (additive: optional initial state).

### A1. Autosave to localStorage (feature #1)

Refreshing the tab currently loses everything — the biggest usability gap.

- `lib/persist.ts`: `saveLocal(data: GraphData)` / `loadLocal(): (GraphData &
  { edgeMode: EdgeMode }) | null` under a single storage key. `loadLocal`
  validates through the existing `parse()` and returns `null` on missing or
  corrupt data; `saveLocal` swallows quota errors (best-effort).
- `hooks/useAutosave.ts`: watches graph state + edge mode, debounces
  (~500 ms), writes via `saveLocal(toData(state, edgeMode))`. Wire it in
  `App.tsx`.
- **Startup load must not pollute undo history.** Don't dispatch `LOAD` on
  mount (that creates an undoable entry); instead let `GraphProvider` accept
  an optional initial `GraphData` and seed the history's initial `present`
  with it (additive prop, defaulting to today's empty graph).
- Clear button needs no special casing — after `CLEAR`, autosave persists the
  empty graph, which is correct.

### A2. Named diagram library (feature #2)

- `lib/library.ts`: pure CRUD over localStorage — `listSaves(): string[]`,
  `saveAs(name, data)`, `loadSave(name)`, `removeSave(name)`. One index key +
  one key per document; same `parse()` validation on load.
- `components/LibraryDialog.tsx`: modal listing saves with Load / Delete per
  row and a "Save current as…" input. Mind the 100-line cap — split a row
  component if needed. Escape closes (mirror `DbInspector`'s pattern).
- Toolbar gets a "Diagrams…" button opening the dialog. Loading dispatches
  `LOAD` (undoable — deliberate, unlike A1's startup seed) and sets edge mode,
  same as Import does today.

### A3. Shareable link (feature #3)

- `lib/shareUrl.ts`: `encodeShare(data): string` (a URL for the current
  origin/path with the compressed document in the **hash fragment**, so it
  never hits a server) and `decodeShare(hash): parsed | null`. Use
  `lz-string`'s `compressToEncodedURIComponent` / decompress (latest stable;
  synchronous, works in jsdom). Corrupt/absent payloads → `null`.
- Startup precedence in `App.tsx`: share-link payload (if present in
  `location.hash`) **beats** autosave, then strip the hash with
  `history.replaceState` so a subsequent refresh falls back to autosave.
- Toolbar "Share" button: copy `encodeShare(...)` to the clipboard
  (`navigator.clipboard.writeText`, mocked in tests) and confirm via the
  existing `AlertDialog`.

**Acceptance:** refresh restores the canvas; Clear + refresh yields an empty
canvas; save-as/load/delete named diagrams works and survives reloads; opening
a share link shows the shared diagram and refresh afterwards returns to your
own autosave. Round-trip unit tests for persist/library/shareUrl including
corrupt-input paths.

---

## Track B — Editing ergonomics

**Branch:** `feat/editing` · **Features:** #4 copy/paste/duplicate, #5
keyboard nudge, #6 snap-to-grid + alignment guides.

**Primary files:** `hooks/useKeyboard.ts` (split as needed), new
`hooks/useClipboardKeys.ts`, new `lib/clipboard.ts`, new `lib/snap.ts`, new
`components/Guides.tsx`, `hooks/useNodeDrag.ts`, `store/actions.ts` +
`store/graphReducer.ts` (additive: `ADD_ITEMS`), `store/UIContext.tsx`
(additive: clipboard slot), `index.css`.

### B1. Copy / paste / duplicate (feature #4)

- `lib/clipboard.ts`: pure `snapshotSelection(state, ids)` — the selected
  nodes plus only the edges whose **both** endpoints are selected — and an
  offset helper (paste lands at +16/+16 from the copied position).
- Clipboard contents live as plain data in a `UIContext` slot (additive
  field; not serialized, not undoable).
- New reducer action `ADD_ITEMS { nodes, edges }`: batch-insert with fresh ids
  from `seq` (`maxIdNum` is already exported), remapping the copied edges'
  endpoints to the new node ids. **One** undo entry, *not* a session action.
- Shortcuts (mod = Cmd/Ctrl): mod+C copy, mod+V paste, mod+D duplicate
  (copy+paste in one step, `preventDefault` so the browser bookmark dialog
  never fires). Respect the existing contenteditable guard in
  `useKeyboard.ts`; `useKeyboard` is near the cap — put these in a separate
  `useClipboardKeys.ts` hook.

### B2. Keyboard nudge (feature #5)

- Arrow keys move the current node selection by 1px, Shift+arrow by 8px,
  through the existing `MOVE_NODES` session action; dispatch `END_SESSION` on
  **keyup** so holding a key coalesces into one undo entry per press-and-hold.
- A lone selected region nudges via `MOVE_REGION` the same way.

### B3. Snap-to-grid + alignment guides (feature #6)

- `lib/snap.ts`: pure helpers — `snapToGrid(v, grid = 8)` and
  `alignmentGuides(dragged, others, tolerance = 4)` returning any matched
  vertical/horizontal guide coordinates (node edges + centers) plus the
  snapped x/y. Unit-test this hard; it's the whole feature.
- Wire into `useNodeDrag.ts`: pass candidate positions through snap before
  dispatching; holding **Alt** disables snapping. Deltas there are already in
  canvas coordinates (zoom-corrected), so no viewport math needed.
- `components/Guides.tsx` renders active guide lines inside `.canvas-inner`
  (they must pan/zoom with the content); style in `index.css`. Guides clear on
  drag end.

**Acceptance:** copy/paste/duplicate round-trips nodes + internal edges and
undoes as one entry; arrows nudge (Shift = coarse) and undo sanely; dragged
nodes snap to the grid and to neighbours' edges/centers with visible guides,
Alt bypasses, all correct while zoomed/panned.

---

## Track C — Templates & annotations

**Branch:** `feat/content` · **Features:** #7 four new starter templates,
#8 node notes.

**Primary files:** `data/templates.ts` (→ split into `data/templates/`
directory), `types.ts` (additive: `GraphNode.notes`), new
`components/NotesEditor.tsx`, `components/NodeView.tsx`, `store/actions.ts` +
`store/graphReducer.ts` (additive: `SET_NODE_NOTES`), `index.css`.

### C1. Four new starter templates (feature #7)

Rate Limiter, Ride Sharing, Video Streaming, Notification System — each ~6–8
nodes with labelled edges and one region, matching the existing three in
spirit. Use only existing palette `key`/`icon` values (`data/palette.ts`).

- `data/templates.ts` is at 66 lines; four more templates blow the cap. Split
  into a `data/templates/` directory — one small file per template + an
  `index.ts` that assembles `TEMPLATES`, `TEMPLATE_OPTIONS`, and
  `templateToData` with the **same public API**, so the existing
  `'../data/templates'` import in `Toolbar.tsx` keeps resolving unchanged.
- Extend `src/test/data/templates.test.ts`: for **every** template, edge
  index pairs are in range, generated ids are unique, labels non-empty where
  given, and `templateToData` output passes `parse(JSON.stringify(...))`.

### C2. Node notes (feature #8)

Back-of-envelope annotations (QPS, storage estimates) are core to how these
diagrams get used in interview practice.

- `types.ts`: `notes?: string` on `GraphNode` (optional ⇒ io/templates keep
  working, and export→import round-trips for free — add the io test anyway).
- Reducer: `SET_NODE_NOTES { id, notes }` — undoable, not a session action;
  empty string deletes the field.
- Editing: reuse the generic `ContextMenu` — right-click on a node opens a
  menu with "✎ Notes…" (and this is a natural home for future node actions).
  That opens `components/NotesEditor.tsx`, a small textarea modal mirroring
  `DbInspector`'s open/save/cancel/Escape pattern.
- Display: nodes with notes get a 📝 badge (like the DB table-count badge)
  and a `title` attribute tooltip with the note text; `has-notes` class
  styled in `index.css`.

**Acceptance:** all seven templates load cleanly from the Templates dropdown;
notes can be added/edited/cleared, survive undo/redo and export→import, and
noted nodes are visibly distinct; label double-click and DB double-click
still work.

---

## Track D — Presentation & SVG export

**Branch:** `feat/present-export` · **Features:** #9 presentation mode,
#10 SVG export.

**Primary files:** `store/ViewportContext.tsx` (additive: `presenting`), new
`lib/exportSvg.ts`, `components/Toolbar.tsx`, `components/Canvas.tsx` (glue
guards), `components/Palette.tsx` (hide when presenting), `index.css`,
`lib/io.ts` or `lib/dom.ts` (extract a shared `downloadBlob` helper —
additive).

### D1. Presentation mode (feature #9)

A read-only mode for walking someone through a finished diagram without
accidentally editing it.

- `presenting: boolean` + toggle on `ViewportContext` (non-undoable,
  non-serialized — it already owns `panMode`, the closest sibling).
- Toolbar `▶ Present` toggle (`aria-pressed`, like Pan). **Escape exits.**
- While presenting: the palette is hidden, editing toolbar controls are
  hidden or disabled, and node/region/edge pointer editing is inert — pan,
  zoom, and Fit still work. Implement inertness with a `presenting` class on
  the app root (CSS `pointer-events` on the editable layers) plus guards in
  the Canvas-level handlers; keep the guards in testable modules where
  possible since Canvas itself is coverage-exempt glue.
- Selection is cleared on entering presentation mode (no lingering halos).

### D2. SVG export (feature #10)

Crisper than PNG and embeddable in docs. Build the SVG **from state**, not
from the DOM — every ingredient already exists as a pure function.

- `lib/exportSvg.ts`: `buildSvg(state, edgeMode): string` composes:
  - viewBox from `contentBounds(state)` (`lib/viewport.ts`) plus padding;
  - regions as rounded `<rect>`s + `<text>` titles;
  - edges via `edgeEndpoints`/`insetEndpoints` (`lib/geometry.ts`),
    `autoBend` (`lib/reciprocalBend.ts`), `bowEndpoints` (`lib/edgeBend.ts`),
    and `edgePath` (`lib/edgePath.ts`), with the arrow `<marker>` def copied
    from `EdgeLayer` (markerStart when bidirectional);
  - nodes as rounded rects + label `<text>` + the icon markup from
    `data/icons.ts` embedded directly (the values are inline `<svg>` strings —
    nest them with explicit `x`/`y`/`width`/`height`);
  - dark-theme background so the file stands alone.
  Split into a couple of small modules if the cap threatens (e.g.
  `exportSvg.ts` orchestrator + `svgParts.ts` per-element builders).
- Extract a tiny shared `downloadBlob(blob, filename)` (from the logic in
  `io.ts`'s `download`) and reuse it for the `.svg` download.
- Toolbar: add "as SVG" to the existing Export dropdown.
- Tests are string assertions on `buildSvg` output: marker def present, a
  node's rect at its coordinates, an edge's `d` matches `edgePath`'s output,
  bidirectional edges carry `marker-start`, empty canvas produces a no-op.

**Acceptance:** Present hides all editing affordances, blocks all edits,
keeps pan/zoom/Fit, and Escape exits; Export → as SVG downloads a
self-contained file that renders the full diagram (nodes, icons, labels,
regions, curved/ortho edges with correct arrowheads) in any browser.

---

## Coordination & merge order

**File contention map** (who touches what):

| File | A | B | C | D |
|---|---|---|---|---|
| `components/Toolbar.tsx` | Diagrams… + Share | — | — | Present + SVG option |
| `components/NodeView.tsx` | — | snap wiring (via useNodeDrag) | ctx menu + notes badge | — |
| `store/actions.ts` / `graphReducer.ts` | — | `ADD_ITEMS` | `SET_NODE_NOTES` | — |
| `store/UIContext.tsx` | — | clipboard slot | — | — |
| `store/ViewportContext.tsx` | — | — | — | `presenting` |
| `store/GraphContext.tsx` | initial-state prop | — | — | — |
| `types.ts` | — | — | `notes?` | — |
| `hooks/useKeyboard.ts` (+ new hooks) | — | all changes | — | — |
| `lib/io.ts` / `lib/dom.ts` | (reads only) | — | — | `downloadBlob` extract |
| `data/templates.ts` → `data/templates/` | — | — | all changes | — |
| `index.css` | dialog styles | guides | badge | present mode |
| `App.tsx` (glue) | autosave + startup load | — | — | — |

**Rules:**

1. Two contention pairs, ordered within each pair; the pairs are independent
   of each other: **A merges before D** (both extend `Toolbar.tsx`) and
   **B merges before C** (both touch `NodeView`; C's context menu should land
   on top of B's drag/snap wiring). A∥B can run and merge in parallel first,
   then D∥C.
2. Nobody renames or removes existing actions, context fields, or exported
   helpers — **additive changes only** to shared files. C's `data/templates/`
   split must preserve the existing module path and exports exactly.
3. `index.css` and reducer/action additions are expected to merge trivially;
   if a conflict appears anyway, the later merger resolves by keeping both
   sides.
4. Each track keeps its branch green (`npm run test:coverage`,
   `npm run build`, `npm run check:no-any`) before requesting merge; the
   merger re-runs all three after each merge.
