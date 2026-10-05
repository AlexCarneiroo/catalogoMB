import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { collections, SETTINGS_DOC_ID } from '@/firebase/collections'
import { getDb } from '@/firebase/client'
import { readPreview, shouldUsePreview, writePreview } from '@/services/previewStore'
import { mapSettings } from '@/services/mappers'
import type { StoreSettings } from '@/types/models'
import { defaultSettings } from '@/types/models'
import { invalidatePublicData, readCache, writeCache } from '@/utils/cache'

export async function getSettings(): Promise<StoreSettings> {
  if (shouldUsePreview()) return readPreview().settings
  const cached = readCache<StoreSettings>('public:settings')
  if (cached) return cached
  const snapshot = await getDoc(doc(getDb(), collections.settings, SETTINGS_DOC_ID))
  const settings = snapshot.exists() ? mapSettings(snapshot.data()) : { ...defaultSettings }
  writeCache('public:settings', settings)
  return settings
}

export async function saveSettings(settings: StoreSettings): Promise<void> {
  if (shouldUsePreview()) {
    const db = readPreview()
    writePreview({ ...db, settings: { ...settings, storeName: settings.storeName.trim() || defaultSettings.storeName } })
    return
  }
  await setDoc(
    doc(getDb(), collections.settings, SETTINGS_DOC_ID),
    {
      ...settings,
      storeName: settings.storeName.trim() || defaultSettings.storeName,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  invalidatePublicData()
}
