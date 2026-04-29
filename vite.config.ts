import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site at https://<owner>.github.io/<repo>/, so all
// asset URLs need to be prefixed with the repo name. Override with VITE_BASE
// (e.g. VITE_BASE=/ for a custom domain or a *.github.io user-site repo).
const base = process.env.VITE_BASE ?? '/design-system/'

// GitHub Pages has no SPA fallback — unknown paths return 404.html. Copying
// index.html to 404.html makes the React app boot for any deep link, then
// react-router takes over.
const spaFallback = {
  name: 'spa-fallback-404',
  closeBundle() {
    const dist = path.resolve(__dirname, 'dist')
    const index = path.join(dist, 'index.html')
    if (fs.existsSync(index)) {
      fs.copyFileSync(index, path.join(dist, '404.html'))
    }
  },
}

export default defineConfig({
  base,
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    spaFallback,
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
