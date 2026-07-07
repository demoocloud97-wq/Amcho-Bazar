// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages project site: served from /<repo>/. Base + router basepath must match.
const BASE = "/Amcho-Bazar/";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Static SPA build for GitHub Pages (no Node server there): prerender a shell,
    // hydrate on the client, let the router handle all routes.
    spa: { enabled: true },
    router: { basepath: BASE.replace(/\/$/, "") },
  },
  // No nitro: use TanStack Start's native build so the SPA prerender's preview
  // server finds the expected dist/ layout and emits a static shell we can host.
  nitro: false,
  vite: { base: BASE },
});
