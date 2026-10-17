import { deleteObject, getBlob, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { FirebaseError } from 'firebase/app'
import { getBucket } from '@/firebase/client'
import { shouldUsePreview } from '@/services/previewStore'
import type { LocalImage } from '@/types/models'
import { prepareImage } from '@/utils/images'

const cloudinaryMark = 'cloudinary:'

function readEnv(key: 'VITE_CLOUDINARY_CLOUD_NAME' | 'VITE_CLOUDINARY_UPLOAD_PRESET'): string {
  const value = import.meta.env[key]
  return typeof value === 'string' ? value.trim() : ''
}

function cloudinaryCloud(): string {
  return readEnv('VITE_CLOUDINARY_CLOUD_NAME')
}

function cloudinaryPreset(): string {
  return readEnv('VITE_CLOUDINARY_UPLOAD_PRESET')
}

function usesCloudinary(): boolean {
  return cloudinaryCloud().length > 0 && cloudinaryPreset().length > 0
}

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

function isCloudinaryPath(path: string): boolean {
  return path.startsWith(cloudinaryMark)
}

async function sendToCloudinary(file: Blob | string, folder: string): Promise<LocalImage> {
  const cloud = cloudinaryCloud()
  const preset = cloudinaryPreset()
  if (!cloud || !preset) throw new Error('Cloudinary não configurado.')
  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', preset)
  body.append('folder', folder)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body })
  const data: unknown = await response.json()
  const record = data && typeof data === 'object' ? (data as { secure_url?: unknown; public_id?: unknown; error?: { message?: unknown } }) : {}
  if (!response.ok || typeof record.secure_url !== 'string' || typeof record.public_id !== 'string') {
    const message = typeof record.error?.message === 'string' ? record.error.message : 'Não foi possível enviar a imagem.'
    throw new Error(message)
  }
  return { url: record.secure_url, path: `${cloudinaryMark}${record.public_id}` }
}

export async function uploadImage(file: File, folder: string): Promise<LocalImage> {
  const prepared = await prepareImage(file)
  if (shouldUsePreview()) return { url: await fileToDataUrl(prepared), path: '' }
  if (usesCloudinary()) return sendToCloudinary(prepared, folder)
  const path = `${folder}/${crypto.randomUUID()}.${extensionFor(prepared)}`
  const storageRef = ref(getBucket(), path)
  await uploadBytes(storageRef, prepared, { contentType: prepared.type || 'image/jpeg' })
  const url = await getDownloadURL(storageRef)
  return { url, path }
}

export async function deleteImage(path: string): Promise<void> {
  if (!path || shouldUsePreview() || isCloudinaryPath(path)) return
  try {
    await deleteObject(ref(getBucket(), path))
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'storage/object-not-found') return
    throw error
  }
}

export async function copyImage(sourcePath: string, folder: string): Promise<LocalImage> {
  if (isCloudinaryPath(sourcePath)) {
    const publicId = sourcePath.slice(cloudinaryMark.length)
    const remote = `https://res.cloudinary.com/${cloudinaryCloud()}/image/upload/${publicId}`
    return sendToCloudinary(remote, folder)
  }
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
