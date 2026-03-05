import { create } from 'zustand';

// Strict role union — prevents unauthorized privilege escalation by
// rejecting any string outside the defined clearance hierarchy at compile time.
export type UserRole = 'JUNIOR_ANALYST' | 'RISK_MANAGER';

// Canonical user identity payload injected post-authentication.
// `id` is treated as an opaque server-issued identifier — never client-generated.
export interface User {
  id: string;
  email: string;
  role: UserRole;
}

// Rigid state interface enforcing explicit nullability.
// Ambiguous undefined values are prohibited to prevent silent state leakage
// across component boundaries.
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;

  // Hydrates the store with a verified server-issued token and identity payload.
  setAuthPayload: (token: string, user: User) => void;

  // OWASP A07 — Identification and Authentication Failures.
  // Complete in-memory wipe on session termination. No persist middleware is used —
  // token and user data are deliberately excluded from localStorage/sessionStorage
  // to eliminate XSS exfiltration attack surface.
  teardownSession: () => void;
}

// Initial null state extracted as a constant to guarantee teardown
// produces an identical memory snapshot to the initial bootstrap state.
const INITIAL_STATE = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
} as const;

export const useAuthStore = create<AuthState>((set) => ({
  ...INITIAL_STATE,

  setAuthPayload: (token: string, user: User) =>
    set({ isAuthenticated: true, accessToken: token, user }),

  teardownSession: () =>
    set({ ...INITIAL_STATE }),
}));
