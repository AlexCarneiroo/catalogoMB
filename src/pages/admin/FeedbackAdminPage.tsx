import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Field, TextArea, Toggle } from '@/components/admin/FormControls'
import { RowMenu } from '@/components/admin/RowMenu'
import { Button } from '@/components/ui/Button'
import { Notice, Spinner } from '@/components/ui/Feedback'
import { useToast } from '@/contexts/ToastContext'
import { getSettings, saveSettings } from '@/services/settingsService'
import { listAllTestimonials, removeTestimonial, saveTestimonial, updateTestimonialActive } from '@/services/testimonialsService'
import type { Testimonial } from '@/types/models'
import { getErrorMessage } from '@/utils/errors'

const empty = { name: '', detail: '', text: '', active: true, order: 1 }

export function FeedbackAdminPage() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [sectionOn, setSectionOn] = useState(true)
  const [draft, setDraft] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { notify } = useToast()
  const draftRef = useRef(draft)
  const editingRef = useRef(editing)
  draftRef.current = draft
  editingRef.current = editing

  async function load() {
    const [next, settings] = await Promise.all([listAllTestimonials(), getSettings()])
    setItems(next)
    setSectionOn(settings.feedbackEnabled)
  }

  useEffect(() => {
    let cancelled = false
    void load()
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = getErrorMessage(err)
          setError(message)
          notify(message, 'error')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function toggleSection(feedbackEnabled: boolean) {
    setSectionOn(feedbackEnabled)
    setError(null)
    try {
      const settings = await getSettings()
      await saveSettings({ ...settings, feedbackEnabled })
      notify(feedbackEnabled ? 'Seção de feedbacks ativada.' : 'Seção de feedbacks oculta.')
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      notify(message, 'error')
    }
  }

  function editDraft(partial: Partial<typeof empty>) {
    setDraft((current) => {
      const next = { ...current, ...partial }
      draftRef.current = next
      return next
    })
  }

  async function persist(reset: boolean) {
    const current = draftRef.current
    const id = editingRef.current
    if (!reset && !id) return
    if (!current.name.trim() || !current.text.trim()) {
      if (reset) notify('Informe o nome e o texto da nota.', 'error')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveTestimonial(id, { ...current, order: Number(current.order) || items.length + 1 })
      setSaved(true)
      notify(reset ? 'Nota adicionada.' : 'Nota salva.')
      if (reset) {
        setDraft(empty)
        setEditing(null)
        draftRef.current = empty
        editingRef.current = null
        setSaved(false)
      }
      await load()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      notify(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await persist(true)
  }

  async function toggleItem(item: Testimonial) {
    setError(null)
    try {
      await updateTestimonialActive(item.id, !item.active)
      notify(item.active ? 'Nota desativada.' : 'Nota publicada.')
      await load()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      notify(message, 'error')
    }
  }

  async function remove(item: Testimonial) {
    setError(null)
    try {
      await removeTestimonial(item.id)
      notify('Nota excluída.')
      await load()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      notify(message, 'error')
    }
  }

  if (loading) return <Spinner label="Carregando feedbacks" />

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Vozes</p>
      <h1 className="mt-2 font-serif text-5xl text-plum">Feedbacks</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">Notas de quem comprou ou passou pela casa. A seção inteira pode ficar oculta, e cada nota pode ser desativada sem apagar.</p>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      <div className="mt-8 border border-plum/10 bg-white p-5">
        <Toggle label="Mostrar a seção de feedbacks no catálogo" checked={sectionOn} onChange={(value) => void toggleSection(value)} />
      </div>
      <div className="mt-6 divide-y divide-plum/10 border border-plum/10 bg-white">
        {items.map((item) => (
          <article key={item.id} className="flex items-start justify-between gap-4 px-4 py-4">
            <div>
              <p className="font-serif text-xl text-plum italic">“{item.text}”</p>
              <p className="mt-2 text-xs text-muted">{item.name}{item.detail ? ` · ${item.detail}` : ''}{item.active ? '' : ' · oculto'}</p>
            </div>
            <RowMenu
              items={[
                { label: 'Editar', onSelect: () => { setEditing(item.id); editingRef.current = item.id; const next = { name: item.name, detail: item.detail, text: item.text, active: item.active, order: item.order }; setDraft(next); draftRef.current = next; setSaved(false) } },
                { label: item.active ? 'Desativar' : 'Manter no ar', onSelect: () => void toggleItem(item) },
                { label: 'Excluir', danger: true, onSelect: () => void remove(item) },
              ]}
            />
          </article>
        ))}
      </div>
      <form className="mt-8 space-y-4 border border-plum/10 bg-white p-5" onSubmit={(event) => void onSubmit(event)} onBlur={() => { if (editingRef.current) void persist(false) }}>
        <h2 className="font-serif text-3xl text-plum">{editing ? 'Editar nota' : 'Nova nota'}</h2>
        {editing ? <p className="text-xs text-gold-deep">{saving ? 'Salvando…' : saved ? 'Salvo' : 'Salva ao sair do campo.'}</p> : null}
        <Field label="Nome" value={draft.name} onChange={(event) => editDraft({ name: event.target.value })} />
        <Field label="Detalhe" value={draft.detail} onChange={(event) => editDraft({ detail: event.target.value })} placeholder="Cidade ou produto" />
        <TextArea label="Texto" value={draft.text} onChange={(event) => editDraft({ text: event.target.value })} />
        <Toggle label="Publicada" checked={draft.active} onChange={(active) => { editDraft({ active }); if (editingRef.current) queueMicrotask(() => void persist(false)) }} />
        <div className="flex gap-3">
          {editing ? null : <Button type="submit">Adicionar nota</Button>}
          {editing ? <Button variant="ghost" onClick={() => { setEditing(null); setDraft(empty); draftRef.current = empty; editingRef.current = null; setSaved(false) }}>Cancelar</Button> : null}
        </div>
      </form>
    </div>
  )
}
