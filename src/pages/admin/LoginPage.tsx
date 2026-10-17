import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Monogram, Wordmark } from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Feedback'
import { Seo } from '@/components/ui/Seo'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/utils/errors'

export function LoginPage() {
  const { configured, user, isAdmin, loading, login, register } = useAuth()
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user && isAdmin) return <Navigate to="/admin" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (mode === 'criar' && password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (mode === 'criar') await register(email, password)
      else await login(email, password)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-ui relative grid min-h-screen place-items-center overflow-hidden bg-ivory px-5 py-16">
      <div className="pointer-events-none absolute -top-10 left-10 h-48 w-48 rounded-full bg-rose/40 blur-3xl drift" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-lilac/30 blur-3xl" />
      <Seo title={mode === 'criar' ? 'Criar acesso' : 'Entrar'} path="/admin/login" />
      <div className="w-full max-w-md">
        <Monogram className="mb-6 h-16 w-16" alt="Mabelle Make" />
        <Wordmark alt="Mabelle Make" className="h-14" />
        <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-gold-deep">Painel</p>
        <h1 className="display mt-3 text-6xl text-plum">{mode === 'criar' ? 'Criar acesso' : 'Entrar'}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {mode === 'criar'
            ? 'Escolha o e-mail e a senha do administrador. A primeira conta criada passa a administrar a loja.'
            : 'Use o e-mail e a senha que você cadastrou para abrir o painel.'}
        </p>
        {!configured ? (
          <div className="mt-6">
            <Notice>Crie um arquivo .env a partir de .env.example com as chaves do Firebase.</Notice>
          </div>
        ) : null}
        {user && !isAdmin && !loading ? (
          <div className="mt-6">
            <Notice>Esta conta autenticou, mas não tem o papel de administrador.</Notice>
          </div>
        ) : null}
        <div className="mt-8 grid grid-cols-2 rounded-full bg-white p-1">
          <button type="button" className={`rounded-full px-4 py-2 text-sm ${mode === 'entrar' ? 'bg-plum text-ivory' : 'text-plum'}`} onClick={() => { setMode('entrar'); setError(null) }}>
            Entrar
          </button>
          <button type="button" className={`rounded-full px-4 py-2 text-sm ${mode === 'criar' ? 'bg-plum text-ivory' : 'text-plum'}`} onClick={() => { setMode('criar'); setError(null) }}>
            Criar acesso
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-muted">E-mail</span>
            <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full border border-plum/15 bg-white px-4 py-3 text-base outline-none focus:border-gold" />
          </label>
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-muted">Senha</span>
            <input type="password" autoComplete={mode === 'criar' ? 'new-password' : 'current-password'} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full border border-plum/15 bg-white px-4 py-3 text-base outline-none focus:border-gold" />
          </label>
          {mode === 'criar' ? (
            <label className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-muted">Confirmar senha</span>
              <input type="password" autoComplete="new-password" required minLength={6} value={confirm} onChange={(event) => setConfirm(event.target.value)} className="min-h-11 w-full border border-plum/15 bg-white px-4 py-3 text-base outline-none focus:border-gold" />
            </label>
          ) : null}
          {error ? <Notice>{error}</Notice> : null}
          <Button type="submit" disabled={busy || !configured} className="w-full">
            {busy ? 'Aguarde' : mode === 'criar' ? 'Criar e entrar' : 'Entrar no painel'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted">
          <Link to="/" className="text-plum">Voltar ao catálogo</Link>
        </p>
      </div>
    </div>
  )
}
