import type { CleSecondaire } from '@/lib/design-tokens'
/** Catégories système du journal créées pour chaque projet. */
export const CATEGORIES_SYSTEME: { nom: string; cle: CleSecondaire }[] = [
  { nom: 'Contrat', cle: 'vert' }, { nom: 'Étude diffusion', cle: 'vertVif' }, { nom: 'VISA étude', cle: 'rose' },
  { nom: 'Groupement', cle: 'bleuMoyen' }, { nom: 'Suivi / impact', cle: 'bleuCiel' }, { nom: 'SOS terrain', cle: 'jaune' },
  { nom: 'Alerte', cle: 'orange' }, { nom: 'EBGC', cle: 'violet' }, { nom: 'Autre', cle: 'grisChaud' },
]
