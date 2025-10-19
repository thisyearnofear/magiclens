import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import Router from './components/Router'
import SystemErrorBoundary from './SystemErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from './components/ui/sonner'
import { AuthProvider } from './auth'

// Initialize Flow FCL
import './lib/flow/fcl-config'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SystemErrorBoundary viewName="App">
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </SystemErrorBoundary>
  </StrictMode>,
)