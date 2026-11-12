import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";

// Lazy load de las páginas
const Login = lazy(() => import("@/pages/Login/Login"));
const Home = lazy(() => import("@/pages/Home/Home"));
const Favorites = lazy(() => import("@/pages/Favorites/Favorites"));
const Recommendations = lazy(() => import("@/pages/Recommendations/Recommendations"));
const History = lazy(() => import("@/pages/History"));
const Dashboard = lazy(() => import("@/pages/Dashboard/Dashboard"));
const DesignSystem = lazy(() => import("@/pages/DesignSystem"));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Cargando...
    </div>
  );
}

// Evitar mostrar el login cuando ya existe una sesión.
function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageFallback />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Vista del sistema de diseño */}
        <Route path="/ui-preview" element={<DesignSystem />} />

        {/* Inicio de sesión */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Páginas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/favoritos" element={<Navigate to="/favorites" replace />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/recomendaciones" element={<Navigate to="/recommendations" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/historial" element={<Navigate to="/history" replace />} />
          </Route>
        </Route>

        {/* Rutas inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}