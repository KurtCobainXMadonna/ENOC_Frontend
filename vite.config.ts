import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  test: {
    // Entorno de DOM para tests de React
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Cobertura con v8 (nativo en Node) o istanbul
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      // Excluir archivos que no tienen lógica testeable
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/shared/setupGlobal.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
      // Umbrales mínimos (40% para el bono)
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
    },
  },
} as any)