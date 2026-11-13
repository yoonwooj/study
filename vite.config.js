import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ 
  plugins: [react()],
  base: '/',
})
npm i -D @cloudflare/vite-plugin wrangler
