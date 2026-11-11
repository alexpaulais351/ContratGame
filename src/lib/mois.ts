export const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
] as const
export const MOIS_COURTS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] as const

/** mois 1-12 */
export function libelleMois(mois: number, annee?: number): string {
  const l = MOIS_FR[(mois - 1 + 12) % 12]
  return annee ? `${l} ${annee}` : l
}
/** Clé triable "2026-04" */
export function cleMois(annee: number, mois: number): number {
  return annee * 12 + (mois - 1)
}
