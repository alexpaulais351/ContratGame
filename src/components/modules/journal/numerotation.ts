/** Structure commune de la fiche écart (écran + PDF). Module pur. */

export type ChampFicheEcart = 'etude' | 'prevuDCE' | 'phaseTransitoire' | 'exe' | 'impacts' | 'delaisImpactes' | 'coutImpactes'

export const CHAMPS_FICHE_ECART: { champ: ChampFicheEcart; libelle: string }[] = [
  { champ: 'etude', libelle: 'Étude / Écart' },
  { champ: 'prevuDCE', libelle: 'Prévu au DCE' },
  { champ: 'phaseTransitoire', libelle: 'Phase transitoire' },
  { champ: 'exe', libelle: 'EXE' },
  { champ: 'impacts', libelle: 'Impacts et conséquences' },
  { champ: 'delaisImpactes', libelle: 'Délais impactés' },
  { champ: 'coutImpactes', libelle: 'Coûts impactés' },
]

/** Numérotation : chapitres 1, 2… ; lignes 1.1, 1.2… (ou 1, 2… avant le premier chapitre). */
export function numeroterFicheEcart(lignes: { id: string; estChapitre: boolean }[]): Record<string, string> {
  const res: Record<string, string> = {}
  let chapitre = 0
  let ligne = 0
  for (const l of lignes) {
    if (l.estChapitre) {
      chapitre++
      ligne = 0
      res[l.id] = String(chapitre)
    } else {
      ligne++
      res[l.id] = chapitre > 0 ? `${chapitre}.${ligne}` : String(ligne)
    }
  }
  return res
}
