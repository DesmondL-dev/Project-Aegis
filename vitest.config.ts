import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

// Dedicated Vitest configuration for CI/CD test environment
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});