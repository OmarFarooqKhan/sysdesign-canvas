# Task.md — Canvas features & fixes (parallel work plan)

Seven features/fixes, grouped into **four tracks (A–D)** so multiple agents can
work simultaneously with minimal merge conflicts. Each track is one agent on
one branch (or git worktree). Read this whole file before starting a track —
especially **Shared rules** and **Coordination & merge order**.

## Shared rules (every track)

These come from `CLAUDE.md` and are non-negotiable:

- **100-line cap** on every `.ts`/`.tsx` source file (tests exempt). Split into
  new small modules instead of growing existing ones.
- **100% test coverage** enforced (`npm run test:coverage`). `App.tsx` and
  `components/Canvas.tsx` are excluded from coverage — put logic in testable
  modules, keep Canvas as glue.
- Tests use **real pointer/keyboard events** (React Testing Library), not
  internal calls.
- **State stays plain and serializable.** Undoable graph state goes through
  `store/graphReducer.ts` + `store/actions.ts`; ephemeral UI state lives in a
  context. Drag interactions coalesce into one undo entry via the session
  mechanism (`isSessionAction` + `END_SESSION`) — see `store/history.ts`.
- Before finishing: `npm run test:coverage` and `npm run build` both pass.

Current geometry facts you'll need: nodes are fixed-size `NODE_W = 96` ×
`NODE_H = 64` (`lib/geometry.ts`), positioned absolutely inside `.canvas`;
edges render in an absolutely-positioned full-size SVG (`components/EdgeLayer.tsx`).

---

## Track A — Edge geometry & edge dragging

**Branch:** `feat/edge-geometry` · **Features:** #1 side-aware arrows,
#2 bidirectional spacing, #6 drag-to-reposition edges.

**Primary files:** `lib/geometry.ts`, `components/EdgeView.tsx`,
`components/EdgeLayer.tsx`, plus additive changes to `types.ts` (`Edge`),
`store/actions.ts`, `store/graphReducer.ts`.

### A1. Arrows connect to either side of a node (feature #1)

Today `edgeEndpoints()` always leaves from the source's right-hand port and
enters the target ±48px from center — long edges route awkwardly when the
target is above/below or to the left.

- Rewrite `edgeEndpoints(a, b)` to pick the best anchor **side on both nodes**
  (left, right, top, bottom) based on the relative position of the two node
  centers, and anchor at the midpoint of that side on the node border.
- `edgePath()` should produce sensible curves/ortho routes for vertical
  anchors too (the current cubic assumes horizontal flow — for top/bottom
  anchors the control points must extend vertically).
- Keep it pure and unit-tested in `lib/geometry.test.ts` (all four side
  pairings, both edge modes).

### A2. Bidirectional edge spacing (feature #2)

When an edge is bidirectional (`edge.bidirectional`, toggled via the edge
context menu), the start arrowhead is drawn with `markerStart` and currently
overlaps/crowds the source node.

- Inset both endpoints along the path direction so arrowheads sit fully
  outside the node border with a small gap (~4px) at **both** ends when
  bidirectional (and at the target end always).
- Verify visually with curved *and* ortho modes; unit-test the inset math.

### A3. Drag an edge to reposition it visually (feature #6)

- Add an optional field to `Edge` (e.g. `bend?: number` — a signed
  perpendicular offset of the path's midpoint; pick the simplest model that
  works for both edge modes). Optional field ⇒ export/import (`lib/io.ts`)
  and templates keep working with no migration.
- New action `BEND_EDGE { id, bend }`, added to `SESSION_TYPES` in
  `store/actions.ts` so a drag is one undo entry (dispatch `END_SESSION` on
  mouseup).
- Dragging the edge path (or its label) with `usePointerDrag` updates the
  bend; plain click still opens the existing context menu (use a small
  movement threshold to distinguish click from drag).
- `edgePath()` consumes the bend for both curved and ortho modes.
- Tests: reducer cases, geometry with bend, drag interaction in
  `EdgeView.test.tsx`.

**Acceptance:** edges attach to the nearest sensible side of both nodes;
bidirectional edges show clean arrowheads at both ends without overlapping
nodes; an edge can be dragged to bow it out of the way, survives undo/redo
and export→import round-trip.

---

## Track B — Viewport: zoom, fit, and pan (merge FIRST)

**Branch:** `feat/viewport` · **Features:** #3 zoom controls + fit-to-view,
#5 pan toggle.

**Primary files:** new `store/ViewportContext.tsx`, new `lib/viewport.ts`, new
`components/ZoomControls.tsx`, `components/Canvas.tsx`, `components/Toolbar.tsx`,
`hooks/usePointerDrag.ts` consumers (`NodeView`, `RegionView`), `index.css`.

### B1. Viewport model

- New **`ViewportContext`** (separate from `UIContext` to avoid conflicts with
  Track C): `{ zoom, panX, panY }` + `zoomIn`, `zoomOut`, `setViewport`,
  `panBy`, and a `panMode: boolean` toggle. Not undoable, not serialized.
- Canvas applies it as a CSS transform on an inner wrapper div
  (`translate(panX, panY) scale(zoom)`, `transform-origin: 0 0`) that contains
  the edge SVG, regions, and nodes. `.canvas-wrap` already has
  `overflow: hidden`.
- Pure helpers in `lib/viewport.ts`: clamp zoom (e.g. 0.25–2 in fixed steps of
  0.25), screen→canvas coordinate conversion, and `contentBounds(state)` +
  `fitTransform(bounds, viewportSize)` for fit-to-view.
- **Fix all coordinate math for zoom/pan:**
  - `Canvas.onDrop` converts drop position through the viewport.
  - Node/region drag and resize deltas must be divided by `zoom`
    (`onMove(dx / zoom, dy / zoom)` at the call sites in `NodeView`/`RegionView`).
  - The link-preview line (`NodeView` `tempLine`, which uses raw client
    coords) must convert too.

### B2. Zoom controls (feature #3)

- Floating control cluster in the **bottom-right** of the canvas area:
  zoom out −, zoom in +, and current % readout. **Translucent at rest
  (e.g. `opacity: 0.35`), full opacity on hover** (CSS transition).
- Zoom out/in by the fixed step; zooming out increases visible canvas space.
- Keep the component ≤100 lines; logic in `lib/viewport.ts`.

### B3. Fit-to-view toolbar button (feature #3b)

- A `⤢ Fit` button in `Toolbar.tsx` that computes the bounding box of all
  nodes + regions and sets zoom/pan so everything is visible with padding.
  No-op on an empty canvas.

### B4. Pan toggle (feature #5)

- A toolbar **toggle** (e.g. `✋ Pan`) with a pressed state
  (`aria-pressed`). While active, dragging anywhere on the canvas pans the
  viewport (updates `panX`/`panY`) and **must not** move, select, or deselect
  nodes/regions/edges; cursor becomes `grab`/`grabbing`.
- When inactive, behavior is exactly as today.

**Acceptance:** zoom controls fade in/out on hover and step the zoom; drop,
drag, resize, and linking all land accurately at any zoom/pan; Fit shows the
whole diagram; pan mode moves only the camera. Full unit coverage on
`lib/viewport.ts`, `ViewportContext`, `ZoomControls`, and Toolbar additions.

---

## Track C — Marquee multi-select (merge after Track B)

**Branch:** `feat/multi-select` · **Feature:** #4 click-drag selection.

**Primary files:** `store/UIContext.tsx`, new `components/Marquee.tsx`,
`components/Canvas.tsx`, `components/NodeView.tsx`, `hooks/useKeyboard.ts`,
`lib/geometry.ts` (additive: rect-intersection helper), `store/actions.ts` +
`store/graphReducer.ts` (additive: `MOVE_NODES`).

- **Selection model:** extend `UIContext` with `selectedNodeIds: string[]`
  (or `Set`) while keeping the existing single-select API working
  (`selectNode(id)` ⇒ selection of one). Clicking empty canvas still clears.
- **Marquee:** mousedown on empty canvas (when Track B's pan mode is OFF) +
  drag draws a selection rectangle; on mouseup, nodes whose boxes intersect
  the rect become the selection. Rect must be computed in **canvas
  coordinates** (respect Track B's zoom/pan — coordinate helpers live in
  `lib/viewport.ts` after B merges).
- **Group move:** dragging any selected node moves the whole selection. Add a
  `MOVE_NODES { moves: {id, x, y}[] }` action (in `SESSION_TYPES`) so a group
  drag is one undo entry.
- **Group delete:** Delete/Backspace in `useKeyboard.ts` removes all selected
  nodes (and their edges — reuse `DELETE_NODE` semantics or add a batch
  action).
- Selected nodes all show the existing `.selected` style.
- Tests: marquee drag via real pointer events, intersection helper units,
  reducer `MOVE_NODES`, group delete via keyboard event.

**Acceptance:** drag on empty canvas selects everything the rectangle
touches; group drag/delete work and undo as single entries; single-click
selection unchanged; works correctly when zoomed/panned.

---

## Track D — SQL DB node schema details (feature #7)

**Branch:** `feat/db-schema` · **Feature:** double-click a DB node to edit
table metadata; nodes with data look different.

**Primary files:** `types.ts` (additive), new `components/db/` modules
(several small files — mind the 100-line cap), `components/NodeView.tsx`,
`store/actions.ts` + `store/graphReducer.ts` (additive), `index.css`,
`lib/io.ts` tests.

- **Data model** (additive, optional — keeps io/templates compatible):

  ```ts
  export interface DbColumn { name: string; type?: string; pk?: boolean; fk?: string /* "table.column" */; }
  export interface DbTable {
    name: string;
    columns: DbColumn[];
    shardKey?: string;
    indexes: string[];
    constraints: string[];
  }
  export interface GraphNode extends NodeDef { id: string; x: number; y: number; db?: { tables: DbTable[] } }
  ```

- **Which nodes:** check `data/palette.ts` for the DB-like `key`s (SQL/
  database entries) and gate the feature on those keys.
- **Action:** `SET_NODE_DB { id, db }` in the reducer (undoable, not a
  session action).
- **Editor:** double-click on the node **box** (the label's double-click
  edit must keep working — it's a separate element) opens a modal/panel to
  add/edit tables: name, columns (name, type, PK checkbox, FK target),
  shard key, indexes, constraints. Saving dispatches `SET_NODE_DB`; Escape/
  cancel discards. Split into small components:
  e.g. `db/DbInspector.tsx`, `db/TableEditor.tsx`, `db/ColumnRow.tsx`,
  `db/dbModel.ts` (pure add/remove/update helpers — unit-test these hard).
- **Visual distinction:** a node with `db.tables.length > 0` renders
  differently — e.g. an accent border + a small badge showing the table
  count (add a `has-data` class; style in `index.css`).
- **Round-trip:** export → import preserves `db` (io serializes nodes
  wholesale — add a test proving it).
- Tests: dbModel helpers, inspector open/edit/save/cancel with real events,
  reducer case, NodeView badge rendering, io round-trip.

**Acceptance:** double-clicking a SQL DB node opens the schema editor;
entered tables/columns/PK/FK/shard-key/indexes/constraints persist through
undo/redo and export/import; populated nodes are visibly distinct; label
double-click editing still works.

---

## Coordination & merge order

**File contention map** (who touches what):

| File | A | B | C | D |
|---|---|---|---|---|
| `lib/geometry.ts` | rewrite endpoints/path | — | add rect-intersect helper | — |
| `types.ts` | `Edge.bend` | — | — | `GraphNode.db` |
| `store/actions.ts` / `graphReducer.ts` | `BEND_EDGE` | — | `MOVE_NODES` | `SET_NODE_DB` |
| `store/UIContext.tsx` | — | — | multi-select | — |
| `components/Canvas.tsx` | — | transform wrapper | marquee | — |
| `components/NodeView.tsx` | — | zoom-correct drags | group drag | dblclick + badge |
| `components/Toolbar.tsx` | — | Fit + Pan toggle | — | — |
| `components/EdgeView/EdgeLayer` | all changes | — | — | — |

**Rules:**

1. **Track B merges first** — it changes the coordinate space every pointer
   interaction lives in. Tracks A/C/D rebase onto it and route any
   client-coordinate math through `lib/viewport.ts` helpers.
2. **Track C merges second** (`NodeView`/`Canvas` overlap with B is the
   riskiest merge). A and D are independent of each other and can merge in
   any order afterwards; their shared-file changes are additive (new type
   fields, new reducer cases) and should merge trivially.
3. Nobody renames or removes existing actions, context fields, or exported
   helpers — **additive changes only** to shared files, so parallel branches
   stay mergeable.
4. Each track keeps its branch green (`npm run test:coverage` + `npm run
   build`) before requesting merge; the merger re-runs both after each merge.
