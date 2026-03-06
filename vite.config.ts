/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Expose dev server to 0.0.0.0 so LAN devices can reach it (e.g., mobile viewports, cross-device testing).
    host: true,
    port: 3000,
    strictPort: true, // Fail-fast if port is occupied, preventing silent alternate port assignment
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})