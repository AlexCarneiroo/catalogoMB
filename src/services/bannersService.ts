import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { collections } from '@/firebase/collections'
import { getDb } from '@/firebase/client'
import { readPreview, shouldUsePreview, writePreview } from '@/services/previewStore'
import { mapBanner } from '@/services/mappers'
import { deleteImage } from '@/services/storageService'
import type { Banner } from '@/types/models'
import { invalidatePublicData, readCache, writeCache } from '@/utils/cache'

function banners() {
  return collection(getDb(), collections.banners)
}

function byOrder(items: Banner[]): Banner[] {
  return [...items].sort((a, b) => a.order - b.order)
}

export async function listActiveBanners(): Promise<Banner[]> {
  if (shouldUsePreview()) return readPreview().banners.filter((item) => item.active).sort((a, b) => a.order - b.order)
  const cached = readCache<Banner[]>('public:banners')
  if (cached) return cached
  const snapshot = await getDocs(query(banners(), where('active', '==', true)))
  const items = byOrder(snapshot.docs.map((item) => mapBanner(item.id, item.data())))
  writeCache('public:banners', items)
  return items
}

export async function listAllBanners(): Promise<Banner[]> {
  if (shouldUsePreview()) return [...readPreview().banners].sort((a, b) => a.order - b.order)
  const snapshot = await getDocs(query(banners(), orderBy('order', 'asc')))
  return snapshot.docs.map((item) => mapBanner(item.id, item.data()))
}

export async function saveBanner(id: string | null, input: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  if (!input.image) throw new Error('Envie a imagem do banner.')
  if (shouldUsePreview()) {
    const db = readPreview()
    const nextId = id ?? `banner-${Date.now()}`
    const previous = db.banners.find((item) => item.id === nextId)
    const saved: Banner = {
      ...input,
      id: nextId,
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      buttonText: input.buttonText.trim(),
      link: input.link.trim() || '/produtos',
      createdAt: previous?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    }
    writePreview({ ...db, banners: previous ? db.banners.map((item) => (item.id === nextId ? saved : item)) : [...db.banners, saved] })
    return
  }
  const reference = id ? doc(getDb(), collections.banners, id) : doc(banners())
  await setDoc(
    reference,
    {
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      buttonText: input.buttonText.trim(),
      link: input.link.trim() || '/produtos',
      image: input.image,
      imagePath: input.imagePath,
      order: input.order,
      active: input.active,
      updatedAt: serverTimestamp(),
      ...(id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  invalidatePublicData()
}

export async function updateBannerActive(id: string, active: boolean): Promise<void> {
  if (shouldUsePreview()) {
    const db = readPreview()
    writePreview({ ...db, banners: db.banners.map((item) => (item.id === id ? { ...item, active, updatedAt: Date.now() } : item)) })
    return
  }
  await updateDoc(doc(getDb(), collections.banners, id), { active, updatedAt: serverTimestamp() })
  invalidatePublicData()
}

export async function removeBanner(banner: Banner): Promise<void> {
  if (shouldUsePreview()) {
    const db = readPreview()
    writePreview({ ...db, banners: db.banners.filter((item) => item.id !== banner.id) })
    return
  }
  if (banner.imagePath) await deleteImage(banner.imagePath)
  await deleteDoc(doc(getDb(), collections.banners, banner.id))
  invalidatePublicData()
}
