import { HelmetProvider } from 'react-helmet-async'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { CartDrawer } from '@/components/catalog/CartDrawer'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { StoreProvider } from '@/contexts/StoreContext'
import { AppRoutes } from '@/routes/AppRoutes'

export function App() {
  return (
    <AppErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <StoreProvider>
            <CartProvider>
              <AppRoutes />
              <CartDrawer />
            </CartProvider>
          </StoreProvider>
        </AuthProvider>
      </HelmetProvider>
    </AppErrorBoundary>
  )
}
