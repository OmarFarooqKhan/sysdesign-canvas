# task-present-auto-playthrough-fit.md — Present auto-opens the playthrough + fit-to-view

One feature, one branch: **`feat/present-auto-playthrough-fit`**. The user's
request, verbatim: *"when i click present, the playthrough functionality/panel
should automatically open up. The screen should fit the components presented,
with the right and side having the stepthrough panel. If i select playthrough
manually, the screen should auto fit its components."* Concretely: clicking
`▶ Present` also starts the guided playthrough (so `PlaythroughPanel` opens in
one click), and entering a playthrough — via Present **or** the `▶ Playthrough`
button — auto-fits the diagram into the visible canvas area **left of** the
right-hand step panel, instead of today's pan-to-step-0.

Read this whole file before starting. **Shared rules** from `CLAUDE.md` apply
throughout and are non-negotiable: 100-line cap per source file (tests exempt),
100% coverage (`App.tsx` + `components/Canvas.tsx` excluded), tests under
`src/test/` mirroring source, real pointer/keyboard events, no `any`, no new
dependencies, and finish only when `npm run test:coverage`, `npm run build`,
and `npm run check:no-any` all pass.

## Scope

The request covers exactly three behaviors: (1) Present auto-starts the
playthrough, (2) playthrough entry fits content to the area left of the panel,
(3) manual playthrough entry gets the same fit. Interpretation chosen for the
one unspecified case: clicking Present with **zero authored steps** still
enters presentation mode (as today, playthrough untouched) and fits content to
the **full** canvas — the user tied "the screen should fit" to the Present
click itself, so the fit happens either way; only the right inset differs.
Everything else (Escape layering, viewport restore on exit, per-step camera
follow for oversized diagrams) is preserved, not redesigned.

---

## Design decisions (settled — do not relitigate)

1. **Present entry auto-starts the playthrough when at least one step
   resolves** (`resolveSteps(state).length > 0`, `src/lib/playthrough.ts:19`).
   The wiring lives in `PresentButton`'s `onClick` — `Toolbar` renders inside
   `PlaythroughProvider` (see `Shell` in `src/App.tsx:69-78`), so the button
   can call `usePlaythrough().start()` directly. No new cross-context effect,
   no coupling between `ViewportContext` and `PlaythroughContext` themselves.
2. **Playthrough entry fits, replacing the old entry pan.** Today
   `usePlaythroughCamera`'s step effect fires on entry and pans step 0's node
   to the center of the area left of the panel (`src/hooks/usePlaythroughCamera.ts:40-48`).
   New behavior: on entry, capture the viewport (unchanged), then apply
   `fitTransform(contentBounds(state), canvasW − (PANEL_W + 28), canvasH)` —
   the reduced width centers all content in the area left of the 228px panel
   plus its 2×14px margins, exactly the inset the existing `panToStep` call
   already uses. Zoom changes now (that is what "fit" means); the existing
   `.app.playing .canvas-inner { transition: transform .3s ease }` rule
   (`src/index.css:612`) animates it for free.
3. **Per-step camera becomes visibility-gated.** After the entry fit, a step
   change pans (existing `panToStep`, zoom untouched) **only when the active
   node is not fully visible** in the area left of the panel; otherwise the
   camera holds the fit framing. For diagrams that fit (the normal case,
   guaranteed by decision 2 unless `fitTransform` clamps at `ZOOM_MIN`), the
   stage never moves mid-tour — which is the point of "the screen should fit
   the components presented". For oversized diagrams the P7 guarantee from
   `task-playthrough.md` (active node always visible left of the panel) still
   holds. The same visibility check runs once right after the entry fit, so a
   `ZOOM_MIN`-clamped giant diagram still opens with step 0 in view.
4. **Manual playthrough start takes the identical path.** Both entry routes go
   through `PlaythroughContext.start()` → `playing` flips → the camera hook's
   entry effect. Nothing is special-cased per route.
5. **Present with zero steps**: presentation mode toggles on as today, no
   playthrough starts (`PlaythroughPanel` already renders `null` with no
   resolved steps), and content fits to the full canvas (right inset 0) via a
   new `usePresentFit` hook. No transition applies (the `.playing` CSS rule
   doesn't match) — instant, same feel as the toolbar `⤢ Fit` button.
6. **Present exit stops a running playthrough** (symmetry with entry starting
   it). The reverse stays asymmetric on purpose: stopping the playthrough
   (Done / Esc / `▶ Playthrough` click) never exits presenting — the existing
   two-layer Escape (capture-phase playthrough listener with
   `stopPropagation`, `src/store/PlaythroughContext.tsx:43-52`, then
   ViewportContext's bubble listener) is kept exactly as is: first Esc ends
   the tour, second Esc leaves presentation.
7. **Present while a playthrough is already running does not restart it** —
   `start()` resets `stepIndex` to 0, which would yank the user back to step
   1. Guard with `!playing`. Present-off still stops it (decision 6).
8. **Viewport restore is unchanged**: exiting the playthrough restores the
   viewport captured at entry (`usePlaythroughCamera` effect 1). Entered via
   Present, that snapshot is the pre-Present-click camera — restoring it while
   still presenting is correct and existing. The present-only fit (decision 5)
   is **not** restored on Present exit: Present never had camera restore, and
   adding one is out of scope.
9. **All fits are computed in post-commit effects, never in `onClick`.** See
   Traps — the palette unmounts in the same commit that flips
   `presenting`/`playing`, widening `.canvas-wrap`; a rect measured inside the
   click handler is stale.
10. **New helpers live in `src/lib/viewport.ts`, not `src/lib/playthrough.ts`**
    — the latter sits at 97/100 lines and must not grow.

**Out of scope / v2:** re-fit on window resize; camera restore for
present-only mode; refactoring `Toolbar.handleFit` onto the new `fitContent`
helper; any change to `PlaythroughContext`, `PlaythroughButton`,
`PlaythroughPanel`, or CSS (none is needed — panel, dim, and transition rules
all exist).

---

## New/changed files

| File | Change |
|---|---|
| `src/lib/viewport.ts` | additive: `fitContent`, `nodeVisible` (63 → ~80 lines) |
| `src/hooks/usePlaythroughCamera.ts` | modified: entry fit replaces entry pan; visibility-gated step pan (49 → ~70 lines) |
| `src/hooks/usePresentFit.ts` | **new** — full-canvas fit on presenting's rising edge when no playthrough starts |
| `src/components/PresentButton.tsx` | modified: auto start/stop playthrough (22 → ~32 lines) |
| `src/App.tsx` | glue (coverage-exempt): `Shell` calls `usePresentFit()` |
| `src/test/lib/viewport.test.ts` | extend: `fitContent` + `nodeVisible` |
| `src/test/hooks/usePlaythroughCamera.test.tsx` | update entry expectations to the fit; add visibility-gating cases |
| `src/test/hooks/usePresentFit.test.tsx` | **new** |
| `src/test/components/PresentButton.test.tsx` | extend harness (needs Graph + Playthrough providers) + new cases |

All source changes are additive or behavior-swaps inside the two files that own
the behavior; no exported name, action, or context field is renamed or removed.

---

## P1 — Pure viewport helpers

`src/lib/viewport.ts` (has `contentBounds`, `fitTransform`, `Viewport`,
`clampZoom`, and already imports `NODE_W`/`NODE_H` from `./geometry`):

- `fitContent(state: GraphState, viewportW: number, viewportH: number,
  rightInset = 0): Viewport | null` — returns
  `fitTransform(bounds, viewportW - rightInset, viewportH)` for
  `bounds = contentBounds(state)`, or `null` when the canvas is empty.
  Passing the reduced width is the whole trick: `fitTransform` centers within
  the width it is given, so content lands centered in the area left of the
  panel. No new math.
- `nodeVisible(vp: Viewport, viewportW: number, viewportH: number,
  node: { x: number; y: number }, rightInset: number): boolean` — the node's
  screen rect is `(node.x * zoom + panX, node.y * zoom + panY)` with size
  `(NODE_W * zoom, NODE_H * zoom)`; visible iff it lies fully inside
  `[0, viewportW - rightInset] × [0, viewportH]`. Strict containment, no
  margin — deterministic to test.

**Tests** (`src/test/lib/viewport.test.ts`, extend): `fitContent` returns
`null` for an empty state; equals `fitTransform(contentBounds(state), w - inset, h)`
for a seeded state with and without inset (compose the existing exports in the
expectation — see Traps on non-round fit zooms); `nodeVisible` true inside,
false when crossing each of the four boundaries, correct at zoom ≠ 1, and the
right boundary respects `rightInset`.

P1 merges first; P2 and P3 both consume it but are otherwise independent of
each other and may run in parallel (they share zero files).

---

## P2 — Playthrough camera: fit on entry, follow only when needed

`src/hooks/usePlaythroughCamera.ts` — keep the two-effect structure and the
`live`/`saved` refs; effect 1 (capture on `playing` true, restore on false) is
untouched. Rework effect 2 (`[playing, stepIndex]` deps):

- Track entry with a ref (e.g. `entered`, reset to `false` whenever `playing`
  is false). On the first run with `playing` true (the entry — `start()`
  resets `stepIndex` to 0, so this effect always fires once on entry):
  1. `fit = fitContent(state, rect.width - PANEL_W - PANEL_MARGINS,` … — i.e.
     call `fitContent(state, rect.width, rect.height, PANEL_W + PANEL_MARGINS)`
     using the existing local `PANEL_MARGINS = 28` const and `PANEL_W` from
     `lib/playthrough.ts`;
  2. if `fit` is non-null, `setViewport(fit)`, then check
     `nodeVisible(fit, rect.width, rect.height, step0Node, PANEL_W + PANEL_MARGINS)`
     **against `fit`, not `live.current`** (see Traps) and additionally
     `setViewport(panToStep(fit, …))` when not visible — both calls batch, so
     the committed viewport is the pan applied at the fit zoom.
- On subsequent runs (`stepIndex` changed while `entered`): read the live
  viewport from `live.current` (by then re-rendered and current), and only
  when `nodeVisible(...)` is false call `setViewport(panToStep(...))` exactly
  as today. When visible: do nothing — the camera holds still.
- All existing guards stay: bail when `!rect` or no resolved steps.

**Tests** (`src/test/hooks/usePlaythroughCamera.test.tsx`, update): keep the
provider harness, `CanvasStub` (800×600 mocked rect), and viewport probe.
Rewrite/extend to:

- entry applies the fit: after `walk-start`, viewport equals
  `fitContent(seedState, 800, 600, 256)!` — compose the helper in the
  expectation, never hard-code (the seed's fit zoom is 464/296, non-round);
- entry fit overrides a prior zoom/pan (the `set-viewport` then `walk-start`
  case now expects the same fit, since fit ignores the starting viewport);
- step change to a node already visible at the fit → viewport unchanged;
- step change to an off-view node pans: seed nodes far apart (e.g. x = 0 and
  x = 4000) so the fit clamps at `ZOOM_MIN` and content overflows; expect
  `panToStep` values at the clamped zoom;
- entry with that same giant seed also ends with step 0 visible (the
  post-fit visibility pan);
- unchanged behaviors re-asserted: restore on stop, no-op without a canvas
  rect, no-op when no steps resolve.

---

## P3 — Present wiring

**`src/components/PresentButton.tsx`** — add `useGraph` and `usePlaythrough`.
New click logic (prose, not code): when entering (`!presenting`), clear the
selection as today, and if `!playing && resolveSteps(state).length > 0` call
`start()` (decisions 1 and 7 — `start()` clears selection again, harmlessly);
when exiting, if `playing` call `stop()` (decision 6); in both cases finish
with `togglePresenting()`. Keep `aria-pressed`/`active` rendering unchanged.

**`src/hooks/usePresentFit.ts`** (new, ~25 lines) — covers decision 5:

- Reads `presenting`, `setViewport`, `canvasRef` from `useViewport`, `state`
  from `useGraph`, `playing` from `usePlaythrough`.
- One effect with **`[presenting]` as its only reactive dependency**, plus a
  `prevPresenting` ref for edge detection and a ref holding the live
  `{ state, playing }` (the `live.current` pattern from
  `usePlaythroughCamera`). On the rising edge (`presenting` now true, ref says
  it was false) and only when `playing` is false at that moment: measure
  `canvasRef.current?.getBoundingClientRect()` and `setViewport(fitContent(state,
  rect.width, rect.height))` when both rect and fit exist. Falling edge and
  all other runs: no-op. Do **not** put `playing` in the dep array — see
  Traps.

**`src/App.tsx`** (coverage-exempt glue) — `Shell` calls `usePresentFit()`
alongside its existing hooks. Two lines (import + call).

**Tests**

`src/test/components/PresentButton.test.tsx` — the current harness renders
only `UIProvider` + `ViewportProvider` (`src/test/components/PresentButton.test.tsx:19-27`);
it must grow `GraphProvider` (seedable `initial`) and `PlaythroughProvider`,
plus a probe exposing `playing`/`stepIndex` and a `next` button. Cases:

- with a seeded `walkthrough`, clicking Present flips `playing` true (panel
  behavior itself is already covered by `PlaythroughPanel.test.tsx`);
- with zero steps, Present toggles `presenting` but `playing` stays false;
- Present-off while playing stops the playthrough;
- Present-on while already playing (start manually via a probe, advance with
  `next`, then click Present): `stepIndex` is preserved, not reset;
- existing selection-clear / toggle / Escape cases stay green.

`src/test/hooks/usePresentFit.test.tsx` (new) — same provider + `CanvasStub` +
viewport-probe harness as the camera test, plus a `togglePresenting` probe
button. Cases: presenting-on fits to the full 800×600 (expect
`fitContent(seed, 800, 600)!`, composed); no-op when the canvas rect is
missing; no-op on an empty graph; no-op when a playthrough starts in the same
click (a probe button that calls `start()` and `togglePresenting()` together —
the camera hook owns that fit); presenting-off changes nothing; and a
playthrough stopping while presenting stays on does **not** re-fit (guards the
rising-edge design).

`src/test/components/Toolbar.test.tsx` needs no harness change — it already
wraps `GraphProvider` + `PlaythroughProvider`, and its seeds author no
`walkthrough`, so existing Present interactions keep their behavior. Re-run it
to confirm.

---

## Traps

1. **The palette unmounts in the click that enters Present/playthrough.**
   `Shell` passes `presenting={presenting || playing}` to `Palette`, which
   returns `null` (`src/components/Palette.tsx:9`), so `.canvas-wrap`
   (`flex: 1`) widens in that same commit. A rect measured inside the button's
   `onClick` is the **pre-hide, narrower canvas** and yields a wrong fit.
   Both fits must run in `useEffect`s keyed on the state transition — effects
   run after the DOM mutation, and `getBoundingClientRect` then forces layout
   against the widened canvas. (jsdom returns zeros regardless; tests stub the
   rect via the existing `CanvasStub` spy pattern.)
2. **Capture before fit.** The viewport snapshot that exit-restore depends on
   is taken in the hook's first effect; the fit lives in the second. Effect
   declaration order preserves capture-then-fit — do not merge or reorder
   them. Related: after `setViewport(fit)`, `live.current` still holds the
   **pre-fit** viewport until the next render, so the entry-time visibility
   check must be computed against the local `fit` value, never `live.current`.
3. **`usePresentFit` must be rising-edge-only, with `playing` read from a
   ref.** If `playing` were a dependency, the effect would re-fire when a
   Present-entered playthrough stops (presenting still true, playing → false)
   and stomp the camera hook's just-restored viewport. Edge-detect
   `presenting` with a ref; read `playing` and `state` through a live ref.
4. **`src/lib/playthrough.ts` is at 97/100 lines.** `fitContent` and
   `nodeVisible` go in `src/lib/viewport.ts` (63 lines, room to spare). Keep
   `PANEL_MARGINS` where it is (local to `usePlaythroughCamera`); no new
   shared consts are needed since `usePresentFit` uses inset 0.
5. **Fit zooms are not round numbers.** The camera test seed fits at
   464/296 ≈ 1.5676. Compose expected viewport strings from
   `fitContent`/`fitTransform`/`panToStep` in the tests (the same way the hop
   tests compose `edgePath`), never from float literals.
6. **The old entry-pan tests are now wrong on purpose.** "pans the step-0 node
   … on start" and "accounts for the current zoom when panning"
   (`usePlaythroughCamera.test.tsx:88-106`) encode the replaced behavior —
   update them to the fit spec rather than keeping both behaviors alive.
7. **StrictMode double-invokes mount effects** (`src/main.tsx:7`). Both new
   effects are idempotent no-ops at mount (`playing`/`presenting` false), and
   the transition-time runs fire once per dep change — but keep the entry
   logic idempotent (same inputs → same `setViewport`) rather than
   counter-based, so a re-run is harmless.
8. **Fit only on entry, never per step.** A per-step re-fit would fight the
   visibility-gated pan (each would undo the other) and make Back/Next jiggle
   the whole stage. Entry = fit (+ visibility pan); steps = visibility pan
   only.

---

## Acceptance (the whole feature)

- Author steps on 3+ nodes, click `▶ Present` once: presentation inertness
  applies, the palette hides, the playthrough panel opens on the right at
  step 1, and the whole diagram is fitted and centered in the area left of
  the panel — nothing sits behind the panel.
- Clicking `▶ Playthrough` directly (no Present) produces the same fitted
  framing. Next/Back/arrow keys/progress dots keep the camera still while the
  diagram fits; on a diagram too large to fit at minimum zoom, off-view step
  nodes are panned into the visible area exactly as before.
- Done/Esc ends the tour and restores the pre-entry viewport; if Present
  started the tour, presentation mode remains until a second Esc or a Present
  click (which also ends a running tour). Clicking Present mid-tour does not
  reset the current step.
- Present with zero authored steps still enters presentation mode and fits
  the diagram to the full canvas; an empty canvas fits nothing and nothing
  crashes.
- `npm run test:coverage` (100%), `npm run build`, and `npm run check:no-any`
  all green; every new/changed source file ≤ 100 lines.
