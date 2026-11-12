
import { Navigate, Outlet, useLocation } from "react-router";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0b09]">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle
            size={40}
            className="animate-spin text-[#dd6122]"
          />

          <p className="text-[#7c8075]">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}
