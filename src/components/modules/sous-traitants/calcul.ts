// Calculs purs (sans 'use client', sans Prisma) partagés entre pages, composants et recap.
export type AvenantLite = { id: string; numero: string; libelle: string; montant: number; date: string | null }
export type FacturationLite = { sousTraitantId: string; annee: number; mois: number; montant: number }

export function montantTotalST(montantMarche: number, avenants: { montant: number }[]): number {
  return montantMarche + avenants.reduce((s, a) => s + a.montant, 0)
}

export function pctAvancement(cumul: number, total: number): number {
  return total > 0 ? (cumul / total) * 100 : 0
}
