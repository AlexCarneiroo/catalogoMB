import { HelmetProvider } from 'react-helmet-async'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'
import { StoreProvider } from '@/contexts/StoreContext'
import { AppRoutes } from '@/routes/AppRoutes'

export function App() {
  return (
    <AppErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <StoreProvider>
            <AppRoutes />
          </StoreProvider>
        </AuthProvider>
      </HelmetProvider>
    </AppErrorBoundary>
  )
}
