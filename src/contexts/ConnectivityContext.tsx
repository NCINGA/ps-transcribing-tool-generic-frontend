import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface ConnectivityContextValue {
  isOnline: boolean
  markOffline: () => void
}

const ConnectivityContext = createContext<ConnectivityContextValue | undefined>(undefined)

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const markOffline = () => setIsOnline(false)

  return (
    <ConnectivityContext.Provider value={{ isOnline, markOffline }}>
      {children}
    </ConnectivityContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConnectivity() {
  const ctx = useContext(ConnectivityContext)
  if (!ctx) throw new Error('useConnectivity must be used within ConnectivityProvider')
  return ctx
}