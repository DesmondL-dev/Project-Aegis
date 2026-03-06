import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

// Dedicated Vitest configuration for CI/CD test environment.
// Plugin array is cast to satisfy type mismatch between root Vite and Vitest's bundled Vite.
export default defineConfig({
  plugins: [react()] as import('vitest/config').UserConfig['plugins'],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});