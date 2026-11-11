// Types et calculs purs du module Détail Estimatif (partagés client / serveur / PDF).

export type Repartition = Record<string, number>

export type LigneDEClient = {
  id: string
  code: string
  designation: string
  unite: string
  quantite: number
  prixUnitaire: number
  estChapitre: boolean
  repartition: Repartition | null
  ordre: number
}

export type CoTraitantClient = {
  id: string
  nom: string
  estMandataire: boolean
  ordre: number
}

/** Arrondi monétaire (évite les 0,30000000004). */
export function arrondi2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function montantLigne(l: Pick<LigneDEClient, 'quantite' | 'prixUnitaire' | 'estChapitre'>): number {
  return l.estChapitre ? 0 : arrondi2(l.quantite * l.prixUnitaire)
}

/**
 * Sous-total de chaque chapitre = somme des montants des lignes situées
 * entre ce chapitre et le chapitre suivant. Retourne une Map id chapitre → sous-total.
 */
export function calculerSousTotaux(lignes: LigneDEClient[]): Map<string, number> {
  const res = new Map<string, number>()
  let chapitreCourant: string | null = null
  for (const l of lignes) {
    if (l.estChapitre) {
      chapitreCourant = l.id
      res.set(l.id, 0)
    } else if (chapitreCourant) {
      res.set(chapitreCourant, (res.get(chapitreCourant) ?? 0) + montantLigne(l))
    }
  }
  res.forEach((v, k) => res.set(k, arrondi2(v)))
  return res
}

export function totalGeneral(lignes: LigneDEClient[]): number {
  let t = 0
  for (const l of lignes) t += montantLigne(l)
  return arrondi2(t)
}

/** Normalise une valeur Json Prisma en Repartition. */
export function lireRepartition(v: unknown): Repartition | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const res: Repartition = {}
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
    const num = typeof n === 'number' ? n : Number(n)
    if (Number.isFinite(num)) res[k] = num
  }
  return res
}

export function sommeRepartition(rep: Repartition | null, coTraitantIds: string[]): number {
  if (!rep) return 0
  let s = 0
  for (const id of coTraitantIds) s += rep[id] ?? 0
  return arrondi2(s)
}
