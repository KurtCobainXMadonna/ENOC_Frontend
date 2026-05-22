// src/test/setup.ts
// Configuración global de Vitest para tests de React

import '@testing-library/jest-dom'

// Mock de variables de entorno para tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_GOOGLE_CLIENT_ID: 'test-client-id',
    VITE_API_BASE_URL: 'http://localhost:8080',
    VITE_WS_BASE_URL: 'http://localhost:8080',
  },
  writable: true,
})

// Mock de window.matchMedia (requerido por algunos componentes)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})