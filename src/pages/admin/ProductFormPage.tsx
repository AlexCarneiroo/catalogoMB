import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormSection, Field, SelectField, TextArea, Toggle } from '@/components/admin/FormControls'
import { ProductImagesField } from '@/components/admin/ProductImagesField'
import { Button } from '@/components/ui/Button'
import { Notice, Spinner } from '@/components/ui/Feedback'
import { listAllCategories } from '@/services/categoriesService'
import { draftFromProduct, emptyProductDraft, validateProductDraft } from '@/services/productDraft'
import { getProduct, saveProduct } from '@/services/productsService'
import type { Category, ProductDraft } from '@/types/models'
import { useAutosave } from '@/hooks/useAutosave'
import { discountPercent } from '@/utils/catalog'
import { getErrorMessage } from '@/utils/errors'
import { parsePrice, slugify } from '@/utils/format'
import type { Product } from '@/types/models'

export function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<ProductDraft>(emptyProductDraft())
  const [categories, setCategories] = useState<Category[]>([])
  const [previousPaths, setPreviousPaths] = useState<string[]>([])
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const pathsRef = useRef<string[]>([])
  const autosave = useAutosave(async (current: ProductDraft) => {
    if (!id) return current
    const validation = validateProductDraft(current)
    if (validation) throw new Error(validation)
    const savedProduct = await saveProduct(id, current, pathsRef.current)
    const next = draftFromProduct(savedProduct)
    pathsRef.current = savedProduct.images.map((image) => image.path).filter(Boolean)
    setPreviousPaths(pathsRef.current)
    return next
  })

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [nextCategories, product] = await Promise.all([listAllCategories(), id ? getProduct(id) : Promise.resolve(null)])
        if (cancelled) return
        setCategories(nextCategories)
        if (id && !product) setError('Produto não encontrado.')
        if (product) applyProduct(product)
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  function applyProduct(product: Product) {
    const next = draftFromProduct(product)
    const paths = product.images.map((image) => image.path).filter(Boolean)
    pathsRef.current = paths
    setDraft(next)
    setPreviousPaths(paths)
    setSlugTouched(true)
    autosave.sync(next, true)
  }

  function update(partial: Partial<ProductDraft>) {
    setDraft((current) => {
      const next = { ...current, ...partial }
      if (partial.name !== undefined && !slugTouched) next.slug = slugify(partial.name)
      autosave.sync(next)
      return next
    })
  }

  function commit(partial: Partial<ProductDraft>) {
    update(partial)
    if (!id) return
    queueMicrotask(() => void autosave.flush())
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const validation = validateProductDraft(draft)
    if (validation) {
      setError(validation)
      setSuccess(null)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const saved = await saveProduct(id ?? null, draft, previousPaths)
      applyProduct(saved)
      setSuccess('Alterações salvas.')
      if (!id) navigate(`/admin/produtos/${saved.id}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const price = parsePrice(draft.price)
  const promotional = parsePrice(draft.promotionalPrice)
  const preview = price !== null && promotional !== null ? discountPercent({ ...emptyPreview(price, promotional) }) : null
  const categoryOptions = categories.filter((category) => category.active || category.id === draft.categoryId)

  if (loading) return <Spinner label="Carregando produto" />

  return (
    <form className="mx-auto max-w-4xl space-y-6" onSubmit={(event) => void onSubmit(event)} onBlur={() => { if (id) void autosave.flush() }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">{id ? 'Editar' : 'Novo'}</p>
          <h1 className="mt-2 font-serif text-5xl text-plum">{id ? 'Editar produto' : 'Adicionar produto'}</h1>
          {id ? <p className="mt-2 text-xs text-gold-deep">{autosave.saving ? 'Salvando…' : autosave.saved ? 'Salvo' : 'Salva ao sair do campo.'}</p> : null}
        </div>
        <Link to="/admin/produtos" className="text-[11px] uppercase tracking-[0.16em] text-plum">
          Voltar
        </Link>
      </div>
      {categoryOptions.length === 0 ? <Notice>Crie uma categoria antes de publicar um produto.</Notice> : null}
      {error || autosave.error ? <Notice>{error || autosave.error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}

      <FormSection title="Informações principais">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" value={draft.name} onChange={(event) => update({ name: event.target.value })} required />
          <Field label="Slug" value={draft.slug} onChange={(event) => { setSlugTouched(true); update({ slug: event.target.value }) }} />
        </div>
        <TextArea label="Descrição curta" value={draft.shortDescription} onChange={(event) => update({ shortDescription: event.target.value })} />
        <TextArea label="Descrição" value={draft.description} onChange={(event) => update({ description: event.target.value })} />
        <SelectField label="Categoria" value={draft.categoryId} onChange={(event) => commit({ categoryId: event.target.value })}>
          <option value="">Selecione</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.active ? '' : ' (inativa)'}
            </option>
          ))}
        </SelectField>
      </FormSection>

      <FormSection title="Preço">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Preço" inputMode="decimal" value={draft.price} onChange={(event) => update({ price: event.target.value })} placeholder="0,00" />
          <Field label="Preço promocional" inputMode="decimal" value={draft.promotionalPrice} onChange={(event) => update({ promotionalPrice: event.target.value })} placeholder="Opcional" />
          <Field label="Estoque" inputMode="numeric" value={draft.stock} onChange={(event) => update({ stock: event.target.value })} placeholder="Vazio = sem controle" />
        </div>
        {preview ? <p className="text-sm text-gold-deep">Desconto de {preview}% — o selo Oferta aparece no catálogo.</p> : null}
      </FormSection>

      <FormSection title="Fotos">
        <ProductImagesField images={draft.images} onChange={(images) => commit({ images })} />
      </FormSection>

      <FormSection title="Informações adicionais">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Marca" value={draft.brand} onChange={(event) => update({ brand: event.target.value })} />
          <Field label="SKU" value={draft.sku} onChange={(event) => update({ sku: event.target.value })} />
          <Field label="Código" value={draft.code} onChange={(event) => update({ code: event.target.value })} />
          <Field label="Peso" value={draft.weight} onChange={(event) => update({ weight: event.target.value })} />
          <Field label="Dimensões" value={draft.dimensions} onChange={(event) => update({ dimensions: event.target.value })} />
          <Field label="Tags" value={draft.tags} onChange={(event) => update({ tags: event.target.value })} placeholder="matte, pele, dia" />
        </div>
        <TextArea label="Ingredientes" value={draft.ingredients} onChange={(event) => update({ ingredients: event.target.value })} />
        <TextArea label="Modo de uso" value={draft.howToUse} onChange={(event) => update({ howToUse: event.target.value })} />
        <TextArea label="Benefícios" value={draft.benefits} onChange={(event) => update({ benefits: event.target.value })} />
      </FormSection>

      <FormSection title="Publicação">
        <div className="grid gap-3">
          <Toggle label="Ativo no catálogo" checked={draft.active} onChange={(active) => commit({ active })} />
          <Toggle label="Produto em destaque" checked={draft.featured} onChange={(featured) => commit({ featured })} />
          <Toggle label="Selo de novidade" checked={draft.isNew} onChange={(isNew) => commit({ isNew })} />
        </div>
      </FormSection>

      <FormSection title="SEO">
        <Field label="Título" value={draft.seoTitle} onChange={(event) => update({ seoTitle: event.target.value })} placeholder={draft.name} />
        <TextArea label="Descrição" value={draft.seoDescription} onChange={(event) => update({ seoDescription: event.target.value })} />
      </FormSection>

      {id ? null : (
        <div className="sticky bottom-0 flex justify-end border-t border-plum/10 bg-ivory/95 py-4">
          <Button type="submit" disabled={saving || categoryOptions.length === 0}>
            {saving ? 'Salvando' : 'Publicar produto'}
          </Button>
        </div>
      )}
    </form>
  )
}

function emptyPreview(price: number, promotionalPrice: number) {
  return {
    id: '',
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    price,
    promotionalPrice,
    images: [],
    mainImage: '',
    brand: '',
    sku: '',
    code: '',
    tags: [],
    ingredients: '',
    howToUse: '',
    benefits: '',
    weight: '',
    dimensions: '',
    stock: null,
    active: true,
    featured: false,
    isNew: false,
    seoTitle: '',
    seoDescription: '',
    createdAt: null,
    updatedAt: null,
  }
}
