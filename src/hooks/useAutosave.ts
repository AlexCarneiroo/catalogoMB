import { useRef, useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/utils/errors'

export function useAutosave<T>(save: (value: T) => Promise<T | void>, options?: { savedMessage?: string | false }) {
  const latest = useRef<T | null>(null)
  const savedSerial = useRef('')
  const version = useRef(0)
  const running = useRef(false)
  const again = useRef(false)
  const waiters = useRef<Array<(ok: boolean) => void>>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { notify } = useToast()
  const savedMessage = options?.savedMessage

  function sync(value: T, markSaved = false) {
    version.current += 1
    latest.current = value
    if (markSaved) {
      savedSerial.current = JSON.stringify(value)
      setSaved(false)
    }
  }

  async function flush(flushOptions?: { quiet?: boolean }): Promise<boolean> {
    if (latest.current === null) return true
    if (running.current) {
      again.current = true
      return new Promise((resolve) => waiters.current.push(resolve))
    }
    running.current = true
    setSaving(true)
    setError(null)
    let ok = true
    try {
      do {
        again.current = false
        const value: T | null = latest.current
        if (value === null) break
        const serial = JSON.stringify(value)
        if (serial === savedSerial.current) continue
        const started = version.current
        const result = await save(value)
        const stored: T = result === undefined ? value : result
        savedSerial.current = JSON.stringify(stored)
        if (version.current === started) latest.current = stored
        else again.current = true
        setSaved(true)
        if (!flushOptions?.quiet && savedMessage !== false) notify(savedMessage || 'Alterações salvas.')
      } while (again.current)
    } catch (err) {
      ok = false
      setSaved(false)
      const message = getErrorMessage(err)
      setError(message)
      notify(message, 'error')
    } finally {
      running.current = false
      setSaving(false)
      const pending = waiters.current.splice(0)
      pending.forEach((resolve) => resolve(ok))
    }
    return ok
  }

  function onBlur() {
    void flush()
  }

  return { sync, flush, onBlur, saving, saved, error, setError }
}
