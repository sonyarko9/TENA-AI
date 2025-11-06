import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/TENA-AI/tree/main/frontend",
  server: {
    port: 3000,
  },
})