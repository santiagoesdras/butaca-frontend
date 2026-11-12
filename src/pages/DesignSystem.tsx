
import { useState } from "react"
import {
  ArrowRight,
  Camera,
  Clapperboard,
  Heart,
  History,
  Palette,
  Search,
  Settings,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

import { PageHeader } from "@/components/common/PageHeader"
import { Loading } from "@/components/common/Loading"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"

const colors = [
  { name: "Warm Black", hex: "#0f0b09" },
  { name: "Deep Green", hex: "#0e2520" },
  { name: "Petroleum", hex: "#1f5656" },
  { name: "Terracotta", hex: "#dd6122" },
  { name: "Oxide", hex: "#781d0d" },
  { name: "Dark Wine", hex: "#5c140a" },
  { name: "Earth Brown", hex: "#6d523e" },
  { name: "Olive Gray", hex: "#7c8075" },
]

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {children}
    </section>
  )
}

function DesignSystem() {
  const [retryCount, setRetryCount] = useState(0)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-14 px-6 py-12 sm:px-10 lg:px-14">
        {/* Encabezado principal */}
        <PageHeader
            eyebrow="IDENTIDAD VISUAL · 2026"
            title="BUTACA DESIGN SYSTEM"
            description="Un espacio para explorar los componentes, colores y estilos que construyen la experiencia visual de Butaca."
            action={
                <Badge variant="terracotta">
                <Sparkles />
                UI Preview
                </Badge>
            }
        />

        <div className="h-px bg-border" />

        {/* Paleta */}
        <Section
          title="Paleta de colores"
          description="Los colores principales de la identidad visual de Butaca."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {colors.map((color) => (
              <div
                key={color.hex}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div
                  className="h-20"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="space-y-1 p-3">
                  <p className="text-sm font-semibold">{color.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {color.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="h-px bg-border" />

        {/* Tipografía */}
        <Section
          title="Tipografía"
          description="Outfit · Jerarquía tipográfica."
        >
          <div className="space-y-5 rounded-xl border border-border bg-card p-6">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                DISPLAY · 900
              </p>
              <h1 className="text-5xl font-black tracking-tight">
                Tu próxima historia.
              </h1>
            </div>

            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                HEADING · 800
              </p>
              <h2 className="text-3xl font-extrabold">
                Encuentra tu próxima película.
              </h2>
            </div>

            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                SUBHEADING · 700
              </p>
              <h3 className="text-xl font-bold">
                Recomendaciones para ti
              </h3>
            </div>

            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                BODY · 400
              </p>
              <p className="max-w-2xl leading-relaxed text-muted-foreground">
                Butaca te ayuda a descubrir películas, explorar tus gustos
                cinematográficos y encontrar historias que conecten contigo.
              </p>
            </div>
          </div>
        </Section>

        <div className="h-px bg-border" />

        {/* Botones */}
        <Section
          title="Botones"
          description="Variantes, tamaños e iconografía."
        >
          <div className="space-y-5 rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Principal</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="terracotta">Terracotta</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Enlace</Button>
            </div>

            <div className="h-px bg-border" />

            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs">Extra pequeño</Button>
              <Button size="sm">Pequeño</Button>
              <Button size="default">Mediano</Button>
              <Button size="lg">Grande</Button>
            </div>

            <div className="h-px bg-border" />

            <div className="flex flex-wrap items-center gap-3">
              <Button>
                <Search />
                Explorar
              </Button>

              <Button variant="terracotta">
                <Heart />
                Favoritos
              </Button>

              <Button variant="outline" size="icon">
                <Settings />
              </Button>

              <Button variant="secondary">
                Ver más
                <ArrowRight />
              </Button>
            </div>
          </div>
        </Section>

        <div className="h-px bg-border" />

        {/* Campos */}
        <Section
          title="Campos de entrada"
          description="Inputs y áreas de texto."
        >
          <div className="grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Nombre
                </label>
                <Input placeholder="Escribe tu nombre..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Correo electrónico
                </label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Buscar película
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Buscar por título..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Campo deshabilitado
                </label>
                <Input disabled placeholder="No disponible" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Descripción
              </label>
              <Textarea
                placeholder="Cuéntanos qué tipo de películas te gustan..."
                className="min-h-36"
              />
            </div>
          </div>
        </Section>

        <div className="h-px bg-border" />

        {/* Badges */}
        <Section
          title="Badges"
          description="Etiquetas para categorías, estados y emociones."
        >
          <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-6">
            <Badge>Predeterminado</Badge>
            <Badge variant="secondary">Secundario</Badge>
            <Badge variant="terracotta">Destacado</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="ghost">Ghost</Badge>
            <Badge variant="link">Enlace</Badge>
          </div>
        </Section>

        <div className="h-px bg-border" />

        {/* Superficies */}
        <Section
          title="Superficies"
          description="Diferentes niveles de profundidad y contraste."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <Clapperboard className="mb-4 size-6 text-primary" />
              <h3 className="font-bold">Card principal</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Superficie para películas y contenido.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-secondary p-5">
              <History className="mb-4 size-6 text-accent" />
              <h3 className="font-bold">Sección secundaria</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Superficie verde oscuro para diferenciar secciones.
              </p>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/15 p-5">
              <Camera className="mb-4 size-6 text-primary-foreground" />
              <h3 className="font-bold">Superficie destacada</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Elementos que necesitan mayor atención.
              </p>
            </div>
          </div>
        </Section>

        <div className="h-px bg-border" />

        {/* Estados */}
        <Section
          title="Estados de interfaz"
          description="Componentes para representar diferentes situaciones."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Loading
              </p>
              <Loading message="Buscando películas..." />
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Empty state
              </p>
              <EmptyState
                title="Todavía no tienes favoritos"
                description="Guarda las películas que te interesen y aparecerán aquí."
                icon={<Heart className="size-7" />}
                action={
                  <Button size="sm">
                    Explorar películas
                    <ArrowRight />
                  </Button>
                }
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Error state
              </p>

              <ErrorState
                title="No pudimos cargar tus películas"
                message="Ocurrió un problema al conectar con el servidor."
                onRetry={() => setRetryCount((count) => count + 1)}
              />

              {retryCount > 0 && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Intentos de prueba: {retryCount}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="border-t border-border pt-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-primary">
            <Palette className="size-4" />
            <span className="text-sm font-bold">BUTACA</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Design System · UI Preview · 2026
          </p>
        </footer>
      </div>
    </main>
  )
}

export default DesignSystem
