import type { ReactNode } from 'react';
import type { UserRole } from '../store/useAuthStore';
import { useAuthStore } from '../store/useAuthStore';

interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

// RBAC Enforcement Component — second perimeter inside the authenticated zone.
// Implements DOM Cloaking: components wrapped by this guard are never mounted
// if the authenticated user's role falls outside the `allowedRoles` whitelist.
//
// Returning `null` on role mismatch prevents React from ever hydrating the
// child tree — the privilege-gated UI surface never exists in the DOM,
// eliminating any CSS `display: none` bypass vectors (OWASP A01).
export const RequireRole = ({ allowedRoles, children }: RequireRoleProps) => {
  const userRole = useAuthStore((state) => state.user?.role);

  // Absence of a role (e.g., race condition during teardown) is treated as
  // an explicit denial — fail-closed posture.
  if (!userRole || !allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
};
