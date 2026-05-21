import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import Router from './components/Router'
import SystemErrorBoundary from './SystemErrorBoundary'
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from './components/ui/sonner'
import { AuthProvider } from './auth'
import { Web3Provider } from './lib/web3'

// Initialize Flow FCL
import './lib/flow/fcl-config'

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SystemErrorBoundary viewName="App">
      <Web3Provider>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <Router />
              <Toaster />
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </Web3Provider>
    </SystemErrorBoundary>
  </StrictMode>,
)
