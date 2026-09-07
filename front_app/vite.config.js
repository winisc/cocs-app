import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Painel interno: aplicação de página única, sem as entradas por unidade que
// a landing precisa. Porta diferente da landing para os dois rodarem juntos.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5180 },
  preview: { port: 5180 },
})
