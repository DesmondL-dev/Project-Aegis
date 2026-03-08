import { create } from 'zustand';

// Visualize ARIA-live announcements for AODA compliance demonstration.
// Minimalist state machine: single message slot with auto-dismiss to avoid flicker.

type AodaTelemetryState = {
  message: string | null;
  isVisible: boolean;
  announce: (text: string) => void;
};

let dismissTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useAodaTelemetry = create<AodaTelemetryState>((set) => ({
  message: null,
  isVisible: false,

  announce: (text: string) => {
    if (dismissTimeoutId !== null) {
      clearTimeout(dismissTimeoutId);
      dismissTimeoutId = null;
    }
    set({ message: text, isVisible: true });
    dismissTimeoutId = setTimeout(() => {
      set({ message: null, isVisible: false });
      dismissTimeoutId = null;
    }, 4000);
  },
}));
