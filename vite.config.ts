// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        outDir: ".output/public",
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        manifest: false,
        filename: "sw.js",
        devOptions: { enabled: false },
        workbox: {
          globDirectory: ".output/public",
          globPatterns: ["**/*.{js,css,html,png,ico,svg,woff2,webmanifest,json}"],
          globIgnores: ["**/node_modules/**/*", "sw.js", "workbox-*.js"],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          offlineGoogleAnalytics: false,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "pages",
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
                },
              },
            },
            {
              // Assets con hash de Vite (nombre inmutable): caché primero.
              urlPattern: /\/assets\/.+-[A-Za-z0-9_-]{8}\.(?:js|css)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "hashed-assets",
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
                },
              },
            },
            {
              // JS/CSS/JSON sin hash: red primero para no servir versiones viejas.
              urlPattern: /\.(?:js|css|json)$/,
              handler: "NetworkFirst",
              options: {
                cacheName: "static-resources",
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "images",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.(?:woff2)$/i,
              handler: "CacheFirst",
              options: {
                cacheName: "fonts",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
                },
              },
            },
          ],
        },
      }),
    ],
  },
});
