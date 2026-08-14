# task-playthrough.md — Guided playthrough mode

One feature, one branch: **`feat/playthrough`**. A step-by-step guided tour of a
diagram: an animated neon-green "request" dot loops along the edge into the
current section, everything else dims, and a translucent panel on the right
describes the step with Back / Next / keyboard navigation. Builds directly on
presentation mode (the canvas is inert while playing).

Read this whole file before starting. **Shared rules** from `CLAUDE.md` apply
throughout and are non-negotiable: 100-line cap per source file (tests exempt),
100% coverage (`App.tsx` + `components/Canvas.tsx` excluded), tests under
`src/test/` using real pointer/keyboard events, plain serializable state,
no `any`, no new dependencies (none are needed), and finish only when
`npm run test:coverage`, `npm run build`, and `npm run check:no-any` all pass.

---

## Design decisions (settled — do not relitigate)

1. **Steps are graph data; playback is UI state.** The ordered step list lives
   on the undoable graph (`walkthrough` field) so it serializes, undoes, and
   travels through export/import, autosave, the library, and share links for
   free. The *player* (active flag + current index) is ephemeral, like
   `presenting` — non-undoable, non-serialized.
2. **A step references a node id** (the "section"), plus free text. The hop for
   step *n* is the existing edge connecting step *n−1*'s node to step *n*'s
   node, resolved at render time — steps never store edge ids or geometry.
3. **The dot rides the rendered edge.** Reuse the exact geometry pipeline
   EdgeView uses (`edgeEndpoints` → `insetEndpoints` → `bowEndpoints` →
   `edgePath`, with `edge.bend ?? autoBend(...)`) so the dot follows precisely
   what is drawn, in both curved and ortho modes. Travel direction is handled
   with SMIL `keyPoints`/`keyTimes` (see P3), never by re-deriving a mirrored
   path.
4. **Orphaned steps are skipped at playback, not deleted.** `DELETE_NODE` does
   not touch `walkthrough`; the resolver filters out steps whose node no longer
   exists. Keeps the reducer simple and undo well-behaved.
5. **No edge between consecutive step nodes → straight-line fallback** between
   the two nodes' border anchors, no arrowhead. The playthrough still works on
   diagrams whose author forgot an edge.
6. **Dot color is neon green `#39ff14`** (a named const, e.g. `DOT_COLOR`).
   Deliberately not `--accent` (selection) or `--accent-2` (ports/linking/data
   badges): blue = "where you are", green = "the thing moving". The active
   node reuses the existing `.selected` ring look (accent border + soft ring).
7. **One step per node in v1.** The node context menu is the authoring surface
   (add/edit/remove). Multi-visit routes (e.g. a response passing back through
   a gateway) and drag-reorder are v2, via a step-list editor in the panel —
   the `walkthrough` array already supports duplicates, so no migration later.
8. **While playing, presentation-mode inertness applies** (palette hidden,
   canvas pointer-inert, pan/zoom/Fit alive). `presenting` itself stays an
   independent toggle; the app root carries the presenting CSS class when
   *either* is on.

---

## New/changed files

| File | Change |
|---|---|
| `src/types.ts` | additive: `WalkStep` + `walkthrough?: WalkStep[]` on `GraphState` and `GraphData` |
| `src/lib/playthrough.ts` | **new** — pure resolver/hop/clamp logic (the testable heart) |
| `src/store/actions.ts` | additive: 3 walkthrough actions (not session actions) |
| `src/store/graphReducer.ts` | additive: 3 cases (or delegate if near the cap) |
| `src/store/PlaythroughContext.tsx` | **new** — ephemeral player state + keyboard wiring |
| `src/lib/io.ts` | carry `walkthrough` through `toData`/`parse` (validated) |
| `src/store/actions.ts` (`fromData`) | carry `walkthrough` into `GraphState` |
| `src/components/PlaythroughButton.tsx` | **new** — toolbar toggle, mirrors `PresentButton` |
| `src/components/PlaythroughDot.tsx` | **new** — SVG dot layer with SMIL motion |
| `src/components/PlaythroughPanel.tsx` | **new** — translucent right-hand step panel |
| `src/components/ProgressDots.tsx` | **new** — tiny; keeps the panel under the cap |
| `src/components/WalkStepEditor.tsx` | **new** — textarea modal, mirrors `NotesEditor` |
| `src/components/NodeView.tsx` | additive: context-menu items + `walk-active` class |
| `src/components/EdgeView.tsx` | additive: optional `walkActive` prop → highlight class |
| `src/components/EdgeLayer.tsx` | additive: compute active hop edge id, pass prop |
| `src/components/Toolbar.tsx` | additive: mount `PlaythroughButton` |
| `src/components/Palette.tsx` / `App.tsx` | glue: hide palette / root class while playing |
| `src/index.css` | playthrough section: dim, ring, dot, panel, reduced motion |

Everything is additive; no existing action, export, or context field is renamed
or removed.

---

## P1 — Data model + pure logic

**`types.ts`**

```
WalkStep { nodeId: string; text: string }
GraphState.walkthrough?: WalkStep[]
GraphData.walkthrough?: WalkStep[]
```

Optional on both ⇒ every existing template, save, and share link keeps parsing
unchanged.

**`lib/playthrough.ts`** (pure, no React):

- `resolveSteps(state): { step: WalkStep; node: GraphNode }[]` — steps whose
  node exists, in order (decision 4).
- `clampStep(i, count): number`.
- `hopForStep(state, edgeMode, resolved, i)` → `null` for step 0 (the dot
  parks on / loops into the first node — see P3), otherwise
  `{ d: string; reverse: boolean; edgeId: string | null }`:
  - find the edge joining the two nodes in either direction;
  - when found **forward** (`from === prev`): build `d` exactly as EdgeView
    does — `edgeEndpoints` → `insetEndpoints(..., !!edge.bidirectional)` →
    `bowEndpoints` → `edgePath(mode, ..., bend)` with
    `bend = edge.bend ?? autoBend(...)` — `reverse: false`;
  - when found **reversed**: build `d` for the edge *as drawn* (from→to) and
    set `reverse: true`;
  - no edge: `d` = straight `M…L…` between the two facing border anchors
    (`edgeEndpoints` alone), `edgeId: null`.

**Reducer** (`store/actions.ts` + `graphReducer.ts`), all undoable,
none in `SESSION_TYPES`:

- `SET_WALK_STEP { nodeId, text }` — replace the node's existing step text, or
  append `{ nodeId, text }` when absent (decision 7 makes this an upsert).
- `REMOVE_WALK_STEP { nodeId }` — drop that node's step.
- `MOVE_WALK_STEP { from, to }` — reorder by index (used by tests + v2 UI;
  cheap to add now while the shape is fresh).
- `CLEAR` already resets (fresh `emptyGraph()` has no `walkthrough`).

**Serialization**: `toData` copies `walkthrough` when present; `parse` accepts
it only if it is an array of `{ nodeId: string, text: string }` objects
(silently dropped otherwise — corrupt input must not throw here since the rest
of the diagram is valid); `fromData` carries it into state. `persist`,
`library`, `shareUrl`, and `useAutosave` all go through these two functions —
zero changes there, but the round-trip tests below must prove it.

**Tests** (`src/test/lib/playthrough.test.ts`, `store/`, `lib/io.test.ts`):
resolver skips orphans and preserves order; clamp edges; hop forward /
reversed / bidirectional-inset / bent (`d` must equal what EdgeView's pipeline
yields for the same inputs — compose the same helpers in the test); no-edge
fallback; upsert-vs-append and remove/reorder reducer behavior incl. undo;
io round-trip with and without `walkthrough`; `parse` drops malformed shapes
(wrong types, non-array, step without `nodeId`).

---

## P2 — Player state + keyboard

**`store/PlaythroughContext.tsx`** — sibling of `ViewportContext`, ephemeral:

- `{ playing: boolean; stepIndex: number; start(); stop(); next(); prev() }`;
  `start` resets `stepIndex` to 0. `next`/`prev` clamp via `clampStep` (the
  provider takes the step count as a prop from the glue, or exposes raw
  setters and lets consumers clamp — pick one, keep it pure enough to test).
- Keyboard: while playing, `Escape` stops, `ArrowRight`/`ArrowLeft` step —
  same document-listener pattern `ViewportContext` uses for Escape. Playing
  takes priority over presentation's own Escape handler: guard so one Escape
  press exits the playthrough only (stop propagation between the two
  listeners deterministically — e.g. the playthrough listener also checks
  `presenting` was entered by it, see below).
- Entering playthrough clears selection (like `PresentButton`) and must make
  the presenting CSS take effect **without** flipping the user's `presenting`
  toggle: `App`/Shell applies the `presenting` class when
  `presenting || playing` (`Palette` hides via the same condition or a
  `.app.playing .palette { display: none }` rule — CSS-only is fine).

**`components/PlaythroughButton.tsx`** — clone of `PresentButton`:
`▶ Playthrough`, `aria-pressed`, `.active` styling, disabled (with `title`
explaining why) when `resolveSteps(state).length === 0`. Mounted in
`Toolbar.tsx` next to Present.

**Tests**: context via a probe component + real keydown events (arrows step,
clamped at both ends; Escape exits playthrough and leaves `presenting` as it
was); button disabled/enabled/toggle; selection cleared on start.

---

## P3 — The dot

**`components/PlaythroughDot.tsx`** — rendered inside `.canvas-inner` (so it
pans/zooms with content) as its own absolutely-positioned
`<svg class="walk-dot">` (`pointer-events: none`, `z-index: 4` — above edges
and nodes so the glow reads over borders). Renders nothing when there is no
active hop (step 0: park the dot statically on the first node's border anchor
instead, so the opening step still shows "the request").

- Three concentric circles: `r=10` at `.12` opacity, `r=7` pulsing halo
  (CSS `@keyframes walk-halo` on `r`/`opacity`), `r=4.5` solid, plus a `r=2`
  bright core (`#d8ffd0`). All fills from the `DOT_COLOR` const.
- Motion: `<animateMotion dur="1.8s" repeatCount="indefinite" path={d}/>`
  wrapping the circle group. For `reverse: true` hops add
  `keyPoints="1;0" keyTimes="0;1" calcMode="linear"` — the dot runs the drawn
  path backwards; **never** rebuild a mirrored path (bends would flip).
- Reduced motion: when `matchMedia('(prefers-reduced-motion: reduce)')`
  matches, omit `animateMotion` and place the group statically at the hop's
  midpoint (`edgeMidpoint` from `lib/edgeBend.ts`); CSS also disables the halo
  pulse under the same media query.

jsdom doesn't run SMIL — tests are markup assertions: correct `path` attr for
the current step (delegating to `hopForStep`), `keyPoints` present only when
reversed, static placement + no `animateMotion` under a mocked reduced-motion
`matchMedia`, nothing rendered when not playing.

---

## P4 — Dim + highlight

All CSS in `index.css` under a `/* playthrough */` section, driven by a
`playing` class on `.app` (added in the same Shell expression as `presenting`):

- `.app.playing .node`, `.app.playing svg.edges g` → `opacity: .35`,
  with `transition: opacity .2s`.
- Active section: `NodeView` reads the playthrough context and adds
  `walk-active` when it is the current step's node → full opacity + the
  existing selected treatment (`border-color: var(--accent)`;
  `box-shadow: 0 0 0 3px rgba(79,140,255,.22)`) on `.box`.
- Active hop edge: `EdgeLayer` computes the current hop's `edgeId` (from
  `hopForStep`) and passes a new optional `walkActive` prop to `EdgeView`,
  which adds a `walk-active` class to its `<g>` → full opacity, accent stroke
  (mirror the `selected` stroke branch).
- Both new class hooks are additive; when not playing nothing changes.

**Tests**: RTL renders with a playing provider — active node has the class and
others don't; advancing a step (real keyboard event) moves the class; active
edge group flagged; dimming class present on the app root markup.

---

## P5 — The panel

**`components/PlaythroughPanel.tsx`** — mounted in `.canvas-wrap` (outside the
zoomed layer), fixed-width overlay pinned to the right, stopping above the
zoom cluster: `position: absolute; top: 14px; right: 14px; bottom: 64px;
width: 228px`. Styling in `index.css`: `background: rgba(23, 29, 43, .8)`
(that is `--panel` at 80%), `backdrop-filter: blur(8px)` (+ `-webkit-` twin),
`1px solid var(--border)`, `border-radius: 12px`, flex column.

Content, top to bottom:

- eyebrow — `STEP n OF N` (10.5px uppercase, `--muted`, `.5px` tracking, the
  `.db-list-label` recipe);
- title — the node's label (14px / 650);
- hop line — `PrevLabel → CurrentLabel` (11px `--muted`; omit on step 0);
- body — the step's `text` (12.5px, `#cdd5e4`, `line-height 1.6`), scrollable
  if long (the auto-hide scrollbar styles are global already);
- `ProgressDots` (own file): one 7px dot per step, active one an 18px
  `DOT_COLOR` pill — clicking a dot jumps to that step;
- buttons row — `← Back` (default button style, disabled at step 0) and
  `Next →` (`.primary` accent style; on the last step it reads `Done` and
  stops);
- hint — `Esc exits · ← → step` (11px, `--muted`, centered).

**Tests**: content reflects current step; Back disabled at 0; Next→Done→stops;
dot-click jumps; all via real click/keyboard events.

---

## P6 — Authoring via the node context menu

`NodeView`'s existing `ContextMenu` grows (additive, next to `✎ Notes…`):

- `▶ Playthrough step…` — opens **`WalkStepEditor.tsx`**, a textarea modal
  cloned from `NotesEditor` (open/save/cancel/Escape; reuse `.notes-modal` /
  `.notes-textarea` styles or add `walk-` twins). Prefilled with the node's
  existing step text; save dispatches `SET_WALK_STEP` (upsert). Saving an
  empty string is a no-op save (removal is explicit, below).
- `🗑 Remove playthrough step` — only listed when the node has a step;
  dispatches `REMOVE_WALK_STEP`.

A `walk-badge` on the node box (like `db-badge`/`notes-badge`, `DOT_COLOR`
background, e.g. `▶`) marks nodes that have a step, so authors can see tour
coverage at a glance. Position it bottom-left to avoid the two existing badge
corners.

**Tests**: right-click → menu shows the right items in both states; editor
round-trip (save/cancel/Escape); badge appears/disappears; step text
add→edit→remove all undo/redo cleanly (real events through the store).

---

## P7 — Camera follow

On step change while playing, keep the active node visible **left of the
panel**, not centered on the full canvas:

- New pure helper in `lib/playthrough.ts` (or `lib/viewport.ts` if it fits
  the cap better): `panToStep(vp, viewportW, viewportH, nodeCenter, rightInset)`
  → `{ panX, panY }` placing the node center at
  `((viewportW − rightInset) / 2, viewportH / 2)` at the current zoom;
  `rightInset` = panel width + margins (export a `PANEL_W` const from the
  panel or a shared consts spot). Zoom is left alone.
- Glue: an effect (in the panel or a tiny `usePlaythroughCamera` hook) calls
  `setViewport` with the helper's result on `stepIndex`/`playing` changes,
  measuring the canvas via `canvasRef`.
- Smoothness is CSS: `.app.playing .canvas-inner { transition: transform .3s
  ease; }` — and disabled under `prefers-reduced-motion`.

**Tests**: the pure helper (exact numbers at zoom 1 and 2, off-center bounds);
hook/effect via RTL with a stubbed canvas rect asserting `setViewport` calls.

---

## Acceptance (the whole feature)

- Author steps on 3+ nodes via right-click, hit `▶ Playthrough`: canvas goes
  inert and palette hides (existing Present visuals), everything dims except
  the step-1 node, the neon dot sits on it, the translucent panel shows step
  1 with its text.
- Next/→ advances: the dot loops along the *drawn* edge into the new active
  node (curved, ortho, bent, and reversed/bidirectional edges all correct),
  highlight and panel update, camera pans the node into the visible area left
  of the panel. Back/← reverses. Progress dots jump. Done/Esc exits and
  restores the pre-playthrough view state; the user's separate Present toggle
  is untouched.
- Steps survive export→import, autosave reload, library save/load, and a
  share link. Deleting a stepped node mid-tour doesn't crash: the step is
  skipped and the count shrinks.
- With no edge between consecutive step nodes the dot travels a straight
  line. With reduced motion the dot is static at the hop midpoint and nothing
  pulses or pans with animation.
- `npm run test:coverage` (100%), `npm run build`, `npm run check:no-any` all
  green; every new source file ≤ 100 lines.
