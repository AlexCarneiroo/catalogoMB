const MAX_EDGE = 1800
const MAX_BYTES = 12 * 1024 * 1024

export async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('A imagem precisa ter no máximo 12 MB.')
  }
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.82)
  })
  if (!blob) return file
  const name = file.name.replace(/\.\w+$/, '') || 'imagem'
  return new File([blob], `${name}.webp`, { type: 'image/webp' })
}

export async function shrinkForDocument(file: File): Promise<File> {
  if (file.size <= 160_000 && file.type === 'image/webp') return file
  const bitmap = await createImageBitmap(file)
  const edge = file.size > 500_000 ? 720 : 960
  const quality = file.size > 500_000 ? 0.55 : 0.7
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', quality)
  })
  if (!blob) return file
  const name = file.name.replace(/\.\w+$/, '') || 'imagem'
  return new File([blob], `${name}.webp`, { type: 'image/webp' })
}
