import {
  Clapperboard,
  Home,
  Heart,
  Sparkles,
  LayoutDashboard,
  LogOut,
  History,
  LoaderCircle,
  ChevronLeft,
  SquareMenu,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { name: "Inicio", path: "/", icon: Home },
  { name: "Recomendaciones", path: "/recommendations", icon: Sparkles },
  { name: "Favoritos", path: "/favorites", icon: Heart },
  { name: "Historial", path: "/history", icon: History },
  { name: "Recap", path: "/dashboard", icon: LayoutDashboard },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
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
    <aside
        className={`sidebar-surface relative flex h-full flex-col border-r border-border/40 text-sidebar-foreground transition-[width,padding] duration-300 ease-out ${
            collapsed ? "w-20 px-2" : "w-64 px-6"
        } py-6`}
    >
        {/* Botón colapsar */}
        <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            className="absolute -right-3 top-8 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg transition hover:border-accent/60 hover:text-accent"
        >
            <ChevronLeft
            size={14}
            className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
        </button>

        {/* Encabezado de la sidebar */}
        <div className={`mb-8 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <SquareMenu className="size-6 shrink-0 text-accent" />
            {!collapsed && (
                <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Menú
                </span>
            )}
        </div>

        {/* Menú */}
        <nav aria-label="Menú lateral" className="flex flex-1 flex-col gap-1.5">
            {menuItems.map(({ name, path, icon: Icon }) => (
            <NavLink
                key={path}
                to={path}
                end={path === "/"}
                title={collapsed ? name : undefined}
                className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl py-3 font-semibold transition-all ${
                    collapsed ? "justify-center px-0" : "px-4"
                } ${
                    isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_0_1px_hsl(var(--accent)/0.3),0_8px_24px_-12px_hsl(var(--accent)/0.5)]"
                    : "text-muted-foreground hover:bg-primary/15 hover:text-foreground"
                }`
                }
            >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span>{name}</span>}
            </NavLink>
            ))}
        </nav>

        {/* Usuario */}
        <div className="mt-8 border-t border-border/60 pt-6">
            {!collapsed && (
            <>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
                    Sesión
                </p>
                <p className="mb-4 truncate text-sm font-semibold text-foreground">
                    {user?.user_metadata?.full_name ?? user?.email ?? "Usuario"}
                </p>
            </>
            )}

            <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? "Cerrar sesión" : undefined}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/90 px-3 py-3 font-semibold text-white transition hover:bg-destructive disabled:opacity-50"
            >
            {loggingOut ? (
                <LoaderCircle size={20} className="animate-spin" />
            ) : (
                <LogOut size={20} />
            )}
            {!collapsed && <span>Cerrar sesión</span>}
            </button>

            {error && !collapsed && (
            <p role="alert" className="mt-3 text-sm text-red-400">
                {error}
            </p>
            )}
        </div>
    </aside>
  );
}