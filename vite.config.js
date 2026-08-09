import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Troque "site_fit" pelo nome exato do seu repositório no GitHub antes de publicar
// (ex: se o repo for "meu-usuario/fit-trail", use base: '/fit-trail/').
export default defineConfig({
  plugins: [react()],
  base: '/site_fit/',
})
