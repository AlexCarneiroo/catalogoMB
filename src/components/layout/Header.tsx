import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Wordmark } from '@/components/brand/BrandMark'
import { useCart } from '@/contexts/CartContext'
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
  const { count, setOpen: setCartOpen } = useCart()
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
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-5">
      <div className={cn('mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 rounded-full px-3 transition duration-500 sm:h-[4.25rem] sm:px-4 md:px-6', solid ? 'bg-ivory/80 shadow-soft backdrop-blur-md' : '')}>
        <Link to="/" className="flex min-w-0 shrink items-center" aria-label="Página inicial">
          {settings.logo ? (
            <img src={settings.logo} alt={settings.storeName} className="h-9 w-auto max-w-[7.25rem] object-contain object-left sm:h-12 sm:max-w-[10.5rem] md:h-14 md:max-w-[12.5rem]" />
          ) : (
            <Wordmark alt={settings.storeName} className="h-9 max-w-[7.25rem] sm:h-12 sm:max-w-[10.5rem] md:h-14 md:max-w-[12.5rem]" />
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

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className={cn('relative grid h-11 w-11 place-items-center', mark)}
            aria-label={count > 0 ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho'}
            onClick={() => {
              setMenuOpen(false)
              setSearchOpen(false)
              setCartOpen(true)
            }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8V7a3 3 0 0 1 6 0v1" />
            </svg>
            {count > 0 ? (
              <span className="absolute top-1 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-plum px-1 text-[10px] leading-none text-ivory">{count}</span>
            ) : null}
          </button>
          <button type="button" className={cn(linkClass, tone, 'grid h-11 min-w-11 place-items-center px-3')} onClick={() => setSearchOpen(true)} aria-label="Buscar">
            Busca
          </button>
          <button type="button" className={cn('grid h-11 w-11 place-items-center lg:hidden', mark)} aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
            <span className="block h-px w-6 bg-current" />
            <span className="mt-1.5 block h-px w-6 bg-current" />
            <span className="mt-1.5 block h-px w-4 bg-current" />
          </button>
        </div>
      </div>
    </header>

    <div
      inert={menuOpen ? undefined : true}
      data-scroll-lock={menuOpen ? '' : undefined}
      className={cn('fixed inset-0 z-50 flex h-[100dvh] flex-col bg-ivory pt-[env(safe-area-inset-top)] transition duration-300 lg:hidden', menuOpen ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0')}
    >
      <div className="flex h-20 shrink-0 items-center justify-between px-5">
        {settings.logo ? (
          <img src={settings.logo} alt={settings.storeName} className="h-10 w-auto max-w-[9rem] object-contain object-left" />
        ) : (
          <Wordmark alt={settings.storeName} className="h-10 max-w-[9rem]" />
        )}
        <button type="button" className="grid h-11 place-items-center px-3 text-[11px] uppercase tracking-[0.18em] text-plum" onClick={() => setMenuOpen(false)}>
          Fechar
        </button>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-6 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]" aria-label="Mobile" onClick={() => setMenuOpen(false)}>
        <button type="button" className="w-fit text-left font-serif text-4xl break-words text-plum sm:text-5xl" onClick={() => setCartOpen(true)}>
          Carrinho{count > 0 ? ` · ${count}` : ''}
        </button>
        <Link to="/produtos" className="font-serif text-4xl break-words text-plum sm:text-5xl">Produtos</Link>
        <p className="pt-4 text-[11px] uppercase tracking-[0.22em] text-gold-deep">Categorias</p>
        {categories.map((category) => (
          <Link key={category.id} to={`/categoria/${category.slug}`} className="font-serif text-3xl break-words text-plum sm:text-4xl">
            {category.name}
          </Link>
        ))}
        <Link to="/sobre" className="font-serif text-4xl break-words text-plum sm:text-5xl">Sobre</Link>
        <Link to="/contato" className="font-serif text-4xl break-words text-plum sm:text-5xl">Contato</Link>
      </nav>
    </div>

    {searchOpen ? (
      <div data-scroll-lock="" className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ivory/96 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 pt-8 pb-16">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Buscar</p>
            <button type="button" className="grid h-11 place-items-center px-3 text-[11px] uppercase tracking-[0.18em] text-plum" onClick={() => setSearchOpen(false)}>
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
              placeholder="Nome, código ou tag"
              className="w-full border-b border-plum/20 bg-transparent py-4 font-serif text-3xl text-plum outline-none placeholder:text-plum/30 sm:text-4xl"
              aria-label="Buscar produtos"
            />
          </form>
          <ul className="mt-8 divide-y divide-plum/10">
            {results.map((product) => (
              <li key={product.id}>
                <Link to={`/produto/${product.slug}`} state={productLinkState(location)} className="flex items-center gap-4 py-4" onClick={() => setSearchOpen(false)}>
                  {product.mainImage ? <img src={product.mainImage} alt="" className="h-16 w-12 object-cover" /> : <span className="h-16 w-12 bg-ivory-deep" />}
                  <span>
                    <span className="block font-serif text-2xl text-plum">{product.name}</span>
                    <span className="text-xs uppercase tracking-[0.16em] text-muted">{[categoryName(categories, product.categoryId), product.code].filter(Boolean).join(' · ')}</span>
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
