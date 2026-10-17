import type { ProductColor } from '@/types/models'

type Props = {
  colors: ProductColor[]
  onEdit: (colors: ProductColor[]) => void
  onCommit: (colors: ProductColor[]) => void
}

export function ProductColorsField({ colors, onEdit, onCommit }: Props) {
  function add() {
    onCommit([...colors, { id: crypto.randomUUID(), name: '', hex: '#C45C6A' }])
  }

  function patch(id: string, partial: Partial<ProductColor>, commit: boolean) {
    const next = colors.map((color) => (color.id === id ? { ...color, ...partial } : color))
    if (commit) onCommit(next)
    else onEdit(next)
  }

  return (
    <div className="space-y-3">
      {colors.length === 0 ? (
        <p className="text-sm leading-relaxed text-muted">Nenhuma cor cadastrada. O produto segue com uma opção só.</p>
      ) : (
        <ul className="space-y-3">
          {colors.map((color, index) => (
            <li key={color.id} className="flex flex-wrap items-end gap-3 border border-plum/10 bg-ivory px-3 py-3">
              <label className="block">
                <span className="mb-2 block text-[11px] tracking-[0.16em] text-muted uppercase">Amostra</span>
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(color.hex) ? color.hex : '#C45C6A'}
                  onChange={(event) => patch(color.id, { hex: event.target.value }, true)}
                  className="h-11 w-14 cursor-pointer border border-plum/15 bg-white p-1"
                  aria-label={`Amostra da cor ${index + 1}`}
                />
              </label>
              <label className="min-w-48 flex-1">
                <span className="mb-2 block text-[11px] tracking-[0.16em] text-muted uppercase">Nome da cor</span>
                <input
                  value={color.name}
                  onChange={(event) => patch(color.id, { name: event.target.value }, false)}
                  placeholder="Rosa queimado"
                  className="w-full border border-plum/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-gold"
                />
              </label>
              <button
                type="button"
                onClick={() => onCommit(colors.filter((item) => item.id !== color.id))}
                className="mb-1 px-2 py-3 text-[11px] tracking-[0.14em] text-plum uppercase"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={add}
        disabled={colors.length >= 12}
        className="text-[11px] tracking-[0.16em] text-gold-deep uppercase disabled:opacity-40"
      >
        Adicionar cor
      </button>
    </div>
  )
}
