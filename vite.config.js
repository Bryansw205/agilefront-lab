import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Si la app se sirve en la raíz en Vercel usa '/'
  // Si hay problemas con rutas o assets, probar './'
  base: '/',
  build: {
    outDir: 'dist'
  }
})
