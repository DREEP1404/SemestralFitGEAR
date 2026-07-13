import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The single build config for FITGEAR's TanStack Start app (Phase 5, #107 —
// the SPA and its dedicated vite.config.ts/tsconfig.app.json/tsconfig.node.json
// are gone). `app/` stays the Start srcDirectory: its route/guard files are
// kept separate from the shared UI library in `src/` on purpose, and there is
// no more SPA build to avoid colliding with, so nothing forces a move.
export default defineConfig({
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  plugins: [
    tanstackStart({
      srcDirectory: 'app',
    }),
    // Required for the Vercel deployment target (branch "desplegar" only —
    // not needed for the Docker/Render target, which serves the build with
    // `vite preview` instead). Vercel auto-detects TanStack Start + Nitro at
    // build time with no further config. https://vercel.com/docs/frameworks/full-stack/tanstack-start
    nitro(),
    // React's Vite plugin MUST come after TanStack Start's plugin.
    viteReact(),
    tailwindcss(),
  ],
})
