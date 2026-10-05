import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { collections } from '@/firebase/collections'
import { getDb } from '@/firebase/client'
import { readPreview, shouldUsePreview, writePreview } from '@/services/previewStore'
import type { Testimonial } from '@/types/models'
import { invalidatePublicData } from '@/utils/cache'

function mapTestimonial(id: string, raw: Record<string, unknown>): Testimonial {
  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : '',
    text: typeof raw.text === 'string' ? raw.text : '',
    detail: typeof raw.detail === 'string' ? raw.detail : '',
    active: raw.active === true,
    order: typeof raw.order === 'number' ? raw.order : 0,
    createdAt: null,
  }
}

function byOrder(items: Testimonial[]): Testimonial[] {
  return [...items].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'pt-BR'))
}

export async function listActiveTestimonials(): Promise<Testimonial[]> {
  if (shouldUsePreview()) return byOrder(readPreview().testimonials.filter((item) => item.active))
  const snapshot = await getDocs(query(collection(getDb(), collections.testimonials), where('active', '==', true)))
  return byOrder(snapshot.docs.map((item) => mapTestimonial(item.id, item.data())))
}

export async function listAllTestimonials(): Promise<Testimonial[]> {
  if (shouldUsePreview()) return byOrder(readPreview().testimonials)
  const snapshot = await getDocs(query(collection(getDb(), collections.testimonials), orderBy('order', 'asc')))
  return snapshot.docs.map((item) => mapTestimonial(item.id, item.data()))
}

export async function saveTestimonial(id: string | null, input: Omit<Testimonial, 'id' | 'createdAt'>): Promise<void> {
  if (!input.name.trim() || !input.text.trim()) throw new Error('Informe o nome e o texto do feedback.')
  if (shouldUsePreview()) {
    const db = readPreview()
    const nextId = id ?? `t-${Date.now()}`
    const previous = db.testimonials.find((item) => item.id === nextId)
    const saved: Testimonial = { ...input, id: nextId, name: input.name.trim(), text: input.text.trim(), detail: input.detail.trim(), createdAt: previous?.createdAt ?? Date.now() }
    writePreview({
      ...db,
      testimonials: previous ? db.testimonials.map((item) => (item.id === nextId ? saved : item)) : [...db.testimonials, saved],
    })
    return
  }
  const reference = id ? doc(getDb(), collections.testimonials, id) : doc(collection(getDb(), collections.testimonials))
  await setDoc(reference, { ...input, name: input.name.trim(), text: input.text.trim(), detail: input.detail.trim(), updatedAt: serverTimestamp(), ...(id ? {} : { createdAt: serverTimestamp() }) }, { merge: true })
  invalidatePublicData()
}

export async function updateTestimonialActive(id: string, active: boolean): Promise<void> {
  if (shouldUsePreview()) {
    const db = readPreview()
    writePreview({ ...db, testimonials: db.testimonials.map((item) => (item.id === id ? { ...item, active } : item)) })
    return
  }
  await updateDoc(doc(getDb(), collections.testimonials, id), { active, updatedAt: serverTimestamp() })
  invalidatePublicData()
}

export async function removeTestimonial(id: string): Promise<void> {
  if (shouldUsePreview()) {
    const db = readPreview()
    writePreview({ ...db, testimonials: db.testimonials.filter((item) => item.id !== id) })
    return
  }
  await deleteDoc(doc(getDb(), collections.testimonials, id))
  invalidatePublicData()
}
