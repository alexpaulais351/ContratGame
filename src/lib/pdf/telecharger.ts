'use client'
import { pdf } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { telechargerBlob } from '@/hooks/useExportPDF'

/** Rend un <Document> @react-pdf et le télécharge. À appeler via exportAvecGuard(). */
export async function genererEtTelechargerPDF(doc: ReactElement, nomFichier: string) {
  const blob = await pdf(doc as Parameters<typeof pdf>[0]).toBlob()
  telechargerBlob(blob, nomFichier.endsWith('.pdf') ? nomFichier : nomFichier + '.pdf')
}
