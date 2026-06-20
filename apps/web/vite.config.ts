import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// alphaTab bundles workers/worklets using `import.meta.url`-relative paths.
// When Vite bundles alphaTab into /assets/alphatab-xxxx.js, those relative URLs
// resolve to /assets/alphaTab.worklet.mjs (404). This plugin rewrites them to
// use the files we've placed under /public/alphatab/ at build time.
function alphaTabWorkerUrlFix() {
  return {
    name: 'alphatab-worker-url-fix',
    transform(code: string, id: string) {
      if (!id.includes('alphatab')) return null
      const orig = code
      code = code.replaceAll(
        'new alphaTab.Environment.alphaTabUrl("./alphaTab.worker.mjs", import.meta.url)',
        'new URL("/alphatab/alphaTab.worker.mjs", location.href)',
      )
      code = code.replaceAll(
        'new alphaTab.Environment.alphaTabUrl("./alphaTab.worklet.mjs", import.meta.url)',
        'new URL("/alphatab/alphaTab.worklet.mjs", location.href)',
      )
      return code !== orig ? { code, map: null } : null
    },
  }
}

export default defineConfig({
  plugins: [react(), alphaTabWorkerUrlFix()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
