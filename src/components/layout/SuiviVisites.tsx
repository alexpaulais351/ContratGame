'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { noterVisite } from '@/actions/activite'

/** Note chaque page affichée pour l'onglet Analyse (administrateurs). Ne rend rien. */
export function SuiviVisites() {
  const chemin = usePathname()
  useEffect(() => {
    if (chemin) void noterVisite(chemin).catch(() => undefined)
  }, [chemin])
  return null
}
