import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, mkdirSync } from 'node:fs';

export default defineConfig({
  plugins: [react(), {
    name: 'copy-legacy-entry',
    closeBundle() {
      mkdirSync(path.resolve(__dirname, 'dist/g2'), { recursive: true });
      copyFileSync(path.resolve(__dirname, 'dist/legacy/index.html'), path.resolve(__dirname, 'dist/g2/index.html'));
    },
  }],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './legacy/src/core'),
      '@web': path.resolve(__dirname, './legacy/src/web'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        g2: path.resolve(__dirname, 'legacy/index.html'),
      },
    },
  },
});
