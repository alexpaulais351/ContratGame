export type SituationListeItem = {
  id: string
  numero: number
  libelle: string
  annee: number
  mois: number
  statut: 'brouillon' | 'validee'
  montantCumule: number
  montantMois: number
}

export type LigneDETableau = {
  id: string
  code: string
  designation: string
  unite: string
  quantite: number
  prixUnitaire: number
  estChapitre: boolean
  /** quantité cumulée de la situation précédente */
  cumulPrecedent: number
  /** quantité cumulée saisie (situation courante) */
  cumul: number
  /** PU snapshot de la situation courante (sinon PU du DE) */
  puSituation: number
  /** PU snapshot de la situation précédente (sinon PU du DE) */
  puPrecedent: number
}

export type RecapSTLigne = {
  id: string
  nom: string
  montantTotal: number
  factureMois: number
  cumule: number
  reste: number
  pourcent: number
}

export type LignePDFSituation = {
  id: string
  code: string
  designation: string
  unite: string
  estChapitre: boolean
  quantite: number
  prixUnitaire: number
  cumulPrecedent: number
  qteMois: number
  cumul: number
  pourcent: number
  montantPrecedent: number
  montantMois: number
  montantCumul: number
}
