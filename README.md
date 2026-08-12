# System Design Canvas

[![Deploy](https://github.com/OmarFarooqKhan/sysdesign-canvas/actions/workflows/deploy.yml/badge.svg)](https://github.com/OmarFarooqKhan/sysdesign-canvas/actions/workflows/deploy.yml)

Drag system-design components onto a canvas, wire them together, group them into
regions, undo/redo your changes, and export/import as JSON.

**Live:** https://omarfarooqkhan.github.io/sysdesign-canvas/

## Features

- Drag components from the palette onto the canvas, wire them together, group
  into regions
- Side-aware edge anchors (curved or orthogonal), bidirectional edges, and
  drag-to-bend edge routing
- Zoom controls, fit-to-view, and a pan-mode toggle
- Marquee multi-select with group move and group delete
- SQL DB nodes: double-click to edit tables, columns (PK/FK/type), shard key,
  indexes, and constraints
- Undo/redo (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z or Ctrl+Y), Delete to remove the
  selection
- Export/import the graph as JSON, export a PNG snapshot, plus starter templates

## Develop

```bash
npm install
npm run dev            # dev server with hot reload
npm run test:coverage  # run tests (100% coverage gate)
npm run build          # type-check + build to dist/
```

React 19 + Vite + TypeScript. Source in `src/`; undo/redo via a custom reducer
history. Pushing to `main` runs audit + tests, then deploys to GitHub Pages.
