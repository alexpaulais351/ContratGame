import { formatDateFR, formatMontant, formatNombreFR } from '@/lib/utils'
import { VINCI } from '@/lib/design-tokens'

// Ré-exports pour les générateurs PDF (formatage FR obligatoire).
export { formatDateFR, formatMontant, formatNombreFR }

/** Styles @react-pdf communs (police Helvetica intégrée). */
export const PDF_COULEURS = {
  enTete: VINCI.bleu,
  pied: VINCI.bleuFonce,
  ligneAlt: VINCI.grisClair,
  bordure: VINCI.grisBordure,
  texteGris: VINCI.gris,
  texteSecondaire: VINCI.texteSecondaire,
  blanc: VINCI.blanc,
  noir: VINCI.noir,
  rouge: VINCI.rouge,
} as const

/** "Groupe scolaire Les Tilleuls" → "Groupe_scolaire_Les_Tilleuls" pour les noms de fichiers. */
export function nomFichierSur(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
