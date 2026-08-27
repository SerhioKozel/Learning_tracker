import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ShieldOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
// Redirects to /auth if no active session.
// Shows a spinner while the session is being resolved on first load.

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-ink-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    // Preserve the attempted URL so we can redirect back after login.
    // e.g. /boards/abc?topic=xyz → after sign in → back to that URL
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// ─── AdminRoute ───────────────────────────────────────────────────────────────
// Wraps ProtectedRoute. Shows a 403 screen if the user is authenticated
// but does not have the 'admin' role.
// Real enforcement is in RLS + Edge Functions — this is UX-only.

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-ink-500 animate-spin" />
      </div>
    );
  }

  // Must be authenticated first (ProtectedRoute handles the redirect to /auth).
  // Here we only handle the case where user is authenticated but not admin.
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20
                        flex items-center justify-center">
          <ShieldOff className="h-5 w-5 text-rose-400" />
        </div>
        <div className="text-center">
          <h1 className="text-base font-semibold text-white">Access denied</h1>
          <p className="text-sm text-ink-500 mt-1">
            You don't have permission to view this page.
          </p>
        </div>
        <a href="/" className="btn-soft text-sm">Go to dashboard</a>
      </div>
    );
  }

  return <>{children}</>;
}
