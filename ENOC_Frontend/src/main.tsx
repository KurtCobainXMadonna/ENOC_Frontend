import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './features/channelrack/styles/daw.css'
import App from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
