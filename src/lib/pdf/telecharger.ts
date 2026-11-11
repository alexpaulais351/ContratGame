'use client'
import type { ReactElement } from 'react'
import { telechargerBlob } from '@/hooks/useExportPDF'

/**
 * Rend un <Document> @react-pdf et le télécharge. À appeler via exportAvecGuard().
 * @react-pdf/renderer est chargé à la demande (bundle plus léger, pas de rendu serveur).
 */
export async function genererEtTelechargerPDF(doc: ReactElement, nomFichier: string) {
  const { pdf } = await import('@react-pdf/renderer')
  const blob = await pdf(doc as Parameters<typeof pdf>[0]).toBlob()
  telechargerBlob(blob, nomFichier.endsWith('.pdf') ? nomFichier : nomFichier + '.pdf')
}
