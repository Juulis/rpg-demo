import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** Kopierar den arkiverade 3D-versionen (statiska filer, Three via CDN) oförändrad till dist/legacy-3d/. */
function legacy3d(): Plugin {
  let outDir = 'dist';
  return {
    name: 'legacy-3d',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    closeBundle() {
      const src = resolve(__dirname, 'legacy-3d');
      if (existsSync(src)) cpSync(src, resolve(__dirname, outDir, 'legacy-3d'), { recursive: true });
    },
  };
}

export default defineConfig({
  base: '/rpg-demo/',
  plugins: [legacy3d()],
  build: { target: 'es2022', outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
  server: { port: 5173 },
});
