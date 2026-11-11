'use client'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

/**
 * Garde anti-double-téléchargement. Toujours passer par ce hook :
 *   const { exportAvecGuard, isExporting } = useExportPDF()
 *   exportAvecGuard(() => genererPDF(data))
 */
export function useExportPDF() {
  const enCours = useRef(false)
  const [isExporting, setIsExporting] = useState(false)

  const exportAvecGuard = useCallback(async (fn: () => Promise<unknown> | unknown) => {
    if (enCours.current) return
    enCours.current = true
    setIsExporting(true)
    try {
      await fn()
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de l'export")
    } finally {
      enCours.current = false
      setIsExporting(false)
    }
  }, [])

  return { exportAvecGuard, isExporting }
}

/** Déclenche le téléchargement d'un Blob (utilisé par les générateurs). */
export function telechargerBlob(blob: Blob, nomFichier: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
