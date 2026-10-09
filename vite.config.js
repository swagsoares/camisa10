import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Em dev, /api vai para o FastAPI local (uvicorn na porta 8000). Na Vercel o roteamento é nativo.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
