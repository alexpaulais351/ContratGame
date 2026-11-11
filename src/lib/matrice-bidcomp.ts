// Gabarit « Matrice Décisionnelle d'Offres Fournisseurs » (Bid Comp).
// Module PUR (aucun import serveur) : utilisé par les actions, les composants,
// les exports Excel/PDF et le seed.
//
// Répartition du stockage :
//  - colonnes MatriceDecisionnelle : titre, acheteur, site, familleAchats,
//    budgetTheorique, devise, seuilGo, statut
//  - MatriceDecisionnelle.bidComp (Json) : typologie d'achat, date
//    d'établissement, synthèse (opportunités / risques / recommandation),
//    fournisseur recommandé — cf. BidCompData
//  - Critere (famille = clé de section) / NotationCritere / FournisseurCandidat :
//    la grille. Les valeurs de type « montant » (détail des coûts, options)
//    sont stockées dans NotationCritere.valeurTexte (nombre au format JS).

export type TypeCritere = 'note_1_3' | 'texte' | 'booleen' | 'montant'
export type DecisionFournisseur = 'go' | 'no_go' | 'en_attente'
export type StatutMatrice = 'brouillon' | 'en_cours' | 'finalisee'

export type CritereGabarit = { libelle: string; type: TypeCritere; coefficient: number }
export type SectionGabarit = { cle: string; libelle: string; description?: string; criteres: CritereGabarit[] }

const n = (libelle: string, coefficient = 1): CritereGabarit => ({ libelle, type: 'note_1_3', coefficient })
const t = (libelle: string): CritereGabarit => ({ libelle, type: 'texte', coefficient: 0 })
const b = (libelle: string): CritereGabarit => ({ libelle, type: 'booleen', coefficient: 0 })
const m = (libelle: string): CritereGabarit => ({ libelle, type: 'montant', coefficient: 0 })

/** Sections et critères par défaut, dans l'ordre de l'Excel. */
export const SECTIONS_BIDCOMP: SectionGabarit[] = [
  {
    cle: 'offre',
    libelle: 'Offre fournisseur',
    criteres: [
      t("Validité de l'offre"),
      n("Complétude de l'offre", 1),
      n('Respect du cahier des charges', 2),
      b('Variante proposée'),
    ],
  },
  {
    cle: 'financier',
    libelle: 'Conditions financières',
    criteres: [
      n('Niveau de prix', 3),
      t('Conditions de paiement'),
      b('Délai de paiement conforme LME'),
      t('Révision / actualisation des prix'),
      n('Garanties financières (caution, retenue)', 1),
      n('Acceptation des pénalités', 1),
    ],
  },
  {
    cle: 'delais',
    libelle: 'Évaluation délais',
    criteres: [
      t('Délai de fabrication'),
      n('Délai de livraison', 2),
      n('Capacité de production', 1),
      n('Compatibilité avec le planning travaux', 2),
    ],
  },
  {
    cle: 'juridique',
    libelle: 'Évaluation juridique',
    criteres: [
      n("Acceptation des conditions générales d'achat", 2),
      n('Limitation de responsabilité', 1),
      b('Attestations d’assurance (RC, décennale)'),
      b('Attestations URSSAF / Kbis à jour'),
      n('Conformité Sapin II / devoir de vigilance', 1),
    ],
  },
  {
    cle: 'qualite',
    libelle: 'Qualité - prévention',
    criteres: [
      b('Certification ISO 9001'),
      b('Certification ISO 45001 / MASE'),
      n('Agrément / homologation SNCF Réseau', 3),
      n('Plan d’assurance qualité (PAQ)', 1),
      n('Prévention / accidentologie', 1),
    ],
  },
  {
    cle: 'technique',
    libelle: 'Évaluation technique',
    criteres: [
      n('Conformité aux spécifications techniques', 3),
      n("Fiches techniques / PV d'essais", 1),
      n('Références similaires', 1),
      n('Assistance technique / SAV', 1),
    ],
  },
  {
    cle: 'csrd',
    libelle: 'CSRD',
    description: 'Critères environnementaux et sociaux (reporting de durabilité)',
    criteres: [
      n('Bilan carbone produit (FDES / EPD)', 1),
      b('Certification ISO 14001'),
      t('Part de matériaux recyclés'),
      n('Distance de transport / logistique bas carbone', 1),
      n('Engagements sociaux (insertion, égalité)', 1),
    ],
  },
  {
    cle: 'couts',
    libelle: 'Détail des coûts',
    criteres: [m('Fourniture'), m('Transport / livraison'), m('Emballage / conditionnement'), m('Frais de douane'), m('Autres frais')],
  },
  {
    cle: 'options',
    libelle: 'Options',
    criteres: [m('Option 1 – Stockage sur site'), m('Option 2 – Livraison fractionnée'), m('Option 3 – Extension de garantie')],
  },
]

export const LIBELLES_SECTIONS: Record<string, string> = Object.fromEntries(SECTIONS_BIDCOMP.map((s) => [s.cle, s.libelle]))
export const ORDRE_SECTIONS: string[] = SECTIONS_BIDCOMP.map((s) => s.cle)

/** Sections dont les montants s'additionnent (sous-total par fournisseur). */
export const SECTIONS_MONTANTS = ['couts', 'options'] as const

export const TYPES_CRITERE: { value: TypeCritere; label: string }[] = [
  { value: 'note_1_3', label: 'Note 1 à 3' },
  { value: 'texte', label: 'Texte' },
  { value: 'booleen', label: 'Oui / Non' },
  { value: 'montant', label: 'Montant' },
]

export const LIBELLES_NOTES: Record<number, string> = {
  1: '1 – Insuffisant',
  2: '2 – Acceptable',
  3: '3 – Très satisfaisant',
}

export const TYPOLOGIES_ACHAT = [
  'Fourniture',
  'Fourniture et pose',
  'Prestation de service',
  'Sous-traitance',
  'Location',
  'Transport',
  'Autre',
] as const

export const INCOTERMS = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'] as const
export const DEVISES = ['EUR', 'CHF', 'GBP', 'USD'] as const

export const STATUTS_MATRICE: { value: StatutMatrice; label: string }[] = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'finalisee', label: 'Finalisée' },
]

/** Couleurs VINCI des décisions (vert / jaune / rouge). */
export const DECISIONS: Record<DecisionFournisseur, { label: string; couleur: string; fond: string }> = {
  go: { label: 'GO', couleur: '#7AA536', fond: '#E8EFDA' },
  en_attente: { label: 'En attente', couleur: '#F2AB1B', fond: '#FFF7D1' },
  no_go: { label: 'NO GO', couleur: '#E20025', fond: '#FDEAED' },
}

export const COULEURS_NC = {
  majeure: { fond: '#FDEAED', bordure: '#E20025' },
  negociable: { fond: '#FFF7D1', bordure: '#F2AB1B' },
} as const

export type SyntheseBidComp = { opportunites: string; risques: string; recommandation: string }

/** Contenu du champ Json MatriceDecisionnelle.bidComp. */
export type BidCompData = {
  version: 1
  typologieAchat: string
  dateEtablissement: string | null
  synthese: SyntheseBidComp
  fournisseurRecommandeId: string | null
}

export function bidCompParDefaut(): BidCompData {
  return {
    version: 1,
    typologieAchat: 'Fourniture',
    dateEtablissement: null,
    synthese: { opportunites: '', risques: '', recommandation: '' },
    fournisseurRecommandeId: null,
  }
}

const str = (v: unknown, def = '') => (typeof v === 'string' ? v : def)

/** Normalise un Json quelconque en BidCompData (tolérant aux anciennes versions). */
export function lireBidComp(json: unknown): BidCompData {
  const def = bidCompParDefaut()
  if (!json || typeof json !== 'object' || Array.isArray(json)) return def
  const o = json as Record<string, unknown>
  const s = (o.synthese && typeof o.synthese === 'object' ? o.synthese : {}) as Record<string, unknown>
  return {
    version: 1,
    typologieAchat: str(o.typologieAchat, def.typologieAchat),
    dateEtablissement: typeof o.dateEtablissement === 'string' ? o.dateEtablissement : null,
    synthese: { opportunites: str(s.opportunites), risques: str(s.risques), recommandation: str(s.recommandation) },
    fournisseurRecommandeId: typeof o.fournisseurRecommandeId === 'string' ? o.fournisseurRecommandeId : null,
  }
}

/** Critères à créer pour une nouvelle matrice (famille = clé de section). */
export function criteresDuGabarit(): { famille: string; libelle: string; type: TypeCritere; coefficient: number; ordre: number }[] {
  let ordre = 0
  return SECTIONS_BIDCOMP.flatMap((s) => s.criteres.map((c) => ({ famille: s.cle, libelle: c.libelle, type: c.type, coefficient: c.coefficient, ordre: ordre++ })))
}

/** Valeur numérique d'un montant stocké dans valeurTexte. */
export function lireMontant(valeurTexte: string | null | undefined): number | null {
  if (valeurTexte === null || valeurTexte === undefined || valeurTexte.trim() === '') return null
  const v = Number(valeurTexte.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(v) ? v : null
}

export function libelleSection(cle: string): string {
  return LIBELLES_SECTIONS[cle] ?? cle
}
