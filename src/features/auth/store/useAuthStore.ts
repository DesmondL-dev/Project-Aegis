import { create } from 'zustand';

// Strict role union — RBAC clearance hierarchy; rejects privilege escalation at compile time.
export type UserRole = 'ADMIN' | 'ANALYST';

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

  // JWT payload simulation: derives role from email and hydrates state (mock only).
  performMockLogin: (email: string) => void;

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

// Claims derivation for mock auth — admin@aegis.com receives ADMIN; all others ANALYST.
function deriveRoleFromEmail(email: string): UserRole {
  return email === 'admin@aegis.com' ? 'ADMIN' : 'ANALYST';
}

export const useAuthStore = create<AuthState>((set) => ({
  ...INITIAL_STATE,

  setAuthPayload: (token: string, user: User) =>
    set({ isAuthenticated: true, accessToken: token, user }),

  performMockLogin: (email: string) => {
    const role = deriveRoleFromEmail(email);
    const user: User = { id: 'usr_mock_001', email, role };
    set({
      isAuthenticated: true,
      accessToken: 'mock_jwt_token_aegis_x19',
      user,
    });
  },

  teardownSession: () =>
    set({ ...INITIAL_STATE }),
}));
