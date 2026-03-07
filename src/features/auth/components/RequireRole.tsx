import type { ReactNode } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export type AllowedRole = 'ADMIN' | 'ANALYST';

interface RequireRoleProps {
  allowedRoles: Array<AllowedRole>;
  children: ReactNode;
}

// Component Guard — RBAC. Reads user from auth store; renders children only when
// user?.role is in allowedRoles whitelist; otherwise returns null (DOM cloaking).
export const RequireRole = ({ allowedRoles, children }: RequireRoleProps) => {
  const user = useAuthStore((state) => state.user);

  if (!user?.role || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};
