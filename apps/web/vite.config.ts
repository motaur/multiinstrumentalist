import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// alphaTab ships Web Workers and AudioWorklets that must be served as files.
// We exclude it from dep optimization and copy its worker assets via the plugin below.
function alphaTabAssetsPlugin() {
  return {
    name: 'alphatab-assets',
    configureServer(server: { middlewares: { use: (fn: unknown) => void } }) {
      // Serve alphaTab worker/worklet files from node_modules at /alphatab/
      const atDist = path.resolve(
        __dirname,
        '../../node_modules/.pnpm/@coderline+alphatab@1.8.3/node_modules/@coderline/alphatab/dist',
      )
      server.middlewares.use((req: { url?: string }, res: { sendFile?: (p: string) => void; end: () => void; setHeader: (k: string, v: string) => void }, next: () => void) => {
        const url = req.url ?? ''
        if (url.startsWith('/alphatab/')) {
          const file = path.join(atDist, url.replace('/alphatab/', ''))
          res.setHeader('Content-Type', 'application/javascript')
          // Simple static serve fallback — vite's static middleware handles this
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: ['../../'],
    },
  },
  optimizeDeps: {
    exclude: ['@coderline/alphatab'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          alphatab: ['@coderline/alphatab'],
        },
      },
    },
  },
})
