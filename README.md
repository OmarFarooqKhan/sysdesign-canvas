# System Design Canvas

[![Deploy](https://github.com/OmarFarooqKhan/sysdesign-canvas/actions/workflows/deploy.yml/badge.svg)](https://github.com/OmarFarooqKhan/sysdesign-canvas/actions/workflows/deploy.yml)

Drag system-design components onto a canvas, wire them together, group them into
regions, undo/redo your changes, and export/import as JSON.

**Live:** https://omarfarooqkhan.github.io/sysdesign-canvas/

## Develop

```bash
npm install
npm run dev            # dev server with hot reload
npm run test:coverage  # run tests (100% coverage gate)
npm run build          # type-check + build to dist/
```

React 19 + Vite + TypeScript. Source in `src/`. Undo/redo via a custom reducer
history — Cmd/Ctrl+Z to undo, Shift+Cmd/Ctrl+Z or Ctrl+Y to redo, Delete to
remove the selection. Pushing to `main` runs audit + tests, then deploys to
GitHub Pages.
