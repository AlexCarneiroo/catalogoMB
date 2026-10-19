import { Suspense, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Monogram, Wordmark } from '@/components/brand/BrandMark'
import { Spinner } from '@/components/ui/Feedback'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useStore } from '@/contexts/StoreContext'
import { shouldUsePreview } from '@/services/previewStore'
import { cn } from '@/utils/format'

const links = [
  { to: '/admin', label: 'Painel', end: true },
  { to: '/admin/produtos', label: 'Produtos', end: false },
  { to: '/admin/destaques', label: 'Destaques', end: false },
  { to: '/admin/estoque', label: 'Estoque', end: false },
  { to: '/admin/anuncio', label: 'Anúncio', end: false },
  { to: '/admin/feedbacks', label: 'Feedbacks', end: false },
  { to: '/admin/categorias', label: 'Categorias', end: false },
  { to: '/admin/banners', label: 'Banners', end: false },
  { to: '/admin/configuracoes', label: 'Loja', end: false },
]

export function AdminLayout() {
  const { settings } = useStore()
  const { user, logout, configured } = useAuth()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [open, setOpen] = useState(false)

  async function onLogout() {
    notify('Você saiu.')
    if (!configured) {
      navigate('/')
      return
    }
    await logout()
    navigate('/admin/login')
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn('px-4 py-3 text-sm tracking-wide', isActive ? 'bg-ivory/10 text-gold' : 'text-ivory/80 hover:bg-ivory/5')
          }
        >
          {link.label}
        </NavLink>
      ))}
      <a href="/" className="mt-6 px-4 py-3 text-sm text-ivory/70" onClick={() => setOpen(false)}>
        Ver catálogo
      </a>
    </nav>
  )

  return (
    <div className="admin-ui min-h-screen bg-ivory md:grid md:grid-cols-[250px_1fr]">
      <aside className="hidden overflow-y-auto bg-plum text-ivory md:flex md:flex-col">
        <div className="px-6 py-8">
          <Monogram className="h-14 w-14" />
          <Wordmark variant="ivory" alt={settings.storeName} className="mt-5 h-10" />
          <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-gold">Administração</p>
        </div>
        {nav}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 bg-plum text-ivory md:hidden">
          <div className="flex items-center justify-between px-5 py-6">
            <Wordmark variant="ivory" alt={settings.storeName} className="h-10" />
            <button type="button" onClick={() => setOpen(false)} className="text-[11px] uppercase tracking-[0.18em]">
              Fechar
            </button>
          </div>
          {nav}
        </div>
      ) : null}
      <div>
        {shouldUsePreview() ? (
          <p className="border-b border-gold/40 bg-gold/15 px-4 py-3 text-sm leading-relaxed text-plum md:px-8">
            {configured
              ? 'O acesso usa o Firebase. Neste modo de desenvolvimento, o catálogo fica neste navegador.'
              : 'O Firebase ainda não está conectado. O que você salvar fica neste navegador.'}
          </p>
        ) : null}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-plum/10 bg-ivory/90 px-4 py-4 backdrop-blur md:px-8">
          <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-plum md:hidden" onClick={() => setOpen(true)}>
            Menu
          </button>
          <p className="hidden text-sm text-muted md:block">{configured ? user?.email : 'Pré-visualização neste navegador'}</p>
          <button type="button" onClick={() => void onLogout()} className="text-[11px] uppercase tracking-[0.18em] text-plum">
            Sair
          </button>
        </header>
        <div className="px-4 py-8 md:px-8 md:py-10">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
