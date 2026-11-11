import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocurrió un error inesperado al cargar la partida. Puedes reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "El Impostor — Juego de Fiesta y Engaño Social para Jugar con Amigos" },
      {
        name: "description",
        content:
          "El juego de fiesta definitivo para reuniones presenciales. Pasa el teléfono, descubre tu palabra secreta y desenmascara al impostor. Gratis, online y sin descargas obligatorias.",
      },
      {
        name: "keywords",
        content:
          "juego del impostor, juego de fiesta, el impostor online, pass and play, juegos para beber, quien es el impostor, undercover en español, spyfall español, imposter party",
      },
      { name: "author", content: "Tirlem Games" },
      { name: "theme-color", content: "#0f1523" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "El Impostor" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:site_name", content: "El Impostor" },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content: "El Impostor — Juego de Fiesta y Engaño Social para Jugar con Amigos",
      },
      {
        property: "og:description",
        content:
          "Pasa el teléfono, mantén el sensor táctil y desenmascara al mentiroso del grupo. Juega gratis al instante.",
      },
      { property: "og:image", content: "https://imposter.manu-07games.workers.dev/icon-512.png" },
      { property: "og:url", content: "https://imposter.manu-07games.workers.dev" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "El Impostor — Juego de Fiesta y Engaño Social",
      },
      {
        name: "twitter:description",
        content:
          "Juego presencial de deducción para grupos y reuniones con un solo móvil. ¿Quién está mintiendo?",
      },
      { name: "twitter:image", content: "https://imposter.manu-07games.workers.dev/icon-512.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bungee&family=Space+Grotesk:wght@400;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    void import("../lib/register-sw").then((m) => m.registerServiceWorker());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
