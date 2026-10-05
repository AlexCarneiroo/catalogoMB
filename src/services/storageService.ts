import { deleteObject, getBlob, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getBucket } from '@/firebase/client'
import { shouldUsePreview } from '@/services/previewStore'
import type { LocalImage } from '@/types/models'
import { FirebaseError } from 'firebase/app'
import { prepareImage } from '@/utils/images'

function extensionFor(file: File): string {
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/gif') return 'gif'
  if (file.type === 'image/svg+xml') return 'svg'
  return 'jpg'
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

export async function uploadImage(file: File, folder: string): Promise<LocalImage> {
  const prepared = await prepareImage(file)
  if (shouldUsePreview()) return { url: await fileToDataUrl(prepared), path: '' }
  const path = `${folder}/${crypto.randomUUID()}.${extensionFor(prepared)}`
  const storageRef = ref(getBucket(), path)
  await uploadBytes(storageRef, prepared, { contentType: prepared.type || 'image/jpeg' })
  const url = await getDownloadURL(storageRef)
  return { url, path }
}

export async function deleteImage(path: string): Promise<void> {
  if (!path || shouldUsePreview()) return
  try {
    await deleteObject(ref(getBucket(), path))
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'storage/object-not-found') return
    throw error
  }
}

export async function copyImage(sourcePath: string, folder: string): Promise<LocalImage> {
  const blob = await getBlob(ref(getBucket(), sourcePath))
  const extension = sourcePath.split('.').pop() || 'webp'
  const path = `${folder}/${crypto.randomUUID()}.${extension}`
  const storageRef = ref(getBucket(), path)
  await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/webp' })
  const url = await getDownloadURL(storageRef)
  return { url, path }
}

export async function resolveLocalImage(image: LocalImage | null, folder: string, previousPath = ''): Promise<LocalImage> {
  if (!image || (!image.url && !image.file)) {
    if (previousPath) await deleteImage(previousPath)
    return { url: '', path: '' }
  }
  if (!image.file) return { url: image.url, path: image.path }
  const uploaded = await uploadImage(image.file, folder)
  if (previousPath && previousPath !== uploaded.path) await deleteImage(previousPath)
  return uploaded
}
