import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Some browser deps (SockJS/STOMP transitive code) still reference Node's global.
  define: {
    global: 'globalThis',
  },
})
