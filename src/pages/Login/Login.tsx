import { useState } from "react";
import { Clapperboard, LoaderCircle } from "lucide-react";
import { supabase } from "@/services/supabase";

type Provider = "google" | "github";

export default function Login() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  const handleLogin = async (provider: Provider) => {
    setLoading(provider);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      {/* Atmósfera */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary)/0.20), transparent 60%)," +
            "radial-gradient(ellipse 60% 40% at 80% 100%, hsl(var(--accent)/0.12), transparent 65%)," +
            "radial-gradient(ellipse 70% 50% at 0% 100%, hsl(var(--secondary)/0.30), transparent 70%)",
        }}
      />

      <div className="surface-card w-full max-w-md rounded-2xl p-8 sm:p-10">
        <div className="mb-10 text-center">
          <Clapperboard className="mx-auto mb-4 size-11 text-accent sm:size-12" />

          <h1 className="title-poster text-4xl text-foreground sm:text-5xl">
            BUTACA
          </h1>

          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Tu próxima película comienza con una emoción.
          </p>
        </div>

        <div className="mb-6 space-y-1 text-center">
          <p className="eyebrow">Acceso</p>
          <h2 className="text-xl font-bold text-foreground">Iniciar sesión</h2>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleLogin("google")}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading === "google" ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <span className="text-lg font-bold">G</span>
            )}
            Continuar con Google
          </button>

          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleLogin("github")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3 font-semibold text-foreground transition hover:border-accent/50 hover:text-accent disabled:opacity-50"
          >
            {loading === "github" ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <span className="text-base font-bold">GH</span>
            )}
            Continuar con GitHub
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-5 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Descubre películas que conectan con tus emociones.
        </p>
      </div>
    </main>
  );
}