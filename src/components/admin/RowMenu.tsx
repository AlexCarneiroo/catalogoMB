import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

export type RowAction = {
  label: string
  onSelect?: () => void
  to?: string
  href?: string
  danger?: boolean
  disabled?: boolean
}

export function RowMenu({ items }: { items: RowAction[] }) {
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = 208
    const height = items.length * 42 + 16
    const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12))
    const top = rect.bottom + 8 + height > window.innerHeight ? Math.max(12, rect.top - height - 8) : rect.bottom + 8
    setPlace({ top, left })
    setOpen((value) => !value)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Abrir ações"
        onClick={toggle}
        className="grid h-9 w-9 place-items-center rounded-full border border-plum/10 bg-ivory text-plum transition hover:border-gold hover:bg-white"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="3.2" r="1.35" fill="currentColor" />
          <circle cx="8" cy="8" r="1.35" fill="currentColor" />
          <circle cx="8" cy="12.8" r="1.35" fill="currentColor" />
        </svg>
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              className="admin-ui fixed z-[80] w-52 overflow-hidden rounded-2xl border border-plum/10 bg-white py-1.5 shadow-soft"
              style={{ top: place.top, left: place.left }}
            >
              {items.map((item) => {
                const className = `block w-full px-4 py-2.5 text-left text-sm transition hover:bg-lilac-soft disabled:opacity-40 ${item.danger ? 'text-rose' : 'text-plum'}`
                if (item.to) {
                  return (
                    <Link key={item.label} role="menuitem" to={item.to} className={className} onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                  )
                }
                if (item.href) {
                  return (
                    <a key={item.label} role="menuitem" href={item.href} target="_blank" rel="noreferrer" className={className} onClick={() => setOpen(false)}>
                      {item.label}
                    </a>
                  )
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    className={className}
                    onClick={() => {
                      setOpen(false)
                      item.onSelect?.()
                    }}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
