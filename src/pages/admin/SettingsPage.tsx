import { useEffect, useState, type FormEvent } from 'react'
import { FormSection, Field, TextArea } from '@/components/admin/FormControls'
import { SingleImageField } from '@/components/admin/SingleImageField'
import { Button } from '@/components/ui/Button'
import { Notice, Spinner } from '@/components/ui/Feedback'
import { getSettings, saveSettings } from '@/services/settingsService'
import { resolveLocalImage } from '@/services/storageService'
import { defaultSettings, type LocalImage, type StoreSettings } from '@/types/models'
import { getErrorMessage } from '@/utils/errors'

type Images = {
  logo: LocalImage | null
  favicon: LocalImage | null
  about: LocalImage | null
}

export function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [images, setImages] = useState<Images>({ logo: null, favicon: null, about: null })
  const [paths, setPaths] = useState({ logo: '', favicon: '', about: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getSettings()
      .then((next) => {
        if (cancelled) return
        setSettings(next)
        setImages({
          logo: next.logo ? { url: next.logo, path: next.logoPath } : null,
          favicon: next.favicon ? { url: next.favicon, path: next.faviconPath } : null,
          about: next.aboutImage ? { url: next.aboutImage, path: next.aboutImagePath } : null,
        })
        setPaths({ logo: next.logoPath, favicon: next.faviconPath, about: next.aboutImagePath })
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

  function update(partial: Partial<StoreSettings>) {
    setSettings((current) => ({ ...current, ...partial }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const [logo, favicon, about] = await Promise.all([
        resolveLocalImage(images.logo, 'settings', paths.logo),
        resolveLocalImage(images.favicon, 'settings', paths.favicon),
        resolveLocalImage(images.about, 'settings', paths.about),
      ])
      const next: StoreSettings = {
        ...settings,
        logo: logo.url,
        logoPath: logo.path,
        favicon: favicon.url,
        faviconPath: favicon.path,
        aboutImage: about.url,
        aboutImagePath: about.path,
      }
      await saveSettings(next)
      setSettings(next)
      setImages({
        logo: logo.url ? logo : null,
        favicon: favicon.url ? favicon : null,
        about: about.url ? about : null,
      })
      setPaths({ logo: logo.path, favicon: favicon.path, about: about.path })
      setSuccess('Configurações salvas.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Carregando configurações" />

  return (
    <form className="mx-auto max-w-4xl space-y-6" onSubmit={(event) => void onSubmit(event)}>
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Marca</p>
        <h1 className="mt-2 font-serif text-5xl text-plum">Loja</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Nome, logo, favicon, WhatsApp, redes sociais e os textos de contato e da página Sobre.</p>
      </div>
      {error ? <Notice>{error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}
      <FormSection title="Identidade">
        <Field label="Nome da loja" value={settings.storeName} onChange={(event) => update({ storeName: event.target.value })} />
        <TextArea label="Descrição para SEO" value={settings.seoDescription} onChange={(event) => update({ seoDescription: event.target.value })} />
        <div className="grid gap-6 md:grid-cols-2">
          <SingleImageField label="Logo" image={images.logo} onChange={(logo) => setImages((current) => ({ ...current, logo }))} />
          <SingleImageField label="Favicon" image={images.favicon} onChange={(favicon) => setImages((current) => ({ ...current, favicon }))} />
        </div>
      </FormSection>
      <FormSection title="Contato">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="WhatsApp" value={settings.whatsapp} onChange={(event) => update({ whatsapp: event.target.value })} placeholder="5511999999999" />
          <Field label="Instagram" value={settings.instagram} onChange={(event) => update({ instagram: event.target.value })} placeholder="@loja ou URL" />
          <Field label="TikTok" value={settings.tiktok} onChange={(event) => update({ tiktok: event.target.value })} placeholder="@loja ou URL" />
          <Field label="Facebook" value={settings.facebook} onChange={(event) => update({ facebook: event.target.value })} placeholder="página ou URL" />
          <Field label="E-mail" value={settings.email} onChange={(event) => update({ email: event.target.value })} />
          <Field label="Telefone" value={settings.phone} onChange={(event) => update({ phone: event.target.value })} />
        </div>
        <TextArea label="Endereço" value={settings.address} onChange={(event) => update({ address: event.target.value })} />
        <TextArea label="Horário de atendimento" value={settings.businessHours} onChange={(event) => update({ businessHours: event.target.value })} />
      </FormSection>
      <FormSection title="Sobre a loja">
        <Field label="Título" value={settings.aboutTitle} onChange={(event) => update({ aboutTitle: event.target.value })} />
        <TextArea label="Texto institucional" value={settings.aboutText} onChange={(event) => update({ aboutText: event.target.value })} />
        <TextArea label="História da marca" value={settings.history} onChange={(event) => update({ history: event.target.value })} />
        <TextArea label="Valores" value={settings.values} onChange={(event) => update({ values: event.target.value })} placeholder="Um valor por linha" />
        <SingleImageField label="Imagem institucional" image={images.about} onChange={(about) => setImages((current) => ({ ...current, about }))} />
      </FormSection>
      <Button type="submit" disabled={saving}>{saving ? 'Salvando' : 'Salvar configurações'}</Button>
    </form>
  )
}
