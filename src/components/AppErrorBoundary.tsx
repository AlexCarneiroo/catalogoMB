import { Component, type ReactNode } from 'react'
import { buttonClass } from '@/components/ui/Button'

type State = { error: Error | null }

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-ivory px-6 text-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Algo saiu do esperado</p>
            <h1 className="mt-3 font-serif text-4xl text-plum">Não foi possível abrir esta página</h1>
            <button type="button" className={buttonClass('primary', 'mt-8')} onClick={() => window.location.reload()}>
              Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
