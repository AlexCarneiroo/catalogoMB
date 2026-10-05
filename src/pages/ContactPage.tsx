import { Container } from '@/components/ui/Feedback'
import { buttonClass } from '@/components/ui/Button'
import { Seo } from '@/components/ui/Seo'
import { useStore } from '@/contexts/StoreContext'
import { instagramHref, socialHref, tiktokHref, whatsappHref } from '@/utils/format'

export function ContactPage() {
  const { settings } = useStore()
  const whatsapp = whatsappHref(settings.whatsapp, `Olá, vim pelo catálogo ${settings.storeName}.`)
  const instagram = instagramHref(settings.instagram)
  const tiktok = tiktokHref(settings.tiktok)
  const facebook = socialHref(settings.facebook, 'facebook.com')
  const cards = [
    settings.phone ? { label: 'Telefone', value: settings.phone, href: `tel:${settings.phone}` } : null,
    settings.email ? { label: 'E-mail', value: settings.email, href: `mailto:${settings.email}` } : null,
    whatsapp ? { label: 'WhatsApp', value: settings.whatsapp, href: whatsapp } : null,
    instagram ? { label: 'Instagram', value: settings.instagram, href: instagram } : null,
    tiktok ? { label: 'TikTok', value: settings.tiktok, href: tiktok } : null,
    facebook ? { label: 'Facebook', value: settings.facebook, href: facebook } : null,
    settings.address ? { label: 'Endereço', value: settings.address, href: '' } : null,
    settings.businessHours ? { label: 'Horário', value: settings.businessHours, href: '' } : null,
  ].filter((item): item is { label: string; value: string; href: string } => item !== null)

  return (
    <Container className="rise py-14 md:py-20">
      <Seo title="Contato" description={`Fale com ${settings.storeName}.`} path="/contato" />
      <p className="text-xs font-medium tracking-[0.28em] text-gold-deep uppercase">Fale conosco</p>
      <h1 className="display mt-3 text-5xl text-plum md:text-8xl">Contato</h1>
      <p className="mt-5 max-w-xl text-muted">Estamos por aqui para ajudar você a escolher o produto certo.</p>
      {cards.length === 0 ? <p className="mt-10 text-sm text-muted">Os canais de contato ainda serão publicados nas configurações da loja.</p> : null}
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.label} className="rounded-[1.6rem] bg-white/80 p-6 shadow-soft transition duration-300 hover:-translate-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-deep">{card.label}</p>
            {card.href ? (
              <a href={card.href} className="mt-3 block font-serif text-3xl text-plum" target={card.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                {card.value}
              </a>
            ) : (
              <p className="mt-3 font-serif text-3xl text-plum">{card.value}</p>
            )}
          </article>
        ))}
      </div>
      {whatsapp ? (
        <a href={whatsapp} target="_blank" rel="noreferrer" className={buttonClass('primary', 'mt-10')}>
          Chamar no WhatsApp
        </a>
      ) : null}
    </Container>
  )
}
