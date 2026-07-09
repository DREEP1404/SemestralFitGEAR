import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

// TanStack Start (SSR) entrypoint. The SPA and its compat shims are gone
// (Phase 5, #107) — src/** now imports @tanstack/react-router and
// @clerk/tanstack-react-start directly, so no resolve.alias is needed anymore.
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
    // React's Vite plugin MUST come after TanStack Start's plugin.
    viteReact(),
  ],
})
