import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, strictPort: true, allowedHosts: ['kcai-arch-code-ide.hf.space'] },
  preview:{ host: true, port: 5173, strictPort: true }
})
