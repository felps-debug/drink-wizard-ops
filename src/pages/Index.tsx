import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { StaffDashboard } from "@/components/dashboard/StaffDashboard";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex h-screen items-center justify-center">
          <div className="animate-pulse font-mono text-xs uppercase tracking-widest text-primary">
            Carregando Sistema...
          </div>
        </div>
      </AppLayout>
    );
  }

  const isAdminOrChef = user?.role === 'admin' || user?.role === 'chefe_bar';

  return (
    <AppLayout title="Dashboard">
      {isAdminOrChef ? <AdminDashboard /> : <StaffDashboard />}
    </AppLayout>
  );
}
