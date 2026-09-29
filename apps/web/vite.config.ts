import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, // binds to 0.0.0.0
  },
  plugins: [TanStackRouterVite(), react()],
})
