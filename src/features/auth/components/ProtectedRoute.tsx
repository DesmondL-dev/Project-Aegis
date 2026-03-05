import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Route Guard — first perimeter of the RBAC enforcement chain.
// Intercepts unauthenticated traversal attempts before any protected
// component tree is mounted or hydrated into the DOM.
//
// `replace` purges the attempted protected path from the browser history stack,
// preventing the user from navigating back into the protected zone via the
// back button — mitigating OWASP A01 (Broken Access Control) via history manipulation.
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the downstream route tree only after the authentication
  // predicate has been satisfied at the perimeter.
  return <Outlet />;
};
