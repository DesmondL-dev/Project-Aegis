import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Network configuration to allow cross-device hydration testing (e.g., mobile viewports)
    host: true, // Expose dev server to local network for physical device debugging
    port: 3000, 
    strictPort: true, // Fail-fast mechanism if port is occupied, preventing silent unpredictable port assignment
  },
})