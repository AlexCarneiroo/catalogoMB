import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Wordmark } from '@/components/brand/BrandMark'
import { useStore } from '@/contexts/StoreContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { listActiveProducts } from '@/services/productsService'
import type { Product } from '@/types/models'
import { categoryName, filterProducts } from '@/utils/catalog'
import { cn } from '@/utils/format'
import { productLinkState } from '@/utils/productLink'

const linkClass = 'text-sm font-medium tracking-wide transition'

export function Header() {
  const { settings, categories } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const home = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const debounced = useDebouncedValue(query, 350)
  const solid = scrolled || menuOpen || searchOpen || !home
  const tone = 'text-plum/75 hover:text-plum'
  const mark = 'text-plum'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
    setCategoriesOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen, searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    let cancelled = false
    void listActiveProducts()
      .then((products) => {
        if (cancelled) return
        const filtered = debounced.trim()
          ? filterProducts(products, categories, {
              query: debounced,
              categoryId: '',
              sort: 'recent',
              featuredOnly: false,
              promoOnly: false,
            })
          : products.slice(0, 6)
        setResults(filtered.slice(0, 6))
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
    return () => {
      cancelled = true
    }
  }, [searchOpen, debounced, categories])

  function submitSearch() {
    const term = query.trim()
    navigate(term ? `/produtos?q=${encodeURIComponent(term)}` : '/produtos')
    setSearchOpen(false)
  }

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-5">
      <div className={cn('mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between rounded-full px-4 transition duration-500 md:px-6', solid ? 'bg-ivory/80 shadow-soft backdrop-blur-md' : '')}>
        <Link to="/" className="flex shrink-0 items-center" aria-label="Página inicial">
          {settings.logo ? (
            <img src={settings.logo} alt={settings.storeName} className="h-12 w-auto max-w-[10.5rem] object-contain object-left sm:h-14 sm:max-w-[12.5rem]" />
          ) : (
            <Wordmark alt={settings.storeName} className="h-12 max-w-[10.5rem] sm:h-14 sm:max-w-[12.5rem]" />
          )}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
          <NavLink to="/produtos" className={cn(linkClass, tone)}>
            Produtos
          </NavLink>
          <div className="relative" onMouseEnter={() => setCategoriesOpen(true)} onMouseLeave={() => setCategoriesOpen(false)}>
            <button type="button" className={cn(linkClass, tone)} aria-expanded={categoriesOpen} onClick={() => setCategoriesOpen((open) => !open)}>
              Categorias
            </button>
            {categoriesOpen && categories.length > 0 ? (
              <div className="absolute top-full left-1/2 w-56 -translate-x-1/2 bg-ivory p-4 shadow-soft">
                {categories.map((category) => (
                  <Link key={category.id} to={`/categoria/${category.slug}`} className="block py-2 text-sm text-plum hover:text-gold-deep">
                    {category.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <NavLink to="/sobre" className={cn(linkClass, tone)}>
            Sobre
          </NavLink>
          <NavLink to="/contato" className={cn(linkClass, tone)}>
            Contato
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" className={cn(linkClass, tone, 'px-3 py-2')} onClick={() => setSearchOpen(true)} aria-label="Buscar">
            Busca
          </button>
          <button type="button" className={cn('px-3 py-2 lg:hidden', mark)} aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
            <span className="block h-px w-6 bg-current" />
            <span className="mt-1.5 block h-px w-6 bg-current" />
            <span className="mt-1.5 block h-px w-4 bg-current" />
          </button>
        </div>
      </div>
    </header>

    <div
      inert={menuOpen ? undefined : true}
      className={cn('fixed inset-0 z-50 bg-ivory transition duration-300 lg:hidden', menuOpen ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0')}
    >
      <div className="flex h-20 items-center justify-between px-5">
        {settings.logo ? (
          <img src={settings.logo} alt={settings.storeName} className="h-10 w-auto max-w-[9rem] object-contain object-left" />
        ) : (
          <Wordmark alt={settings.storeName} className="h-10 max-w-[9rem]" />
        )}
        <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-plum" onClick={() => setMenuOpen(false)}>
          Fechar
        </button>
      </div>
      <nav className="flex flex-col gap-5 overflow-y-auto px-6 pt-8" aria-label="Mobile">
        <Link to="/produtos" className="font-serif text-5xl text-plum">Produtos</Link>
        <p className="pt-4 text-[11px] uppercase tracking-[0.22em] text-gold-deep">Categorias</p>
        {categories.map((category) => (
          <Link key={category.id} to={`/categoria/${category.slug}`} className="font-serif text-4xl text-plum">
            {category.name}
          </Link>
        ))}
        <Link to="/sobre" className="font-serif text-5xl text-plum">Sobre</Link>
        <Link to="/contato" className="font-serif text-5xl text-plum">Contato</Link>
      </nav>
    </div>

    {searchOpen ? (
      <div className="fixed inset-0 z-50 bg-ivory/96 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 pt-8">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Buscar</p>
            <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-plum" onClick={() => setSearchOpen(false)}>
              Fechar
            </button>
          </div>
          <form
            className="mt-8"
            onSubmit={(event) => {
              event.preventDefault()
              submitSearch()
            }}
          >
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, categoria ou tag"
              className="w-full border-b border-plum/20 bg-transparent py-4 font-serif text-4xl text-plum outline-none placeholder:text-plum/30"
              aria-label="Buscar produtos"
            />
          </form>
          <ul className="mt-8 divide-y divide-plum/10">
            {results.map((product) => (
              <li key={product.id}>
                <Link to={`/produto/${product.slug}`} state={productLinkState(location)} className="flex items-center gap-4 py-4">
                  {product.mainImage ? <img src={product.mainImage} alt="" className="h-16 w-12 object-cover" /> : <span className="h-16 w-12 bg-ivory-deep" />}
                  <span>
                    <span className="block font-serif text-2xl text-plum">{product.name}</span>
                    <span className="text-xs uppercase tracking-[0.16em] text-muted">{categoryName(categories, product.categoryId)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {debounced.trim() && results.length === 0 ? <p className="mt-8 text-sm text-muted">Nenhum produto encontrado.</p> : null}
        </div>
      </div>
    ) : null}
    </>
  )
}
