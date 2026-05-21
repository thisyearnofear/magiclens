import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useFlowAuth } from '../hooks/use-flow-auth'
import { useUnifiedAuth, UnifiedWalletState } from './useUnifiedAuth'

interface AuthContextType extends UnifiedWalletState {
  /** Legacy: login alias for connectFlow */
  login: () => Promise<void>
  /** Check if JWT token is valid */
  isTokenValid: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const unified = useUnifiedAuth()
  const [tokenValid, setTokenValid] = useState(true)

  // Periodically check token validity
  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem('magiclens_token')
      if (!token) {
        setTokenValid(false)
        return
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Math.floor(Date.now() / 1000)
        setTokenValid(payload.exp > currentTime)
      } catch {
        setTokenValid(false)
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  const authValue: AuthContextType = {
    ...unified,
    login: unified.connectFlow,
    isTokenValid: () => tokenValid,
  }

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// Components for conditional rendering
export function SignedIn({ children }: { children: ReactNode }) {
  const { isConnected } = useAuthContext()
  return isConnected ? <>{children}</> : null
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { isConnected } = useAuthContext()
  return !isConnected ? <>{children}</> : null
}
