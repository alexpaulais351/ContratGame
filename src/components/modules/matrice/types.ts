// Types sérialisables (Server → Client) du module Matrice Bid Comp.
import type { BidCompData, DecisionFournisseur, StatutMatrice, TypeCritere } from '@/lib/matrice-bidcomp'
import { lireBidComp } from '@/lib/matrice-bidcomp'

export type FournisseurVue = {
  id: string
  nom: string
  rang: number
  refOffre: string | null
  /** yyyy-mm-dd */
  dateOffre: string | null
  paysFabrication: string | null
  incoterm: string | null
  montantOffre: number | null
  decision: DecisionFournisseur
  couleurDecision: string
}

export type CritereVue = {
  id: string
  famille: string
  libelle: string
  coefficient: number
  type: TypeCritere
  ordre: number
}

export type NotationVue = {
  critereId: string
  fournisseurId: string
  note: number | null
  valeurTexte: string | null
  valeurBool: boolean | null
  commentaire: string | null
  estNonConformiteMajeure: boolean
  estNonConformiteNegociable: boolean
}

export type EnteteVue = {
  titre: string
  acheteur: string | null
  site: string | null
  familleAchats: string | null
  budgetTheorique: number | null
  devise: string
  seuilGo: number
  statut: StatutMatrice
}

export type MatriceVue = EnteteVue & {
  id: string
  bidComp: BidCompData
  fournisseurs: FournisseurVue[]
  criteres: CritereVue[]
  notations: NotationVue[]
}

type FournisseurDb = {
  id: string
  nom: string
  rang: number
  refOffre: string | null
  dateOffre: Date | null
  paysFabrication: string | null
  incoterm: string | null
  montantOffre: number | null
  decision: string
  couleurDecision: string
}
type CritereDb = { id: string; famille: string; libelle: string; coefficient: number; type: string; ordre: number }
type NotationDb = NotationVue & { id?: string }

const DECISIONS_VALIDES = ['go', 'no_go', 'en_attente']
const STATUTS_VALIDES = ['brouillon', 'en_cours', 'finalisee']
const TYPES_VALIDES = ['note_1_3', 'texte', 'booleen', 'montant']

export function versFournisseurVue(f: FournisseurDb): FournisseurVue {
  return {
    id: f.id,
    nom: f.nom,
    rang: f.rang,
    refOffre: f.refOffre,
    dateOffre: f.dateOffre ? f.dateOffre.toISOString().slice(0, 10) : null,
    paysFabrication: f.paysFabrication,
    incoterm: f.incoterm,
    montantOffre: f.montantOffre,
    decision: (DECISIONS_VALIDES.includes(f.decision) ? f.decision : 'en_attente') as DecisionFournisseur,
    couleurDecision: f.couleurDecision,
  }
}

export function versCritereVue(c: CritereDb): CritereVue {
  return {
    id: c.id,
    famille: c.famille,
    libelle: c.libelle,
    coefficient: c.coefficient,
    type: (TYPES_VALIDES.includes(c.type) ? c.type : 'texte') as TypeCritere,
    ordre: c.ordre,
  }
}

/** Convertit une matrice Prisma (avec includes) en objet sérialisable. */
export function versMatriceVue(m: {
  id: string
  titre: string
  acheteur: string | null
  site: string | null
  familleAchats: string | null
  budgetTheorique: number | null
  devise: string
  seuilGo: number
  statut: string
  bidComp: unknown
  fournisseurs: FournisseurDb[]
  criteres: (CritereDb & { notations: NotationDb[] })[]
}): MatriceVue {
  return {
    id: m.id,
    titre: m.titre,
    acheteur: m.acheteur,
    site: m.site,
    familleAchats: m.familleAchats,
    budgetTheorique: m.budgetTheorique,
    devise: m.devise,
    seuilGo: m.seuilGo,
    statut: (STATUTS_VALIDES.includes(m.statut) ? m.statut : 'brouillon') as StatutMatrice,
    bidComp: lireBidComp(m.bidComp),
    fournisseurs: [...m.fournisseurs].sort((a, b) => a.rang - b.rang).map(versFournisseurVue),
    criteres: [...m.criteres].sort((a, b) => a.ordre - b.ordre).map(versCritereVue),
    notations: m.criteres.flatMap((c) =>
      c.notations.map((n) => ({
        critereId: n.critereId,
        fournisseurId: n.fournisseurId,
        note: n.note,
        valeurTexte: n.valeurTexte,
        valeurBool: n.valeurBool,
        commentaire: n.commentaire,
        estNonConformiteMajeure: n.estNonConformiteMajeure,
        estNonConformiteNegociable: n.estNonConformiteNegociable,
      })),
    ),
  }
}
