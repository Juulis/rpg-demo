import { defineConfig } from 'vite';

/**
 * TS/2D-versionen byggs till /rpg-demo/next/ (dist/next). Roten på Pages är 3D-spelet (legacy-3d/ kopieras dit av
 * scripts/assemble-pages.mjs) tills 2D-motorn är spelbar.
 */
export default defineConfig({
  base: '/rpg-demo/next/',
  build: { target: 'es2022', outDir: 'dist/next', emptyOutDir: true, assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
  server: { port: 5173 },
});
