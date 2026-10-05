import type { LocalImage } from '@/types/models'

export function SingleImageField({
  label,
  image,
  onChange,
}: {
  label: string
  image: LocalImage | null
  onChange: (image: LocalImage | null) => void
}) {
  function select(file: File | undefined) {
    if (!file) return
    if (image?.file) URL.revokeObjectURL(image.url)
    onChange({ url: URL.createObjectURL(file), path: image?.path ?? '', file })
  }

  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      {image?.url ? <img src={image.url} alt="" className="mb-3 aspect-[4/3] w-full max-w-xs object-cover" /> : null}
      <div className="flex flex-wrap gap-3">
        <label className="cursor-pointer border border-plum/15 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-plum">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              select(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          {image?.url ? 'Trocar imagem' : 'Enviar imagem'}
        </label>
        {image?.url ? (
          <button
            type="button"
            className="text-[11px] uppercase tracking-[0.14em] text-muted"
            onClick={() => {
              if (image.file) URL.revokeObjectURL(image.url)
              onChange(null)
            }}
          >
            Remover
          </button>
        ) : null}
      </div>
    </div>
  )
}
