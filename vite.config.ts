import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ai-recipe-health-analyzer/',
  server: {
    proxy: {
      '/knuspr-mcp': {
        target: 'https://mcp.knuspr.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/knuspr-mcp/, '/mcp'),
      },
    },
  },
})
