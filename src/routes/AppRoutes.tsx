import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation, type Location } from 'react-router-dom'
import { Spinner } from '@/components/ui/Feedback'
import { AdminLayout } from '@/layouts/AdminLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

const HomePage = lazy(() => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })))
const ProductsPage = lazy(() => import('@/pages/ProductsPage').then((module) => ({ default: module.ProductsPage })))
const ProductPage = lazy(() => import('@/pages/ProductPage').then((module) => ({ default: module.ProductPage })))
const CategoryPage = lazy(() => import('@/pages/CategoryPage').then((module) => ({ default: module.CategoryPage })))
const AboutPage = lazy(() => import('@/pages/AboutPage').then((module) => ({ default: module.AboutPage })))
const ContactPage = lazy(() => import('@/pages/ContactPage').then((module) => ({ default: module.ContactPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const LoginPage = lazy(() => import('@/pages/admin/LoginPage').then((module) => ({ default: module.LoginPage })))
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ProductsAdminPage = lazy(() => import('@/pages/admin/ProductsAdminPage').then((module) => ({ default: module.ProductsAdminPage })))
const ProductFormPage = lazy(() => import('@/pages/admin/ProductFormPage').then((module) => ({ default: module.ProductFormPage })))
const CategoriesAdminPage = lazy(() => import('@/pages/admin/CategoriesAdminPage').then((module) => ({ default: module.CategoriesAdminPage })))
const BannersAdminPage = lazy(() => import('@/pages/admin/BannersAdminPage').then((module) => ({ default: module.BannersAdminPage })))
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const FeaturedAdminPage = lazy(() => import('@/pages/admin/FeaturedAdminPage').then((module) => ({ default: module.FeaturedAdminPage })))
const StockAdminPage = lazy(() => import('@/pages/admin/StockAdminPage').then((module) => ({ default: module.StockAdminPage })))
const AnnouncementAdminPage = lazy(() => import('@/pages/admin/AnnouncementAdminPage').then((module) => ({ default: module.AnnouncementAdminPage })))
const FeedbackAdminPage = lazy(() => import('@/pages/admin/FeedbackAdminPage').then((module) => ({ default: module.FeedbackAdminPage })))

export function AppRoutes() {
  const location = useLocation()
  const background = (location.state as { backgroundLocation?: Location } | null)?.backgroundLocation

  return (
    <Suspense fallback={<Spinner />}>
      <Routes location={background ?? location}>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="produto/:slug" element={<ProductPage />} />
          <Route path="categoria/:slug" element={<CategoryPage />} />
          <Route path="sobre" element={<AboutPage />} />
          <Route path="contato" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="admin/login" element={<LoginPage />} />
        <Route path="admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="produtos" element={<ProductsAdminPage />} />
            <Route path="produtos/novo" element={<ProductFormPage />} />
            <Route path="produtos/:id" element={<ProductFormPage />} />
            <Route path="destaques" element={<FeaturedAdminPage />} />
            <Route path="estoque" element={<StockAdminPage />} />
            <Route path="anuncio" element={<AnnouncementAdminPage />} />
            <Route path="feedbacks" element={<FeedbackAdminPage />} />
            <Route path="categorias" element={<CategoriesAdminPage />} />
            <Route path="banners" element={<BannersAdminPage />} />
            <Route path="configuracoes" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
      {background ? (
        <Routes>
          <Route path="/produto/:slug" element={<ProductPage />} />
        </Routes>
      ) : null}
    </Suspense>
  )
}
