// CHARTE VINCI CONSTRUCTION (v1.1 Février 2023) — source de vérité des couleurs.
export const VINCI = {
  bleu: '#004489',
  bleuFonce: '#003370',
  bleuClair: '#0056B3',
  bleuTresClair: '#E5EFF8',
  rouge: '#E20025',
  rougeFonce: '#B8001E',
  rougeTresClair: '#FDEAED',
  gris: '#B5ABA1',
  grisClair: '#F0F0F0',
  grisBordure: '#DCDCDC',
  noir: '#000000',
  texteSecondaire: '#5A5A5A',
  blanc: '#FFFFFF',
} as const

/** Palette secondaire : { couleur, fond clair } */
export const VINCI_SECONDAIRE = {
  vert: { base: '#7AA536', clair: '#E8EFDA' },
  vertVif: { base: '#A9D461', clair: '#C9E39E' },
  bleuMoyen: { base: '#307BFF', clair: '#E5F1F9' },
  bleuCiel: { base: '#80B4FF', clair: '#B2D4FC' },
  jaune: { base: '#F2AB1B', clair: '#FFF7D1' },
  orange: { base: '#C26A32', clair: '#F9E9D9' },
  rose: { base: '#F25799', clair: '#FFE8E8' },
  violet: { base: '#A152E5', clair: '#FCE8FF' },
  grisChaud: { base: '#B5ABA1', clair: '#F0F0F0' },
} as const

export type CleSecondaire = keyof typeof VINCI_SECONDAIRE

/** Jeu de 4 couleurs (catégories du journal) dérivé d'une teinte secondaire. */
export function couleursCategorie(cle: CleSecondaire) {
  const c = VINCI_SECONDAIRE[cle]
  return { couleurBg: c.clair, couleurBorder: c.base, couleurText: VINCI.noir, couleurPoint: c.base }
}

/** Couleurs sémantiques (badges) */
export const SEMANTIQUE = {
  succes: VINCI_SECONDAIRE.vert,
  info: VINCI_SECONDAIRE.bleuMoyen,
  avertissement: VINCI_SECONDAIRE.jaune,
  alerte: VINCI_SECONDAIRE.orange,
  danger: { base: VINCI.rouge, clair: VINCI.rougeTresClair },
  neutre: VINCI_SECONDAIRE.grisChaud,
} as const

export type Semantique = keyof typeof SEMANTIQUE
