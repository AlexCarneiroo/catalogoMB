import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { collections } from '@/firebase/collections'
import { getDb } from '@/firebase/client'
import { readPreview, shouldUsePreview, writePreview } from '@/services/previewStore'
import { mapCategory } from '@/services/mappers'
import { deleteImage } from '@/services/storageService'
import { countProductsInCategory } from '@/services/productsService'
import type { Category } from '@/types/models'
import { invalidatePublicData, readCache, writeCache } from '@/utils/cache'
import { slugify } from '@/utils/format'

function categories() {
  return collection(getDb(), collections.categories)
}

function byOrder(items: Category[]): Category[] {
  return [...items].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'pt-BR'))
}

export async function listActiveCategories(): Promise<Category[]> {
  if (shouldUsePreview()) return readPreview().categories.filter((item) => item.active).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'pt-BR'))
  const cached = readCache<Category[]>('public:categories')
  if (cached) return cached
  const snapshot = await getDocs(query(categories(), where('active', '==', true)))
  const items = byOrder(snapshot.docs.map((item) => mapCategory(item.id, item.data())))
  writeCache('public:categories', items)
  return items
}

export async function listAllCategories(): Promise<Category[]> {
  if (shouldUsePreview()) return [...readPreview().categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'pt-BR'))
  const snapshot = await getDocs(query(categories(), orderBy('order', 'asc')))
  return snapshot.docs.map((item) => mapCategory(item.id, item.data()))
}

export async function saveCategory(id: string | null, input: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const slug = slugify(input.slug || input.name)
  if (!input.name.trim() || !slug) throw new Error('Informe o nome da categoria.')
  if (shouldUsePreview()) {
    const db = readPreview()
    if (db.categories.some((item) => item.slug === slug && item.id !== id)) throw new Error('Já existe uma categoria com este slug.')
    const nextId = id ?? `cat-${Date.now()}`
    const previous = db.categories.find((item) => item.id === nextId)
    const saved: Category = { ...input, id: nextId, name: input.name.trim(), slug, description: input.description.trim(), createdAt: previous?.createdAt ?? Date.now(), updatedAt: Date.now() }
    writePreview({
      ...db,
      categories: previous ? db.categories.map((item) => (item.id === nextId ? saved : item)) : [...db.categories, saved],
    })
    return
  }
  const snapshot = await getDocs(query(categories(), where('slug', '==', slug), limit(5)))
  if (snapshot.docs.some((item) => item.id !== id)) throw new Error('Já existe uma categoria com este slug.')
  const reference = id ? doc(getDb(), collections.categories, id) : doc(categories())
  await setDoc(
    reference,
    {
      name: input.name.trim(),
      slug,
      description: input.description.trim(),
      image: input.image,
      imagePath: input.imagePath,
      active: input.active,
      order: input.order,
      updatedAt: serverTimestamp(),
      ...(id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  invalidatePublicData()
}

export async function updateCategoryActive(id: string, active: boolean): Promise<void> {
  if (shouldUsePreview()) {
    const db = readPreview()
    writePreview({ ...db, categories: db.categories.map((item) => (item.id === id ? { ...item, active, updatedAt: Date.now() } : item)) })
    return
  }
  await updateDoc(doc(getDb(), collections.categories, id), { active, updatedAt: serverTimestamp() })
  invalidatePublicData()
}

export async function removeCategory(category: Category): Promise<void> {
  if ((await countProductsInCategory(category.id)) > 0) {
    throw new Error('Esta categoria ainda tem produtos. Mova os produtos antes de excluir.')
  }
  if (shouldUsePreview()) {
    const db = readPreview()
    writePreview({ ...db, categories: db.categories.filter((item) => item.id !== category.id) })
    return
  }
  if (category.imagePath) await deleteImage(category.imagePath)
  await deleteDoc(doc(getDb(), collections.categories, category.id))
  invalidatePublicData()
}
