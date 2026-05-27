import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // как в Next
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: false,
    },
    host: true,
    strictPort: true,
    port: 5175,
  },
});
