import { useEffect, useState } from 'react'
import { FormSection, Field, TextArea, Toggle } from '@/components/admin/FormControls'
import { Button } from '@/components/ui/Button'
import { Notice, Spinner } from '@/components/ui/Feedback'
import { useAutosave } from '@/hooks/useAutosave'
import { getSettings, saveSettings } from '@/services/settingsService'
import { defaultSettings, type StoreSettings } from '@/types/models'
import { getErrorMessage } from '@/utils/errors'

export function AnnouncementAdminPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const autosave = useAutosave(async (current: StoreSettings) => {
    await saveSettings(current)
    return current
  })

  useEffect(() => {
    let cancelled = false
    void getSettings()
      .then((next) => {
        if (!cancelled) {
          setSettings(next)
          autosave.sync(next, true)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) autosave.setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function update(partial: Partial<StoreSettings>) {
    setSettings((current) => {
      const next = { ...current, ...partial }
      autosave.sync(next)
      return next
    })
  }

  function commit(partial: Partial<StoreSettings>) {
    update(partial)
    queueMicrotask(() => void autosave.flush())
  }

  async function publish() {
    setPublishing(true)
    setSuccess(null)
    let nextVersion: StoreSettings | null = null
    setSettings((current) => {
      nextVersion = { ...current, announcementVersion: current.announcementVersion + 1 }
      autosave.sync(nextVersion)
      return nextVersion
    })
    const ok = await autosave.flush()
    if (ok) setSuccess('Anúncio publicado. Quem já fechou a versão anterior volta a ver esta.')
    setPublishing(false)
  }

  if (loading) return <Spinner label="Carregando anúncio" />

  return (
    <form
      className="mx-auto max-w-3xl"
      onSubmit={(event) => {
        event.preventDefault()
        void publish()
      }}
      onBlur={autosave.onBlur}
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Abertura</p>
      <h1 className="mt-2 font-serif text-5xl text-plum">Anúncio</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">Aparece quando a pessoa abre o catálogo. O texto salva ao sair do campo. Publicar cria uma versão nova para quem já fechou o aviso.</p>
      <p className="mt-2 text-xs text-gold-deep">{autosave.saving ? 'Salvando…' : autosave.saved ? 'Salvo' : ''}</p>
      {autosave.error ? <div className="mt-6"><Notice>{autosave.error}</Notice></div> : null}
      {success ? <div className="mt-6"><Notice tone="success">{success}</Notice></div> : null}
      <div className="mt-8">
        <FormSection title="Mensagem">
          <Toggle label="Mostrar anúncio" checked={settings.announcementActive} onChange={(announcementActive) => commit({ announcementActive })} />
          <Field label="Título" value={settings.announcementTitle} onChange={(event) => update({ announcementTitle: event.target.value })} />
          <TextArea label="Texto" value={settings.announcementText} onChange={(event) => update({ announcementText: event.target.value })} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Texto do botão" value={settings.announcementButtonText} onChange={(event) => update({ announcementButtonText: event.target.value })} />
            <Field label="Link" value={settings.announcementLink} onChange={(event) => update({ announcementLink: event.target.value })} placeholder="/#destaques" />
          </div>
        </FormSection>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={publishing || autosave.saving}>{publishing ? 'Publicando' : 'Publicar anúncio'}</Button>
      </div>
    </form>
  )
}
