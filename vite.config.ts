import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Pure Vite configuration for Vercel production build
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
  },
});