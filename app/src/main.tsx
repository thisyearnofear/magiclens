import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Router } from './components/Router'
import { SystemErrorBoundary } from './SystemErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from './components/ui/sonner'

// Initialize Flow FCL
import './lib/flow/fcl-config'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SystemErrorBoundary>
      <ThemeProvider>
        <Router />
        <Toaster />
      </ThemeProvider>
    </SystemErrorBoundary>
  </StrictMode>,
)