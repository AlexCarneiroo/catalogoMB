import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/Feedback'
import { useAuth } from '@/contexts/AuthContext'
import { buttonClass } from '@/components/ui/Button'

export function ProtectedRoute() {
  const { user, isAdmin, loading, configured, logout } = useAuth()
  const location = useLocation()

  if (!configured) return <Outlet />
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ivory">
        <Spinner label="Abrindo o painel" />
      </div>
    )
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-ivory px-6 text-center">
        <div className="max-w-md">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Acesso restrito</p>
          <h1 className="mt-3 font-serif text-4xl text-plum">Esta conta não administra a loja</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            O acesso não muda por uma opção na tela. Ele depende do documento de administrador no Firestore.
          </p>
          <button type="button" className={buttonClass('primary', 'mt-8')} onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </div>
    )
  }
  return <Outlet />
}
