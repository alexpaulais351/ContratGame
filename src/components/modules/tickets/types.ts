import type { CleSecondaire } from '@/lib/design-tokens'

type Option = { value: string; label: string; couleur: CleSecondaire | 'rouge' }

export const CATEGORIES_TICKET = [
  { value: 'amelioration', label: 'Amélioration', couleur: 'bleuMoyen' },
  { value: 'anomalie', label: 'Anomalie / bug', couleur: 'orange' },
  { value: 'export', label: 'Export (PDF, Excel, Word)', couleur: 'violet' },
  { value: 'affichage', label: 'Affichage / ergonomie', couleur: 'bleuCiel' },
  { value: 'donnees', label: 'Données / projet', couleur: 'vert' },
  { value: 'autre', label: 'Autre', couleur: 'grisChaud' },
] as const satisfies readonly Option[]

export const PRIORITES_TICKET = [
  { value: 'basse', label: 'Basse', couleur: 'grisChaud' },
  { value: 'normale', label: 'Normale', couleur: 'bleuMoyen' },
  { value: 'haute', label: 'Haute', couleur: 'rouge' },
] as const satisfies readonly Option[]

export const STATUTS_TICKET = [
  { value: 'nouveau', label: 'Nouveau', couleur: 'jaune' },
  { value: 'en_cours', label: 'En cours', couleur: 'bleuMoyen' },
  { value: 'resolu', label: 'Résolu', couleur: 'vert' },
  { value: 'refuse', label: 'Refusé', couleur: 'grisChaud' },
] as const satisfies readonly Option[]

export type TicketDTO = {
  id: string
  numero: number
  titre: string
  description: string
  categorie: string
  priorite: string
  statut: string
  page: string | null
  reponse: string | null
  creeLe: string // ISO
  majLe: string // ISO
  auteurNom: string
  auteurEmail: string
  estAuteur: boolean
}

export const optionDe = (liste: readonly Option[], v: string) => liste.find((o) => o.value === v) ?? liste[liste.length - 1]
