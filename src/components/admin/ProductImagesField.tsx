import type { ProductImageDraft } from '@/types/models'

type Props = {
  images: ProductImageDraft[]
  onChange: (images: ProductImageDraft[]) => void
}

export function ProductImagesField({ images, onChange }: Props) {
  function addFiles(list: FileList | null) {
    if (!list) return
    const next = [...images]
    for (const file of list) {
      if (next.length >= 8) break
      next.push({
        key: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        path: '',
        file,
        isMain: next.length === 0,
      })
    }
    onChange(ensureMain(next))
  }

  function remove(key: string) {
    const current = images.find((image) => image.key === key)
    if (current?.file) URL.revokeObjectURL(current.url)
    onChange(ensureMain(images.filter((image) => image.key !== key)))
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    const current = next[index]
    const swap = next[target]
    if (!current || !swap) return
    next[index] = swap
    next[target] = current
    onChange(next)
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer border border-dashed border-plum/20 px-4 py-8 text-sm text-muted">
        <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => addFiles(event.target.files)} />
        Escolher fotos
      </label>
      <p className="mt-2 text-xs text-muted">Até 8 imagens. A principal aparece primeiro no catálogo. O preview acontece antes de salvar.</p>
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {images.map((image, index) => (
          <figure key={image.key} className="border border-plum/10 bg-ivory p-2">
            <img src={image.url} alt="" className="aspect-[3/4] w-full object-cover" />
            <figcaption className="mt-2 space-y-1">
              <button type="button" className="block text-[11px] uppercase tracking-[0.12em] text-plum" onClick={() => onChange(images.map((item) => ({ ...item, isMain: item.key === image.key })))}>
                {image.isMain ? 'Principal' : 'Definir principal'}
              </button>
              <div className="flex gap-2 text-[11px] uppercase tracking-[0.12em] text-muted">
                <button type="button" onClick={() => move(index, -1)}>Subir</button>
                <button type="button" onClick={() => move(index, 1)}>Descer</button>
                <button type="button" onClick={() => remove(image.key)}>Excluir</button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

function ensureMain(images: ProductImageDraft[]): ProductImageDraft[] {
  if (images.length === 0 || images.some((image) => image.isMain)) return images
  return images.map((image, index) => ({ ...image, isMain: index === 0 }))
}
