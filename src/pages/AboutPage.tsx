import { Container, EmptyState } from '@/components/ui/Feedback'
import { Seo } from '@/components/ui/Seo'
import { useStore } from '@/contexts/StoreContext'
import { paragraphs } from '@/utils/format'

export function AboutPage() {
  const { settings } = useStore()
  const values = settings.values
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
  const hasContent = Boolean(settings.aboutText || settings.history || values.length || settings.aboutImage)

  return (
    <Container className="rise py-14 md:py-20">
      <Seo title={settings.aboutTitle || 'Sobre'} description={settings.aboutText || settings.seoDescription} image={settings.aboutImage} path="/sobre" />
      <p className="text-xs font-medium tracking-[0.28em] text-gold-deep uppercase">A marca</p>
      <h1 className="display mt-3 max-w-3xl text-5xl text-plum md:text-8xl">{settings.aboutTitle || 'Sobre a loja'}</h1>
      {!hasContent ? (
        <div className="mt-10">
          <EmptyState title="Conteúdo em preparação" text="O texto institucional pode ser editado nas configurações do painel." />
        </div>
      ) : (
        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-10">
            {settings.aboutText ? (
              <div className="space-y-4 text-base leading-relaxed text-muted">
                {paragraphs(settings.aboutText).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {settings.history ? (
              <section>
                <h2 className="font-serif text-4xl text-plum">História</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
                  {paragraphs(settings.history).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ) : null}
            {values.length > 0 ? (
              <section>
                <h2 className="font-serif text-4xl text-plum">Valores</h2>
                <ul className="mt-4 space-y-3">
                  {values.map((value) => (
                    <li key={value} className="border-l border-gold pl-4 text-sm text-plum">
                      {value}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
          {settings.aboutImage ? <img src={settings.aboutImage} alt="" className="aspect-[4/5] w-full object-cover" /> : null}
        </div>
      )}
    </Container>
  )
}
