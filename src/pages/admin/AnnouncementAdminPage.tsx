import { useEffect, useState, type FormEvent } from 'react'
import { FormSection, Field, TextArea, Toggle } from '@/components/admin/FormControls'
import { Button } from '@/components/ui/Button'
import { Notice, Spinner } from '@/components/ui/Feedback'
import { getSettings, saveSettings } from '@/services/settingsService'
import { defaultSettings, type StoreSettings } from '@/types/models'
import { getErrorMessage } from '@/utils/errors'

export function AnnouncementAdminPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getSettings()
      .then((next) => {
        if (!cancelled) setSettings(next)
      })
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const next = { ...settings, announcementVersion: settings.announcementVersion + 1 }
      await saveSettings(next)
      setSettings(next)
      setSuccess('Anúncio publicado. Quem já fechou a versão anterior volta a ver esta.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Carregando anúncio" />

  return (
    <form className="mx-auto max-w-3xl" onSubmit={(event) => void onSubmit(event)}>
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Abertura</p>
      <h1 className="mt-2 font-serif text-5xl text-plum">Anúncio</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">Aparece quando a pessoa abre o catálogo. Depois de fechar, não volta, até você publicar uma versão nova.</p>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      {success ? <div className="mt-6"><Notice tone="success">{success}</Notice></div> : null}
      <div className="mt-8">
        <FormSection title="Mensagem">
          <Toggle label="Mostrar anúncio" checked={settings.announcementActive} onChange={(announcementActive) => setSettings((current) => ({ ...current, announcementActive }))} />
          <Field label="Título" value={settings.announcementTitle} onChange={(event) => setSettings((current) => ({ ...current, announcementTitle: event.target.value }))} />
          <TextArea label="Texto" value={settings.announcementText} onChange={(event) => setSettings((current) => ({ ...current, announcementText: event.target.value }))} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Texto do botão" value={settings.announcementButtonText} onChange={(event) => setSettings((current) => ({ ...current, announcementButtonText: event.target.value }))} />
            <Field label="Link" value={settings.announcementLink} onChange={(event) => setSettings((current) => ({ ...current, announcementLink: event.target.value }))} placeholder="/#destaques" />
          </div>
        </FormSection>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? 'Publicando' : 'Publicar anúncio'}</Button>
      </div>
    </form>
  )
}
