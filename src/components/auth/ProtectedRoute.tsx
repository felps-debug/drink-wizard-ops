import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/mock-data";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Safety timeout: if checking takes > 3s, assume not logged in and redirect
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('[ProtectedRoute] Auth check timed out — forcing redirect to login');
        setShowLoading(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Sync internal state with auth loading, but allow timeout to override
  useEffect(() => {
    if (!loading) setShowLoading(false);
  }, [loading]);

  if (showLoading && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="font-mono text-primary animate-pulse uppercase">Verificando Credenciais...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
