import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/Button'
import { useCart } from '@/contexts/CartContext'
import { useStore } from '@/contexts/StoreContext'
import { cartCheckoutMessage, lineUnitPrice } from '@/utils/catalog'
import { formatCurrency, whatsappHref } from '@/utils/format'

export function CartDrawer() {
  const { lines, count, total, open, setOpen, setQuantity, remove, clear } = useCart()
  const { settings } = useStore()
  const message = cartCheckoutMessage(settings.storeName, lines, window.location.origin)
  const whatsapp = lines.length > 0 ? whatsappHref(settings.whatsapp, message) : ''

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopImmediatePropagation()
      setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, setOpen])

  if (!open) return null

  return createPortal(
    <div data-scroll-lock="" className="fixed inset-0 z-[120] flex justify-end bg-plum-deep/50 backdrop-blur-[6px]" role="presentation" onClick={() => setOpen(false)}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho"
        className="sheet-in flex h-[100dvh] w-full max-w-md flex-col bg-ivory shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-gold-deep uppercase">Pedido</p>
            <h2 className="font-serif text-3xl text-plum italic">Carrinho</h2>
          </div>
          <button type="button" className="grid h-11 place-items-center px-3 text-[11px] tracking-[0.18em] text-plum uppercase" onClick={() => setOpen(false)}>
            Fechar
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center px-5 pb-16">
            <p className="font-serif text-3xl text-plum italic">Seu carrinho está vazio.</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">Escolha as peças no catálogo e volte aqui para enviar o pedido no WhatsApp.</p>
            <Link to="/produtos" className={buttonClass('primary', 'mt-8')} onClick={() => setOpen(false)}>
              Ver produtos
            </Link>
          </div>
        ) : (
          <>
            <ul className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-2">
              {lines.map((line) => {
                const unit = lineUnitPrice(line.price, line.promotionalPrice)
                const cap = line.stock === null ? 99 : line.stock
                return (
                  <li key={line.productId} className="flex gap-3 border-b border-plum/10 pb-5">
                    {line.image ? (
                      <img src={line.image} alt="" className="h-24 w-16 shrink-0 rounded-2xl object-cover" />
                    ) : (
                      <span className="h-24 w-16 shrink-0 rounded-2xl bg-ivory-deep" />
                    )}
                    <div className="min-w-0 flex-1">
                      {line.category ? <p className="text-[10px] tracking-[0.16em] text-gold-deep uppercase">{line.category}</p> : null}
                      <p className="font-serif text-xl leading-tight break-words text-plum italic">{line.name}</p>
                      <p className="mt-1 text-sm text-plum">{formatCurrency(unit)}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-full bg-rose-soft">
                          <button type="button" className="grid h-11 w-11 place-items-center text-lg text-plum" aria-label={`Diminuir ${line.name}`} onClick={() => setQuantity(line.productId, line.quantity - 1)}>
                            −
                          </button>
                          <span className="min-w-6 text-center text-sm text-plum">{line.quantity}</span>
                          <button
                            type="button"
                            className="grid h-11 w-11 place-items-center text-lg text-plum disabled:opacity-40"
                            aria-label={`Aumentar ${line.name}`}
                            disabled={line.quantity >= cap}
                            onClick={() => setQuantity(line.productId, line.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm text-plum">{formatCurrency(unit * line.quantity)}</p>
                      </div>
                      <button type="button" className="mt-2 text-[11px] tracking-[0.14em] text-muted uppercase" onClick={() => remove(line.productId)}>
                        Remover
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="border-t border-plum/10 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] tracking-[0.18em] text-muted uppercase">{count} {count === 1 ? 'item' : 'itens'}</p>
                <p className="font-serif text-3xl text-plum italic">{formatCurrency(total)}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">O pedido abre no WhatsApp para você concluir com o atendimento.</p>
              {whatsapp ? (
                <a href={whatsapp} target={whatsapp.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={buttonClass('primary', 'mt-4 min-h-11 w-full')}>
                  Finalizar no WhatsApp
                </a>
              ) : (
                <p className="mt-4 text-sm text-plum">Cadastre o WhatsApp da loja no painel para enviar o pedido.</p>
              )}
              <button type="button" className="mt-3 w-full py-2 text-[11px] tracking-[0.16em] text-muted uppercase" onClick={clear}>
                Esvaziar carrinho
              </button>
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
  )
}
