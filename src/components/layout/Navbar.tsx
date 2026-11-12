import { useState } from "react";
import {
  Clapperboard,
  Home,
  Heart,
  Sparkles,
  LayoutDashboard,
  History,
  LogOut,
  LoaderCircle,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Inicio", path: "/", icon: Home },
  { name: "Recomendaciones", path: "/recommendations", icon: Sparkles },
  { name: "Favoritos", path: "/favorites", icon: Heart },
  { name: "Historial", path: "/history", icon: History },
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setLoggingOut(true);
    setError("");
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setError("No se pudo cerrar sesión.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* HEADER (mobile y desktop) */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5">
            <Clapperboard className="size-7 text-accent sm:size-8" />
            <span className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              BUTACA
            </span>
          </NavLink>

          {/* Usuario desktop*/}
            <div className="hidden items-center gap-4 md:flex">
                <span className="max-w-48 truncate text-sm font-semibold text-foreground">
                    {user?.user_metadata?.full_name ?? user?.email ?? "Usuario"}
                </span>
            </div>

          {/* Logout compacto mobile */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Cerrar sesión"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-2 text-xs font-semibold text-muted-foreground transition hover:border-accent/40 hover:text-accent disabled:opacity-50 md:hidden"
          >
            {loggingOut ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            Salir
          </button>
        </div>

        {error && (
          <p role="alert" className="px-4 pb-2 text-xs text-red-400 sm:px-6">
            {error}
          </p>
        )}
      </header>

      {/* BOTTOM NAV (solo mobile) */}
        <nav
            aria-label="Navegación inferior"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden"
            >
            <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
                {navigation.map(({ name, path, icon: Icon }) => (
                <NavLink
                    key={path}
                    to={path}
                    end={path === "/"}
                    aria-label={name}
                    title={name}
                    className={({ isActive }) =>
                    `flex flex-1 items-center justify-center py-3 transition ${
                        isActive
                        ? "text-accent"
                        : "text-muted-foreground/70 hover:text-muted-foreground"
                    }`
                    }
                >
                    <Icon size={22} />
                </NavLink>
                ))}
            </div>
        </nav>
    </>
  );
}