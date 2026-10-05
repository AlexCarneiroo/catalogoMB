import { Link } from 'react-router-dom'
import { brandAssets, Wordmark } from '@/components/brand/BrandMark'
import { useStore } from '@/contexts/StoreContext'
import { instagramHref, socialHref, tiktokHref, whatsappHref } from '@/utils/format'

export function Footer() {
  const { settings, categories } = useStore()
  const whatsapp = whatsappHref(settings.whatsapp)
  const instagram = instagramHref(settings.instagram)
  const tiktok = tiktokHref(settings.tiktok)
  const facebook = socialHref(settings.facebook, 'facebook.com')

  return (
    <footer className="relative mt-10 overflow-hidden bg-plum text-ivory">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{ backgroundImage: `url(${brandAssets.pattern})`, backgroundSize: '280px' }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_0.8fr_0.8fr] md:px-8">
        <div>
          <Wordmark variant="ivory" alt={settings.storeName} className="h-16 sm:h-20" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/75">{settings.seoDescription}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-gold uppercase">Explorar</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link to="/produtos" className="w-fit transition hover:text-gold">Produtos</Link>
            {categories.slice(0, 5).map((category) => (
              <Link key={category.id} to={`/categoria/${category.slug}`} className="w-fit transition hover:text-gold">
                {category.name}
              </Link>
            ))}
            <Link to="/sobre" className="w-fit transition hover:text-gold">Sobre</Link>
            <Link to="/contato" className="w-fit transition hover:text-gold">Contato</Link>
            <Link to="/admin/login" className="w-fit transition hover:text-gold">Painel</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-gold uppercase">Contato</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-ivory/85">
            {settings.phone ? <a href={`tel:${settings.phone}`} className="w-fit hover:text-gold">{settings.phone}</a> : null}
            {settings.email ? <a href={`mailto:${settings.email}`} className="w-fit hover:text-gold">{settings.email}</a> : null}
            {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer" className="w-fit hover:text-gold">WhatsApp</a> : null}
            {instagram ? <a href={instagram} target="_blank" rel="noreferrer" className="w-fit hover:text-gold">Instagram</a> : null}
            {tiktok ? <a href={tiktok} target="_blank" rel="noreferrer" className="w-fit hover:text-gold">TikTok</a> : null}
            {facebook ? <a href={facebook} target="_blank" rel="noreferrer" className="w-fit hover:text-gold">Facebook</a> : null}
            {settings.address ? <p>{settings.address}</p> : null}
          </div>
        </div>
      </div>
      <div className="border-t border-ivory/10 px-5 py-5 text-center text-xs tracking-[0.16em] text-ivory/60 uppercase">
        {settings.storeName} · {new Date().getFullYear()}
      </div>
    </footer>
  )
}
