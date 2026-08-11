# System Design Canvas

An interactive canvas for sketching system-design-interview diagrams: drag
components from the palette, wire them together, group them into regions, and
export/import as JSON.

## Develop

```bash
npm install
npm run dev      # start Vite dev server (hot reload)
npm run build    # type-check + production build into dist/
npm run preview  # serve the built dist/ locally
```

## Architecture

Vanilla TypeScript, no framework. Vite for dev/build. Every module is kept
small (≤100 lines) and single-purpose.

| File | Responsibility |
| --- | --- |
| `main.ts` | Entry point: init + global listeners (deselect, delete, close menu) |
| `types.ts` | Shared interfaces (`GraphNode`, `Edge`, `Region`, `GraphData`) |
| `dom.ts` | Cached references to the static canvas elements |
| `state.ts` | Shared mutable collections, id counters, UI selection state |
| `icons.ts` | Inline SVG icon set |
| `palette.ts` | Left-hand component palette + drag-to-drop node creation |
| `nodes.ts` | Node create / select / delete |
| `nodeWiring.ts` | Per-node drag, port-to-connect, inline rename |
| `edges.ts` | Edge create / route / label / delete + path geometry |
| `regions.ts` | Group-box create / select / delete |
| `regionWiring.ts` | Per-region drag, resize, rename |
| `templates.ts` | Starter diagrams (URL shortener, chat, feed) + clear-all |
| `io.ts` | Export / import JSON |
| `toolbar.ts` | Header button + template-select wiring |
| `contextmenu.ts` | Small floating right-click-style menu |

## Deploy

`npm run build` emits a static site to `dist/`. Deploy that folder to any
static host (GitHub Pages, Netlify, Cloudflare Pages, …). `base: './'` in
`vite.config.ts` keeps asset paths relative so it works from a sub-path.
