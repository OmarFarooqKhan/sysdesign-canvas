import { defineConfig } from 'vite';

// base: './' keeps asset paths relative so the build works when served
// from any sub-path (e.g. GitHub Pages project sites).
export default defineConfig({
  base: './',
});
