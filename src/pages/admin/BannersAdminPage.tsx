import { useEffect, useRef, useState, type FormEvent } from 'react'
import { RowMenu } from '@/components/admin/RowMenu'
import { SingleImageField } from '@/components/admin/SingleImageField'
import { Field, TextArea, Toggle } from '@/components/admin/FormControls'
import { Button } from '@/components/ui/Button'
import { Notice, Skeleton } from '@/components/ui/Feedback'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { listAllBanners, removeBanner, saveBanner, updateBannerActive } from '@/services/bannersService'
import { resolveLocalImage } from '@/services/storageService'
import type { Banner, LocalImage } from '@/types/models'
import { getErrorMessage } from '@/utils/errors'

type Draft = {
  id: string | null
  title: string
  subtitle: string
  buttonText: string
  link: string
  order: string
  active: boolean
  image: LocalImage | null
  previousPath: string
}

const emptyDraft: Draft = {
  id: null,
  title: '',
  subtitle: '',
  buttonText: 'Ver produtos',
  link: '/produtos',
  order: '0',
  active: true,
  image: null,
  previousPath: '',
}

export function BannersAdminPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Banner | null>(null)
  const draftRef = useRef(draft)
  const savedSerial = useRef('')
  draftRef.current = draft

  async function load() {
    setBanners(await listAllBanners())
  }

  useEffect(() => {
    void load()
      .catch((err: unknown) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  function startEdit(banner: Banner) {
    setDraft({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      buttonText: banner.buttonText,
      link: banner.link,
      order: String(banner.order),
      active: banner.active,
      image: banner.image ? { url: banner.image, path: banner.imagePath } : null,
      previousPath: banner.imagePath,
    })
    savedSerial.current = serial({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      buttonText: banner.buttonText,
      link: banner.link,
      order: String(banner.order),
      active: banner.active,
      image: banner.image ? { url: banner.image, path: banner.imagePath } : null,
      previousPath: banner.imagePath,
    })
    setSaved(false)
    setOpen(true)
  }

  function serial(value: Draft): string {
    return JSON.stringify({ ...value, image: value.image ? { url: value.image.url, path: value.image.path } : null })
  }

  function edit(partial: Partial<Draft>) {
    setDraft((current) => {
      const next = { ...current, ...partial }
      draftRef.current = next
      return next
    })
  }

  async function persist(closeAfter: boolean) {
    const current = draftRef.current
    const nextSerial = serial(current)
    if (!closeAfter && current.id && nextSerial === savedSerial.current) return
    setSaving(true)
    setError(null)
    try {
      const image = await resolveLocalImage(current.image, 'banners', current.previousPath)
      await saveBanner(current.id, {
        title: current.title,
        subtitle: current.subtitle,
        buttonText: current.buttonText,
        link: current.link,
        image: image.url,
        imagePath: image.path,
        order: Number(current.order) || 0,
        active: current.active,
      })
      const stored = { ...current, image: image.url ? { url: image.url, path: image.path } : null, previousPath: image.path }
      draftRef.current = stored
      savedSerial.current = serial(stored)
      setDraft(stored)
      setSaved(true)
      if (closeAfter) setOpen(false)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await persist(true)
  }

  async function onDelete() {
    if (!pending) return
    setSaving(true)
    try {
      await removeBanner(pending)
      setPending(null)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Home</p>
          <h1 className="mt-2 font-serif text-5xl text-plum">Banners</h1>
        </div>
        <Button onClick={() => { setDraft(emptyDraft); setOpen(true) }}>Novo banner</Button>
      </div>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      {loading ? <Skeleton className="mt-8 h-48" /> : null}
      <div className="mt-8 grid gap-4">
        {banners.map((banner) => (
          <article key={banner.id} className="grid gap-4 border border-plum/10 bg-white p-4 md:grid-cols-[140px_1fr_auto] md:items-center">
            {banner.image ? <img src={banner.image} alt="" className="h-24 w-full object-cover md:w-36" /> : <div className="h-24 bg-ivory-deep" />}
            <div>
              <h2 className="font-serif text-2xl text-plum">{banner.title || 'Sem título'}</h2>
              <p className="text-sm text-muted">{banner.active ? 'Ativo' : 'Inativo'} · ordem {banner.order}</p>
            </div>
            <RowMenu
              items={[
                { label: 'Editar', onSelect: () => startEdit(banner) },
                {
                  label: banner.active ? 'Desativar' : 'Ativar',
                  onSelect: () => void updateBannerActive(banner.id, !banner.active).then(load).catch((err: unknown) => setError(getErrorMessage(err))),
                },
                { label: 'Excluir', danger: true, onSelect: () => setPending(banner) },
              ]}
            />
          </article>
        ))}
      </div>
      <Modal open={open} title={draft.id ? 'Editar banner' : 'Novo banner'} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)} onBlur={() => { if (draftRef.current.id) void persist(false) }}>
          {draft.id ? <p className="text-xs text-gold-deep">{saving ? 'Salvando…' : saved ? 'Salvo' : 'Salva ao sair do campo.'}</p> : null}
          <Field label="Título" value={draft.title} onChange={(event) => edit({ title: event.target.value })} />
          <TextArea label="Subtítulo" value={draft.subtitle} onChange={(event) => edit({ subtitle: event.target.value })} />
          <Field label="Texto do botão" value={draft.buttonText} onChange={(event) => edit({ buttonText: event.target.value })} />
          <Field label="Link" value={draft.link} onChange={(event) => edit({ link: event.target.value })} />
          <Field label="Ordem" type="number" value={draft.order} onChange={(event) => edit({ order: event.target.value })} />
          <SingleImageField label="Imagem" image={draft.image} onChange={(image) => { edit({ image }); if (draftRef.current.id) queueMicrotask(() => void persist(false)) }} />
          <Toggle label="Ativo" checked={draft.active} onChange={(active) => { edit({ active }); if (draftRef.current.id) queueMicrotask(() => void persist(false)) }} />
          {draft.id ? null : <Button type="submit" disabled={saving}>{saving ? 'Salvando' : 'Salvar banner'}</Button>}
        </form>
      </Modal>
      <ConfirmDialog open={pending !== null} title="Excluir banner" description="Esta imagem deixa de aparecer na home." busy={saving} onClose={() => setPending(null)} onConfirm={() => void onDelete()} />
    </div>
  )
}
