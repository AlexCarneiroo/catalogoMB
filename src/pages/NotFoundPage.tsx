import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Feedback'
import { Seo } from '@/components/ui/Seo'

export function NotFoundPage() {
  return (
    <Container className="py-24 text-center">
      <Seo title="Página não encontrada" path="/404" />
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">404</p>
      <h1 className="mt-3 font-serif text-5xl text-plum">Página não encontrada</h1>
      <div className="mt-8">
        <ButtonLink to="/">Voltar ao início</ButtonLink>
      </div>
    </Container>
  )
}
