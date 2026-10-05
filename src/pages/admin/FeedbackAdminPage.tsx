import { useEffect, useState, type FormEvent } from 'react'
import { Field, TextArea, Toggle } from '@/components/admin/FormControls'
import { RowMenu } from '@/components/admin/RowMenu'
import { Button } from '@/components/ui/Button'
import { Notice, Spinner } from '@/components/ui/Feedback'
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
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const [next, settings] = await Promise.all([listAllTestimonials(), getSettings()])
    setItems(next)
    setSectionOn(settings.feedbackEnabled)
  }

  useEffect(() => {
    let cancelled = false
    void load()
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err))
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
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await saveTestimonial(editing, { ...draft, name: draft.name, text: draft.text, detail: draft.detail, active: draft.active, order: Number(draft.order) || items.length + 1 })
      setDraft(empty)
      setEditing(null)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function toggleItem(item: Testimonial) {
    setError(null)
    try {
      await updateTestimonialActive(item.id, !item.active)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function remove(item: Testimonial) {
    setError(null)
    try {
      await removeTestimonial(item.id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
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
                { label: 'Editar', onSelect: () => { setEditing(item.id); setDraft({ name: item.name, detail: item.detail, text: item.text, active: item.active, order: item.order }) } },
                { label: item.active ? 'Desativar' : 'Manter no ar', onSelect: () => void toggleItem(item) },
                { label: 'Excluir', danger: true, onSelect: () => void remove(item) },
              ]}
            />
          </article>
        ))}
      </div>
      <form className="mt-8 space-y-4 border border-plum/10 bg-white p-5" onSubmit={(event) => void onSubmit(event)}>
        <h2 className="font-serif text-3xl text-plum">{editing ? 'Editar nota' : 'Nova nota'}</h2>
        <Field label="Nome" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        <Field label="Detalhe" value={draft.detail} onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))} placeholder="Cidade ou produto" />
        <TextArea label="Texto" value={draft.text} onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value }))} />
        <Toggle label="Publicada" checked={draft.active} onChange={(active) => setDraft((current) => ({ ...current, active }))} />
        <div className="flex gap-3">
          <Button type="submit">{editing ? 'Salvar nota' : 'Adicionar nota'}</Button>
          {editing ? <Button variant="ghost" onClick={() => { setEditing(null); setDraft(empty) }}>Cancelar</Button> : null}
        </div>
      </form>
    </div>
  )
}
