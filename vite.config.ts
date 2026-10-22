import { defineConfig } from 'vite';

/** 2D-motorn publiceras på Pages-roten (/rpg-demo/). */
export default defineConfig({
  base: '/rpg-demo/',
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true, assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
  server: { port: 5173 },
});
