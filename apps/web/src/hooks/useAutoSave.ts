'use client'

import { useCallback, useEffect, useRef } from 'react'

export function useAutoSave(
  saveFn: () => Promise<void>,
  deps: unknown[],
  delayMs = 2000,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)

  const debouncedSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      isSavingRef.current = true
      try {
        await saveFn()
      } finally {
        isSavingRef.current = false
      }
    }, delayMs)
  }, [saveFn, delayMs])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    debouncedSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { isSaving: isSavingRef.current }
}
