import { useEffect, useRef, useState, type FormEvent } from 'react'
import { RowMenu } from '@/components/admin/RowMenu'
import { SingleImageField } from '@/components/admin/SingleImageField'
import { Field, TextArea, Toggle } from '@/components/admin/FormControls'
import { Button } from '@/components/ui/Button'
import { Notice, Skeleton } from '@/components/ui/Feedback'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { listAllCategories, removeCategory, saveCategory, updateCategoryActive } from '@/services/categoriesService'
import { resolveLocalImage } from '@/services/storageService'
import type { Category, LocalImage } from '@/types/models'
import { getErrorMessage } from '@/utils/errors'
import { slugify } from '@/utils/format'

type Draft = {
  id: string | null
  name: string
  slug: string
  description: string
  order: string
  active: boolean
  image: LocalImage | null
  previousPath: string
}

const emptyDraft: Draft = { id: null, name: '', slug: '', description: '', order: '0', active: true, image: null, previousPath: '' }

export function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [open, setOpen] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Category | null>(null)
  const draftRef = useRef(draft)
  const savedSerial = useRef('')
  draftRef.current = draft

  async function load() {
    setCategories(await listAllCategories())
  }

  useEffect(() => {
    void load()
      .catch((err: unknown) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  function startCreate() {
    setDraft(emptyDraft)
    setSlugTouched(false)
    setOpen(true)
  }

  function startEdit(category: Category) {
    setDraft({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      order: String(category.order),
      active: category.active,
      image: category.image ? { url: category.image, path: category.imagePath } : null,
      previousPath: category.imagePath,
    })
    setSlugTouched(true)
    savedSerial.current = serial({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      order: String(category.order),
      active: category.active,
      image: category.image ? { url: category.image, path: category.imagePath } : null,
      previousPath: category.imagePath,
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
    if (!current.name.trim()) {
      if (closeAfter) setError('Informe o nome da categoria.')
      return
    }
    const nextSerial = serial(current)
    if (!closeAfter && current.id && nextSerial === savedSerial.current) return
    setSaving(true)
    setError(null)
    try {
      const image = await resolveLocalImage(current.image, 'categories', current.previousPath)
      await saveCategory(current.id, {
        name: current.name,
        slug: slugify(current.slug || current.name),
        description: current.description,
        image: image.url,
        imagePath: image.path,
        active: current.active,
        order: Number(current.order) || 0,
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
      await removeCategory(pending)
      setPending(null)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
      setPending(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Organização</p>
          <h1 className="mt-2 font-serif text-5xl text-plum">Categorias</h1>
        </div>
        <Button onClick={startCreate}>Nova categoria</Button>
      </div>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      {loading ? <Skeleton className="mt-8 h-48" /> : null}
      <div className="mt-8 grid gap-4">
        {categories.map((category) => (
          <article key={category.id} className="flex flex-col gap-4 border border-plum/10 bg-white p-4 sm:flex-row sm:items-center">
            {category.image ? <img src={category.image} alt="" className="h-20 w-16 object-cover" /> : <div className="h-20 w-16 bg-ivory-deep" />}
            <div className="flex-1">
              <h2 className="font-serif text-2xl text-plum">{category.name}</h2>
              <p className="text-sm text-muted">{category.active ? 'Ativa' : 'Inativa'} · ordem {category.order}</p>
            </div>
            <RowMenu
              items={[
                { label: 'Editar', onSelect: () => startEdit(category) },
                {
                  label: category.active ? 'Desativar' : 'Ativar',
                  onSelect: () => void updateCategoryActive(category.id, !category.active).then(load).catch((err: unknown) => setError(getErrorMessage(err))),
                },
                { label: 'Excluir', danger: true, onSelect: () => setPending(category) },
              ]}
            />
          </article>
        ))}
      </div>
      <Modal open={open} title={draft.id ? 'Editar categoria' : 'Nova categoria'} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)} onBlur={() => { if (draftRef.current.id) void persist(false) }}>
          {draft.id ? <p className="text-xs text-gold-deep">{saving ? 'Salvando…' : saved ? 'Salvo' : 'Salva ao sair do campo.'}</p> : null}
          <Field label="Nome" value={draft.name} onChange={(event) => edit({ name: event.target.value, slug: slugTouched ? draftRef.current.slug : slugify(event.target.value) })} required />
          <Field label="Slug" value={draft.slug} onChange={(event) => { setSlugTouched(true); edit({ slug: event.target.value }) }} />
          <TextArea label="Descrição" value={draft.description} onChange={(event) => edit({ description: event.target.value })} />
          <Field label="Ordem" type="number" value={draft.order} onChange={(event) => edit({ order: event.target.value })} />
          <SingleImageField label="Imagem" image={draft.image} onChange={(image) => { edit({ image }); if (draftRef.current.id) queueMicrotask(() => void persist(false)) }} />
          <Toggle label="Ativa" checked={draft.active} onChange={(active) => { edit({ active }); if (draftRef.current.id) queueMicrotask(() => void persist(false)) }} />
          {draft.id ? null : <Button type="submit" disabled={saving}>{saving ? 'Salvando' : 'Salvar categoria'}</Button>}
        </form>
      </Modal>
      <ConfirmDialog open={pending !== null} title="Excluir categoria" description={pending ? `Excluir “${pending.name}”?` : ''} busy={saving} onClose={() => setPending(null)} onConfirm={() => void onDelete()} />
    </div>
  )
}
