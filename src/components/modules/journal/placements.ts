/**
 * Frise chronologique — algorithme PUR de placement (aucune dépendance DOM/React).
 *
 * Règles (CLAUDE.md > Journal > Frise) :
 *  - chaque bulle reste À L'APLOMB de sa date (centre horizontal = x de la date,
 *    trait de rappel strictement vertical) — JAMAIS de décalage horizontal ;
 *  - essaie en haut contre la ligne, puis en bas contre la ligne,
 *    sinon s'empile du côté où elle reste au plus près de la ligne ;
 *  - largeur fixe par mois (LARGEUR_MOIS = 260 px), bulles ~185 px.
 *
 * Les dates sont manipulées en « jours » texte 'AAAA-MM-JJ' (indépendant du fuseau).
 *
 * Périodes (barres horizontales sur une plage de dates) :
 *  - même échelle temporelle que les bulles (début du 1er jour → fin du dernier jour) ;
 *  - rangées par algorithme d'intervalles (glouton, déterministe) : deux périodes qui
 *    se chevauchent dans le temps (jours inclusifs) ne partagent jamais une rangée ;
 *  - la bande des périodes occupe le HAUT de la frise : bulles du haut, axe et bulles du bas
 *    sont décalés de sa hauteur (aucun chevauchement possible avec les bulles) ;
 *  - export multi-pages : une période coupée par une page est découpée en segments
 *    (segmentsPeriode) et son libellé est recentré sur la partie visible de chaque page.
 */

export const LARGEUR_MOIS = 260
export const LARGEUR_BULLE = 185
/** Distance entre la ligne et le bord le plus proche d'une bulle de 1er niveau. */
export const ECART_LIGNE = 26
/** Espace vertical minimal entre deux bulles empilées. */
export const ESPACE_VERTICAL = 8
/** Espace horizontal minimal entre deux bulles d'un même niveau. */
export const ESPACE_HORIZONTAL = 6
/** Marge latérale de l'axe (une demi-bulle + respiration). */
export const MARGE_AXE = Math.ceil(LARGEUR_BULLE / 2) + 12
/** Marge verticale au-dessus / au-dessous des bulles extrêmes. */
export const MARGE_VERTICALE = 12

// Typographie des bulles (doit rester cohérente avec BulleFrise.tsx)
export const BULLE = {
  paddingY: 6,
  bordure: 1,
  ligneEntete: 15,
  ligneTitre: 15,
  ligneDescription: 14,
  ecartDescription: 2,
  caracteresTitre: 24,
  caracteresDescription: 29,
  maxLignesTitre: 3,
  maxLignesDescription: 2,
} as const

// Périodes (doit rester cohérent avec FriseRendu.tsx)
export const PERIODE = {
  /** hauteur d'une barre de période */
  hauteur: 36,
  /** espace vertical entre deux rangées de périodes */
  espace: 5,
  /** marge au-dessus de la première rangée */
  margeHaut: 10,
  /** espace entre la dernière rangée et la zone des bulles du haut */
  margeBas: 6,
  paddingX: 8,
  ligneTitre: 15,
  ligneSousTitre: 13,
  /** largeur moyenne d'un caractère (px) : titre 11 px gras majuscules, sous-titre 10 px */
  pxCaractereTitre: 7.4,
  pxCaractereSousTitre: 5.6,
  /** en deçà, un segment de période coupé par une page est jugé « étroit » (libellé illisible) */
  largeurMinSegment: 140,
} as const

export type ElementPeriode = {
  id: string
  /** 'AAAA-MM-JJ' (inclus) */
  debut: string
  /** 'AAAA-MM-JJ' (inclus) */
  fin: string
}

export type PlacementPeriode = {
  id: string
  debut: string
  fin: string
  /** début du 1er jour (après éventuel rognage aux limites) */
  gauche: number
  /** fin du dernier jour (après éventuel rognage aux limites) */
  droite: number
  rangee: number
  top: number
  hauteur: number
  /** la période commence avant / finit après la partie affichée */
  tronqueDebut: boolean
  tronqueFin: boolean
}

export type ElementFrise = {
  id: string
  /** 'AAAA-MM-JJ' */
  jour: string
  titre: string
  description?: string | null
}

export type Cote = 'haut' | 'bas'

export type Placement = {
  id: string
  jour: string
  /** abscisse de la date (centre de la bulle et du trait de rappel) */
  x: number
  gauche: number
  droite: number
  largeur: number
  hauteur: number
  cote: Cote
  /** distance entre la ligne et le bord de la bulle le plus proche de la ligne */
  distance: number
  lignesTitre: string[]
  lignesDescription: string[]
}

export type MoisAxe = { annee: number; mois: number; x: number; largeur: number }

export type OptionsFrise = {
  largeurMois?: number
  largeurBulle?: number
  /** premier mois affiché 'AAAA-MM' (défaut : mois du premier élément) */
  moisDebut?: string
  /** dernier mois affiché 'AAAA-MM' (défaut : mois du dernier élément) */
  moisFin?: string
  /** périodes à afficher (barres horizontales) */
  periodes?: ElementPeriode[]
  /** bornes 'AAAA-MM-JJ' (incluses) auxquelles les périodes sont rognées (export d'une plage) */
  limitesPeriodes?: { debut: string; fin: string }
}

export type DispositionFrise = {
  placements: Placement[]
  periodes: PlacementPeriode[]
  /** hauteur de la bande des périodes en haut de la frise (0 si aucune) */
  hauteurPeriodes: number
  mois: MoisAxe[]
  largeurMois: number
  largeurBulle: number
  largeurTotale: number
  /** hauteur de la zone des bulles du haut (sous la bande des périodes) */
  hauteurHaut: number
  hauteurBas: number
  /** ordonnée de la ligne dans la frise (= hauteurPeriodes + hauteurHaut) */
  yLigne: number
  hauteurTotale: number
  /** étendue horizontale réelle du contenu (bulles + périodes + marge) — pour le recadrage */
  contenuGauche: number
  contenuDroite: number
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function decomposerJour(jour: string): { annee: number; mois: number; j: number } {
  const [a, m, j] = jour.slice(0, 10).split('-').map(Number)
  return { annee: a, mois: m, j: j || 1 }
}

export function joursDansMois(annee: number, mois: number): number {
  return new Date(Date.UTC(annee, mois, 0)).getUTCDate()
}

function indexMois(annee: number, mois: number) {
  return annee * 12 + (mois - 1)
}

function cleVersIndex(cle: string) {
  const { annee, mois } = decomposerJour(cle.length === 7 ? cle + '-01' : cle)
  return indexMois(annee, mois)
}

/** Abscisse d'une date : marge + mois entiers + fraction du mois (milieu du jour). */
export function abscisseJour(jour: string, indexMoisDebut: number, largeurMois: number, marge = MARGE_AXE): number {
  const { annee, mois, j } = decomposerJour(jour)
  const iMois = indexMois(annee, mois) - indexMoisDebut
  const fraction = (j - 0.5) / joursDansMois(annee, mois)
  return marge + (iMois + fraction) * largeurMois
}

/** Abscisse du DÉBUT d'un jour (minuit) — bord gauche d'une période. */
export function abscisseDebutJour(jour: string, indexMoisDebut: number, largeurMois: number, marge = MARGE_AXE): number {
  const { annee, mois, j } = decomposerJour(jour)
  return marge + (indexMois(annee, mois) - indexMoisDebut + (j - 1) / joursDansMois(annee, mois)) * largeurMois
}

/** Abscisse de la FIN d'un jour (minuit suivant) — bord droit d'une période. */
export function abscisseFinJour(jour: string, indexMoisDebut: number, largeurMois: number, marge = MARGE_AXE): number {
  const { annee, mois, j } = decomposerJour(jour)
  return marge + (indexMois(annee, mois) - indexMoisDebut + j / joursDansMois(annee, mois)) * largeurMois
}

// ---------------------------------------------------------------------------
// Périodes : rangées (intervalles) et segments
// ---------------------------------------------------------------------------

/**
 * Rangées des périodes (glouton sur intervalles, déterministe) : tri par début, puis la plus
 * longue d'abord, puis id ; chaque période prend la première rangée dont toutes les périodes
 * se terminent STRICTEMENT avant son début (jours inclus : fin = début → chevauchement).
 * Retourne { id → rangée } et le nombre de rangées.
 */
export function rangerPeriodes(periodes: ElementPeriode[]): { rangees: Map<string, number>; nbRangees: number } {
  const tries = [...periodes]
    .map((p) => (p.fin < p.debut ? { ...p, debut: p.fin, fin: p.debut } : p))
    .sort((a, b) => (a.debut !== b.debut ? (a.debut < b.debut ? -1 : 1) : a.fin !== b.fin ? (a.fin > b.fin ? -1 : 1) : a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const finsRangees: string[] = []
  const rangees = new Map<string, number>()
  for (const p of tries) {
    let r = finsRangees.findIndex((f) => f < p.debut)
    if (r < 0) {
      r = finsRangees.length
      finsRangees.push(p.fin)
    } else finsRangees[r] = p.fin
    rangees.set(p.id, r)
  }
  return { rangees, nbRangees: finsRangees.length }
}

export function hauteurBandePeriodes(nbRangees: number): number {
  if (nbRangees <= 0) return 0
  return PERIODE.margeHaut + nbRangees * PERIODE.hauteur + (nbRangees - 1) * PERIODE.espace + PERIODE.margeBas
}

export type SegmentPeriode = { gauche: number; droite: number; coupeGauche: boolean; coupeDroite: boolean }

/**
 * Découpe une période par les coupes de pages : un segment par page traversée,
 * chacun portant son propre libellé (recentré sur la partie visible de la page).
 * `coupes` = [x0, x1, …, xn] (bornes des pages) ; sans coupes → un seul segment.
 */
export function segmentsPeriode(p: Pick<PlacementPeriode, 'gauche' | 'droite'>, coupes: number[] = []): SegmentPeriode[] {
  const internes = coupes.slice(1, -1).filter((c) => c > p.gauche + 0.5 && c < p.droite - 0.5)
  const bornes = [p.gauche, ...internes, p.droite]
  const res: SegmentPeriode[] = []
  for (let i = 0; i < bornes.length - 1; i++) {
    res.push({ gauche: bornes[i], droite: bornes[i + 1], coupeGauche: i > 0, coupeDroite: i < bornes.length - 2 })
  }
  return res
}

/** Tronque un libellé (avec « … ») pour qu'il tienne dans `largeurPx` (estimation par caractère, sans rendu). */
export function ajusterLibelle(texte: string, largeurPx: number, pxParCaractere: number): string {
  const max = Math.floor(largeurPx / pxParCaractere)
  if (texte.length <= max) return texte
  if (max <= 1) return ''
  return texte.slice(0, max - 1).trimEnd() + '…'
}

// ---------------------------------------------------------------------------
// Texte des bulles (coupure déterministe → hauteur connue sans rendu)
// ---------------------------------------------------------------------------

/** Coupe un texte en lignes de `parLigne` caractères max (sur les mots), `maxLignes` lignes, avec « … ». */
export function couperTexte(texte: string, parLigne: number, maxLignes: number): string[] {
  const mots = texte.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  const lignes: string[] = []
  let courante = ''
  for (let mot of mots) {
    while (mot.length > parLigne) {
      // mot trop long : coupe dure
      if (courante) lignes.push(courante)
      courante = ''
      lignes.push(mot.slice(0, parLigne))
      mot = mot.slice(parLigne)
    }
    const essai = courante ? courante + ' ' + mot : mot
    if (essai.length <= parLigne) courante = essai
    else {
      lignes.push(courante)
      courante = mot
    }
  }
  if (courante) lignes.push(courante)
  if (lignes.length <= maxLignes) return lignes
  const gardees = lignes.slice(0, maxLignes)
  const derniere = gardees[maxLignes - 1]
  gardees[maxLignes - 1] = (derniere.length >= parLigne ? derniere.slice(0, parLigne - 1) : derniere).trimEnd() + '…'
  return gardees
}

export function contenuBulle(el: Pick<ElementFrise, 'titre' | 'description'>) {
  const lignesTitre = couperTexte(el.titre || '(sans titre)', BULLE.caracteresTitre, BULLE.maxLignesTitre)
  const lignesDescription = el.description ? couperTexte(el.description, BULLE.caracteresDescription, BULLE.maxLignesDescription) : []
  return { lignesTitre, lignesDescription }
}

export function hauteurBulle(nbLignesTitre: number, nbLignesDescription: number): number {
  return (
    2 * BULLE.bordure +
    2 * BULLE.paddingY +
    BULLE.ligneEntete +
    Math.max(1, nbLignesTitre) * BULLE.ligneTitre +
    (nbLignesDescription > 0 ? BULLE.ecartDescription + nbLignesDescription * BULLE.ligneDescription : 0)
  )
}

// ---------------------------------------------------------------------------
// Placement anti-chevauchement
// ---------------------------------------------------------------------------

type Intervalle = { debut: number; fin: number }

/** Plus petite distance ≥ ECART_LIGNE telle que [d, d+h] ne touche aucun intervalle occupé. */
export function distanceLibre(occupes: Intervalle[], hauteur: number): number {
  const tries = [...occupes].sort((a, b) => a.debut - b.debut)
  let d = ECART_LIGNE
  let change = true
  while (change) {
    change = false
    for (const o of tries) {
      if (o.debut < d + hauteur + ESPACE_VERTICAL && o.fin + ESPACE_VERTICAL > d) {
        d = o.fin + ESPACE_VERTICAL
        change = true
      }
    }
  }
  return d
}

function chevaucheH(a: { gauche: number; droite: number }, b: { gauche: number; droite: number }) {
  return a.gauche < b.droite + ESPACE_HORIZONTAL && b.gauche < a.droite + ESPACE_HORIZONTAL
}

function trierElements<T extends ElementFrise>(elements: T[]): T[] {
  return [...elements].sort((a, b) => (a.jour < b.jour ? -1 : a.jour > b.jour ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

export function calculerFrise(elements: ElementFrise[], options: OptionsFrise = {}): DispositionFrise {
  const largeurMois = options.largeurMois ?? LARGEUR_MOIS
  const largeurBulle = options.largeurBulle ?? LARGEUR_BULLE
  const tries = trierElements(elements)

  // Étendue des mois
  const auj = new Date()
  const defaut = `${auj.getFullYear()}-${String(auj.getMonth() + 1).padStart(2, '0')}`
  const periodesEntree = (options.periodes ?? []).map((p) => (p.fin < p.debut ? { ...p, debut: p.fin, fin: p.debut } : p))
  const joursConnus = [...tries.map((e) => e.jour), ...periodesEntree.flatMap((p) => [p.debut, p.fin])].sort()
  const premier = options.moisDebut ?? (joursConnus[0]?.slice(0, 7) || defaut)
  const dernier = options.moisFin ?? (joursConnus[joursConnus.length - 1]?.slice(0, 7) || premier)
  const iDebut = cleVersIndex(premier)
  const iFin = Math.max(iDebut, cleVersIndex(dernier))
  const mois: MoisAxe[] = []
  for (let i = iDebut; i <= iFin; i++) {
    mois.push({ annee: Math.floor(i / 12), mois: (i % 12) + 1, x: MARGE_AXE + (i - iDebut) * largeurMois, largeur: largeurMois })
  }
  const largeurTotale = 2 * MARGE_AXE + mois.length * largeurMois

  // Périodes : rognées à l'axe (et aux limites demandées), rangées, bande en haut
  const axeGauche = MARGE_AXE
  const axeDroite = MARGE_AXE + mois.length * largeurMois
  const limG = Math.max(axeGauche, options.limitesPeriodes ? abscisseDebutJour(options.limitesPeriodes.debut, iDebut, largeurMois) : -Infinity)
  const limD = Math.min(axeDroite, options.limitesPeriodes ? abscisseFinJour(options.limitesPeriodes.fin, iDebut, largeurMois) : Infinity)
  const visibles = periodesEntree
    .map((p) => {
      const g = abscisseDebutJour(p.debut, iDebut, largeurMois)
      const dr = abscisseFinJour(p.fin, iDebut, largeurMois)
      return { p, g, dr, gauche: Math.max(g, limG), droite: Math.min(dr, limD) }
    })
    .filter((v) => v.droite - v.gauche > 0.5)
  const { rangees, nbRangees } = rangerPeriodes(visibles.map((v) => v.p))
  const hauteurPeriodes = hauteurBandePeriodes(nbRangees)
  const periodes: PlacementPeriode[] = visibles
    .map((v) => {
      const rangee = rangees.get(v.p.id) ?? 0
      return {
        id: v.p.id,
        debut: v.p.debut,
        fin: v.p.fin,
        gauche: v.gauche,
        droite: v.droite,
        rangee,
        top: PERIODE.margeHaut + rangee * (PERIODE.hauteur + PERIODE.espace),
        hauteur: PERIODE.hauteur,
        tronqueDebut: v.gauche > v.g + 0.01,
        tronqueFin: v.droite < v.dr - 0.01,
      }
    })
    .sort((a, b) => a.rangee - b.rangee || a.gauche - b.gauche || (a.id < b.id ? -1 : 1))

  const placements: Placement[] = []
  for (const el of tries) {
    const x = abscisseJour(el.jour, iDebut, largeurMois)
    const { lignesTitre, lignesDescription } = contenuBulle(el)
    const hauteur = hauteurBulle(lignesTitre.length, lignesDescription.length)
    const gauche = x - largeurBulle / 2
    const droite = x + largeurBulle / 2
    const voisins = placements.filter((p) => chevaucheH(p, { gauche, droite }))
    const occ = (cote: Cote) => voisins.filter((p) => p.cote === cote).map((p) => ({ debut: p.distance, fin: p.distance + p.hauteur }))
    const dHaut = distanceLibre(occ('haut'), hauteur)
    const dBas = distanceLibre(occ('bas'), hauteur)
    let cote: Cote
    if (dHaut === ECART_LIGNE) cote = 'haut'
    else if (dBas === ECART_LIGNE) cote = 'bas'
    else cote = dBas < dHaut ? 'bas' : 'haut'
    placements.push({
      id: el.id,
      jour: el.jour,
      x,
      gauche,
      droite,
      largeur: largeurBulle,
      hauteur,
      cote,
      distance: cote === 'haut' ? dHaut : dBas,
      lignesTitre,
      lignesDescription,
    })
  }

  const etendue = (cote: Cote) =>
    placements.filter((p) => p.cote === cote).reduce((m, p) => Math.max(m, p.distance + p.hauteur), ECART_LIGNE)
  const hauteurHaut = etendue('haut') + MARGE_VERTICALE
  const hauteurBas = etendue('bas') + MARGE_VERTICALE
  const bords = [...placements, ...periodes]
  const contenuGauche = bords.length ? Math.max(0, Math.min(...bords.map((p) => p.gauche)) - 12) : 0
  const contenuDroite = bords.length ? Math.min(largeurTotale, Math.max(...bords.map((p) => p.droite)) + 12) : largeurTotale

  return {
    placements,
    periodes,
    hauteurPeriodes,
    mois,
    largeurMois,
    largeurBulle,
    largeurTotale,
    hauteurHaut,
    hauteurBas,
    yLigne: hauteurPeriodes + hauteurHaut,
    hauteurTotale: hauteurPeriodes + hauteurHaut + hauteurBas,
    contenuGauche,
    contenuDroite,
  }
}

/** Ordonnée (top) d'une bulle dans la frise. */
export function topBulle(p: Placement, yLigne: number): number {
  return p.cote === 'haut' ? yLigne - p.distance - p.hauteur : yLigne + p.distance
}

// ---------------------------------------------------------------------------
// Export PDF : étalement, découpe multi-pages, compression
// ---------------------------------------------------------------------------

export type ZonePage = {
  /** largeur utile de la page (pt ou mm, même unité que hauteur) */
  largeur: number
  hauteur: number
  /** échelle maximale (unité page / px) — au-delà la frise serait démesurée */
  echelleMax: number
}

/** Échelle (unité page par px) : la frise tient en hauteur dans la zone, sans dépasser echelleMax. */
export function echellePour(d: DispositionFrise, zone: ZonePage): number {
  return Math.min(zone.echelleMax, zone.hauteur / d.hauteurTotale)
}

export function largeurContenu(d: DispositionFrise): number {
  return d.contenuDroite - d.contenuGauche
}

/**
 * Étalement : cherche par itération (dichotomie sur le calcul pur) la largeur/mois
 * qui fait remplir TOUTE la largeur de la page (ou de n pages pleines si la frise est longue).
 */
export function chercherLargeurMois(
  elements: ElementFrise[],
  zone: ZonePage,
  options: Omit<OptionsFrise, 'largeurMois'> = {},
  bornes: { min: number; max: number } = { min: 40, max: 4000 },
): { largeurMois: number; pages: number; disposition: DispositionFrise } {
  const mesure = (L: number) => {
    const d = calculerFrise(elements, { ...options, largeurMois: L })
    return { d, largeurPage: largeurContenu(d) * echellePour(d, zone) }
  }
  const base = mesure(LARGEUR_MOIS)
  const pages = Math.max(1, Math.round(base.largeurPage / zone.largeur))
  // Pour plusieurs pages on vise un peu moins que n pages pleines : les coupes se font entre les bulles.
  const cible = pages === 1 ? zone.largeur : pages * zone.largeur * 0.96
  let lo = bornes.min
  let hi = bornes.max
  let meilleur = { L: LARGEUR_MOIS, d: base.d, ecart: Math.abs(base.largeurPage - cible), ok: base.largeurPage <= cible }
  for (let it = 0; it < 40; it++) {
    const L = (lo + hi) / 2
    const m = mesure(L)
    const ok = m.largeurPage <= cible
    const ecart = Math.abs(m.largeurPage - cible)
    // on privilégie une solution qui ne dépasse pas la cible
    if ((ok && (!meilleur.ok || ecart < meilleur.ecart)) || (!ok && !meilleur.ok && ecart < meilleur.ecart)) {
      meilleur = { L, d: m.d, ecart, ok }
    }
    if (ok) lo = L
    else hi = L
    if (hi - lo < 0.25) break
  }
  return { largeurMois: meilleur.L, pages, disposition: meilleur.d }
}

/**
 * Coupes horizontales (en px de frise) entre les bulles : jamais au travers d'une bulle
 * quand c'est possible. Retourne les bornes [x0, x1, ..., xn] (n pages).
 *
 * Périodes : une coupe peut traverser une période (elles durent souvent plusieurs mois) —
 * la période est alors découpée en segments, chacun avec son libellé recentré
 * (segmentsPeriode). À nombre de bulles traversées égal et page au moins à moitié pleine,
 * on préfère une coupe qui ne laisse aucun segment de période plus étroit que
 * PERIODE.largeurMinSegment (libellé lisible), puis la plus à droite (pages pleines).
 */
export function calculerCoupes(
  placements: Pick<Placement, 'gauche' | 'droite'>[],
  debut: number,
  fin: number,
  largeurPagePx: number,
  periodes: Pick<PlacementPeriode, 'gauche' | 'droite'>[] = [],
): number[] {
  const coupes = [debut]
  let courant = debut
  let garde = 0
  while (fin - courant > largeurPagePx + 0.5 && garde++ < 1000) {
    const limite = courant + largeurPagePx
    // candidats : bords des bulles et des périodes (côté espace libre) + limite
    const candidats = new Set<number>([limite])
    for (const p of [...placements, ...periodes]) {
      if (p.gauche > courant && p.gauche <= limite) candidats.add(p.gauche - 1)
      if (p.droite > courant && p.droite <= limite) candidats.add(p.droite + 1)
    }
    // … et positions laissant exactement un segment de période lisible de chaque côté
    for (const p of periodes) {
      for (const c of [p.gauche + PERIODE.largeurMinSegment + 1, p.droite - PERIODE.largeurMinSegment - 1]) {
        if (c > courant && c <= limite) candidats.add(c)
      }
    }
    const traverse = (c: number) => placements.filter((p) => p.gauche < c && p.droite > c).length
    // segment étroit : morceau de période (côté page courante ou suivante) trop court pour son libellé
    const etroits = (c: number) =>
      periodes.filter((p) => p.gauche < c - 0.5 && p.droite > c + 0.5).filter((p) => {
        const avant = c - Math.max(p.gauche, courant)
        const apres = Math.min(p.droite, c + largeurPagePx, fin) - c
        return avant < PERIODE.largeurMinSegment || apres < PERIODE.largeurMinSegment
      }).length
    let choix = -1
    let meilleur = [Infinity, Infinity, Infinity]
    for (const c of Array.from(candidats).sort((a, b) => b - a)) {
      if (c <= courant + 1 || c > limite) continue
      // 1. page au moins à moitié pleine (jamais de page quasi vide)  2. bulles traversées
      // 3. segments de période étroits — puis, à égalité, la coupe la plus à droite (pages pleines)
      const score = [c < courant + largeurPagePx / 2 ? 1 : 0, traverse(c), etroits(c)]
      const k = score.findIndex((v, i) => v !== meilleur[i])
      if (k >= 0 && score[k] < meilleur[k]) {
        choix = c
        meilleur = score
        if (score.every((v) => v === 0)) break
      }
    }
    if (choix < 0) choix = limite
    coupes.push(choix)
    courant = choix
  }
  coupes.push(fin)
  return coupes
}

export type PlanPages = {
  echelle: number
  coupes: number[]
  /** facteur de compression appliqué (1 = aucune) */
  compression: number
}

/**
 * Plan multi-pages à échelle identique. Si la dernière page est quasi vide,
 * compresse l'échelle (au plus 15 %) pour supprimer cette page.
 */
export function planifierPages(
  d: DispositionFrise,
  zone: ZonePage,
  seuilQuasiVide = 0.25,
  compressionMax = 0.15,
): PlanPages {
  const echelle = echellePour(d, zone)
  const plan = (e: number) => calculerCoupes(d.placements, d.contenuGauche, d.contenuDroite, zone.largeur / e, d.periodes)
  const coupes = plan(echelle)
  const nb = coupes.length - 1
  if (nb > 1) {
    const derniere = (coupes[nb] - coupes[nb - 1]) * echelle
    if (derniere / zone.largeur < seuilQuasiVide) {
      for (let k = 0.01; k <= compressionMax + 1e-9; k += 0.01) {
        const e = echelle * (1 - k)
        const c = plan(e)
        if (c.length - 1 < nb) return { echelle: e, coupes: c, compression: 1 - k }
      }
    }
  }
  return { echelle, coupes, compression: 1 }
}
