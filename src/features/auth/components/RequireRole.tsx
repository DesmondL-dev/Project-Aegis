import type { ReactNode } from 'react';
import { useAuthStore } from '../store/useAuthStore';

type AllowedRole = 'ADMIN' | 'ANALYST';

interface RequireRoleProps {
  allowedRoles: Array<AllowedRole>;
  children: ReactNode;
  fallback?: ReactNode;
}

// Pure Presentation Wrapper — RBAC guard. No side effects; conditional render only.
// Reads current user role from auth state; if role is in allowedRoles whitelist,
// renders children; otherwise renders fallback or null (DOM cloaking — OWASP A01).
export const RequireRole = ({ allowedRoles, children, fallback = null }: RequireRoleProps) => {
  const userRole = useAuthStore((state) => state.user?.role);

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
