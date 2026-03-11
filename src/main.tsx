import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css'
import App from './App.tsx'
/* import 'virtual:pwa-register'; */

// [PRE-BOOT SNIFFER] 
// Intercept '?mode=demo' before React Router mounts and immediately sync to physical memory.
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'demo') {
  sessionStorage.setItem('aegis_demo_mode', 'true');
}

// Initialize Server-State Management Engine
// Utilizing a unified QueryClient instance to handle caching, background hydration, and request deduping.
// Disabled refetchOnWindowFocus to prevent aggressive network polling during development context switching.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)