# System Design Canvas

[![Deploy](https://github.com/OmarFarooqKhan/sysdesign-canvas/actions/workflows/deploy.yml/badge.svg)](https://github.com/OmarFarooqKhan/sysdesign-canvas/actions/workflows/deploy.yml)

Drag system-design components onto a canvas, wire them together, group them into
regions, and export/import as JSON.

**Live:** https://omarfarooqkhan.github.io/sysdesign-canvas/

## Develop

```bash
npm install
npm run dev      # dev server with hot reload
npm run build    # type-check + build to dist/
```

Vanilla TypeScript + Vite, no framework. Source lives in `src/`. Pushing to
`main` builds and deploys to GitHub Pages automatically.
