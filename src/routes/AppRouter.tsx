import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';

// Canonical route manifest — single source of truth for the application's
// navigation graph. All protected branches are enclosed within the
// ProtectedRoute perimeter to enforce the authentication predicate at
// the routing layer before any component tree is mounted.
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public surface — accessible prior to authentication handshake */}
        <Route path="/login" element={<LoginForm />} />

        {/* Protected zone — ProtectedRoute acts as the RBAC entry checkpoint.
            All child routes implicitly inherit the authentication predicate. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/"
              element={
                // Placeholder index — replaced with feature routes in subsequent sprints
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                  <p className="text-lg font-semibold text-text-primary">Dashboard</p>
                  <p className="text-sm text-text-muted">Protected zone active. Awaiting feature injection.</p>
                </div>
              }
            />
          </Route>
        </Route>

        {/* Catch-all: redirect any unresolved path to the public login boundary */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
