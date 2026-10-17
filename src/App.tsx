import { HelmetProvider } from 'react-helmet-async'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { CartDrawer } from '@/components/catalog/CartDrawer'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { StoreProvider } from '@/contexts/StoreContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { AppRoutes } from '@/routes/AppRoutes'

export function App() {
  return (
    <AppErrorBoundary>
      <HelmetProvider>
        <ToastProvider>
          <AuthProvider>
            <StoreProvider>
              <CartProvider>
                <AppRoutes />
                <CartDrawer />
              </CartProvider>
            </StoreProvider>
          </AuthProvider>
        </ToastProvider>
      </HelmetProvider>
    </AppErrorBoundary>
  )
}
