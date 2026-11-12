'use client'
/**
 * Export PDF de la frise : html2canvas + jsPDF (PAS @react-pdf/renderer).
 * A4 paysage, en-tête / pied VINCI vectoriels, légende vectorielle,
 * frise capturée en JPEG 0,82 ('FAST'), découpée entre les bulles,
 * pièces jointes images en pages portrait à la fin.
 *
 * Module chargé dynamiquement (await import) au moment de l'export.
 */
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { VINCI } from '@/lib/design-tokens'
import { formatDateFR, hexToRgb } from '@/lib/utils'
import { telechargerBlob } from '@/hooks/useExportPDF'
import type { ProfilSociete } from '@/stores/profil'
import {
  chercherLargeurMois,
  planifierPages,
  type DispositionFrise,
  type ElementFrise,
  type ElementPeriode,
  type PlanPages,
  type ZonePage,
} from './placements'
import { couleursPeriode, dureeLisible } from './periodes'
import { jourFR, type CouleursCategorie } from './types'

// ---------------------------------------------------------------------------
// Mise en page (mm)
// ---------------------------------------------------------------------------
const A4_L = 297
const A4_H = 210
const MARGE = 8
const ENTETE_H = 18
const LEGENDE_Y = ENTETE_H + 4
const LEGENDE_LIGNE = 5
const PIED_Y = A4_H - 9
const BAS_ZONE = PIED_Y - 3
/** mm par px CSS au maximum (≈ 90 % de la taille écran à 96 dpi : titres des bulles ≈ 8 pt) */
const ECHELLE_MAX = 0.24
/** Surface maximale du canvas (limite Safari / iPad ≈ 16,7 Mpx) */
const SURFACE_MAX_CANVAS = 16_700_000
const DPI_CIBLE = 200
const QUALITE_JPEG = 0.82

export type ItemLegende = { nom: string } & CouleursCategorie

type LigneLegende = { items: { item: ItemLegende; x: number }[] }

/** Largeur approximative d'un texte Helvetica 8 pt en mm (pour la répartition de la légende). */
function largeurTexteApprox(s: string) {
  return s.length * 1.5
}

function repartirLegende(items: ItemLegende[]): LigneLegende[] {
  const debut = MARGE + 16
  const fin = A4_L - MARGE
  const lignes: LigneLegende[] = [{ items: [] }]
  let x = debut
  for (const item of items) {
    const w = 6 + largeurTexteApprox(item.nom) + 6
    if (x + w > fin && lignes[lignes.length - 1].items.length > 0) {
      lignes.push({ items: [] })
      x = debut
    }
    lignes[lignes.length - 1].items.push({ item, x })
    x += w
  }
  return lignes
}

export type MiseEnPageFrise = {
  disposition: DispositionFrise
  plan: PlanPages
  zone: ZonePage
  zoneHaut: number
  legende: LigneLegende[]
  largeurMois: number
}

/**
 * Calcul (pur, sans DOM) de la mise en page : étalement itératif de la largeur/mois
 * pour remplir toute la largeur de page, puis plan de pages (coupes entre bulles,
 * même échelle partout, compression ≤ 15 %). Les périodes (rognées à [debut, fin])
 * font partie de la disposition : hauteur de bande, recadrage et coupes en tiennent compte.
 */
export function calculerMiseEnPage(
  elements: ElementFrise[],
  legende: ItemLegende[],
  debut: string,
  fin: string,
  periodes: ElementPeriode[] = [],
): MiseEnPageFrise {
  const lignesLegende = repartirLegende(legende)
  const zoneHaut = LEGENDE_Y + lignesLegende.length * LEGENDE_LIGNE + 3
  const zone: ZonePage = { largeur: A4_L - 2 * MARGE, hauteur: BAS_ZONE - zoneHaut, echelleMax: ECHELLE_MAX }
  const { disposition, largeurMois } = chercherLargeurMois(elements, zone, {
    moisDebut: debut.slice(0, 7),
    moisFin: fin.slice(0, 7),
    periodes,
    limitesPeriodes: { debut, fin },
  })
  const plan = planifierPages(disposition, zone)
  return { disposition, plan, zone, zoneHaut, legende: lignesLegende, largeurMois }
}

// ---------------------------------------------------------------------------
// Outils jsPDF
// ---------------------------------------------------------------------------

/** Les polices standard jsPDF sont en WinAnsi : on remplace les caractères hors jeu. */
function texte(s: string): string {
  return s
    .replace(/[’‘]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/→/g, '->')
    .replace(/ | /g, ' ')
    .replace(/[^ -\u00ff€œŒ]/g, '?')
}

function couleur(doc: jsPDF, hex: string, cible: 'fill' | 'draw' | 'text') {
  const c = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 }
  if (cible === 'fill') doc.setFillColor(c.r, c.g, c.b)
  else if (cible === 'draw') doc.setDrawColor(c.r, c.g, c.b)
  else doc.setTextColor(c.r, c.g, c.b)
}

function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image illisible'))
    img.src = src
  })
}

/** Réencode une image (data URL) via canvas : JPEG compressé (ou PNG pour le logo transparent). */
async function reencoder(src: string, format: 'JPEG' | 'PNG', coteMax: number) {
  const img = await chargerImage(src)
  const r = Math.min(1, coteMax / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * r))
  const h = Math.max(1, Math.round(img.naturalHeight * r))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  if (format === 'JPEG') {
    ctx.fillStyle = VINCI.blanc
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)
  return { data: c.toDataURL(format === 'JPEG' ? 'image/jpeg' : 'image/png', QUALITE_JPEG), w, h }
}

type Contexte = {
  nomProjet: string
  profil: ProfilSociete | null
  logo: { data: string; w: number; h: number } | null
  periode: string
}

function dessinerEntete(doc: jsPDF, largeurPage: number, ctx: Contexte, titre: string) {
  couleur(doc, VINCI.bleu, 'fill')
  doc.rect(0, 0, largeurPage, ENTETE_H, 'F')
  const x = MARGE
  couleur(doc, VINCI.blanc, 'text')
  if (ctx.logo) {
    // Logo du profil de l'utilisateur, sur cartouche blanc
    const hLogo = 12
    const wLogo = Math.min(42, (ctx.logo.w / ctx.logo.h) * hLogo)
    const hReel = Math.min(hLogo, (ctx.logo.h / ctx.logo.w) * wLogo)
    couleur(doc, VINCI.blanc, 'fill')
    doc.roundedRect(x - 1.2, (ENTETE_H - hReel) / 2 - 1.2, wLogo + 2.4, hReel + 2.4, 0.8, 0.8, 'F')
    doc.addImage(ctx.logo.data, 'PNG', x, (ENTETE_H - hReel) / 2, wLogo, hReel, undefined, 'FAST')
  } else if (ctx.profil?.nomSociete) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const nom = doc.splitTextToSize(texte(ctx.profil.nomSociete), Math.max(20, largeurPage / 2 - x - 45))[0] ?? ''
    doc.text(nom, x, ENTETE_H / 2 + 1.4)
  }
  // Titre + période au centre
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(texte(titre), largeurPage / 2, 8, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(texte(ctx.periode), largeurPage / 2, 13.5, { align: 'center' })
  // Projet à droite
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  const projet = doc.splitTextToSize(texte(ctx.nomProjet), Math.min(80, largeurPage / 2 - 50))
  doc.text(projet.slice(0, 2), largeurPage - MARGE, projet.length > 1 ? 8 : ENTETE_H / 2 + 1.4, { align: 'right' })
}

function dessinerPied(doc: jsPDF, largeurPage: number, hauteurPage: number, page: number, total: number) {
  const y = hauteurPage - 9
  couleur(doc, VINCI.grisBordure, 'draw')
  doc.setLineWidth(0.2)
  doc.line(MARGE, y, largeurPage - MARGE, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  couleur(doc, VINCI.bleuFonce, 'text')
  doc.text(texte(`Journal du chantier - Frise chronologique - édité le ${formatDateFR(new Date())}`), MARGE, y + 4)
  couleur(doc, VINCI.gris, 'text')
  doc.text(`Page ${page} / ${total}`, largeurPage - MARGE, y + 4, { align: 'right' })
}

function dessinerLegende(doc: jsPDF, lignes: LigneLegende[]) {
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  couleur(doc, VINCI.bleu, 'text')
  doc.text('Légende :', MARGE, LEGENDE_Y + 3)
  doc.setFont('helvetica', 'normal')
  lignes.forEach((ligne, i) => {
    const y = LEGENDE_Y + i * LEGENDE_LIGNE
    for (const { item, x } of ligne.items) {
      couleur(doc, item.couleurBg, 'fill')
      couleur(doc, item.couleurBorder, 'draw')
      doc.setLineWidth(0.3)
      doc.roundedRect(x, y, 4.5, 3.6, 0.6, 0.6, 'FD')
      couleur(doc, item.couleurPoint, 'fill')
      doc.circle(x + 2.25, y + 1.8, 0.9, 'F')
      couleur(doc, VINCI.noir, 'text')
      doc.text(texte(item.nom), x + 6, y + 2.9)
    }
  })
}

// ---------------------------------------------------------------------------
// Génération
// ---------------------------------------------------------------------------

export type LigneJournal = {
  /** 'AAAA-MM-JJ' */
  jour: string
  titre: string
  description: string | null
  categorie: string
  couleurs: CouleursCategorie
  piecesJointes: string[]
}

/** Période listée dans le tableau du journal (avant les événements). */
export type LignePeriode = {
  titre: string
  /** sous-titre affiché (saisi ou automatique) */
  sousTitre: string
  /** 'AAAA-MM-JJ' */
  debut: string
  fin: string
  couleur: string
}

type Colonne = { titre: string; l: number }
type Cellule = { lignes: string[]; gras?: boolean; couleurTexte?: string; pastille?: (x: number, y: number) => void }

const PAD = 1.6
const INTER = 3.6 // interligne (mm) en 8 pt
const HAUT_TABLE = ENTETE_H + 8
const BAS_TABLE = PIED_Y - 3
const LARGEUR_TABLE = A4_L - 2 * MARGE

/**
 * Tableaux paysage du journal : d'abord les périodes de la plage (si présentes), puis les
 * événements cochés « Frise ». Même style que les autres tableaux VINCI (en-tête bleu,
 * lignes alternées, pied bleu foncé) ; l'en-tête de colonnes est répété à chaque saut de page.
 */
function dessinerTableauJournal(doc: jsPDF, ctx: Contexte, lignes: LigneJournal[], periodes: LignePeriode[], portraits: boolean[]) {
  let y = 0
  let pageOuverte = false

  const nouvellePage = () => {
    doc.addPage('a4', 'landscape')
    portraits.push(false)
    dessinerEntete(doc, A4_L, ctx, 'Journal du chantier')
    pageOuverte = true
    return HAUT_TABLE
  }

  const enteteColonnes = (cols: Colonne[]) => {
    couleur(doc, VINCI.bleu, 'fill')
    doc.rect(MARGE, y, LARGEUR_TABLE, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    couleur(doc, VINCI.blanc, 'text')
    let x = MARGE
    for (const c of cols) {
      doc.text(texte(c.titre), x + PAD, y + 4.7)
      x += c.l
    }
    y += 7
  }

  /** Titre de section (bleu VINCI, au-dessus d'un tableau). */
  const titreSection = (libelle: string) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    couleur(doc, VINCI.bleu, 'text')
    doc.text(texte(libelle), MARGE, y + 4)
    couleur(doc, VINCI.rouge, 'draw')
    doc.setLineWidth(0.6)
    doc.line(MARGE, y + 5.6, MARGE + 14, y + 5.6)
    y += 8
  }

  const tableau = (section: string, cols: Colonne[], rangs: Cellule[][], pied: string) => {
    // section : titre + en-tête + au moins une ligne sur la même page
    if (!pageOuverte || y + 8 + 7 + 12 > BAS_TABLE) y = nouvellePage()
    titreSection(section)
    enteteColonnes(cols)
    rangs.forEach((cells, i) => {
      const nb = Math.max(1, ...cells.map((c) => c.lignes.length))
      const h = nb * INTER + 2 * PAD + 0.6
      if (y + h > BAS_TABLE) {
        y = nouvellePage()
        enteteColonnes(cols)
      }
      couleur(doc, i % 2 ? VINCI.grisClair : VINCI.blanc, 'fill')
      doc.rect(MARGE, y, LARGEUR_TABLE, h, 'F')
      couleur(doc, VINCI.grisBordure, 'draw')
      doc.setLineWidth(0.15)
      doc.line(MARGE, y + h, MARGE + LARGEUR_TABLE, y + h)
      const yTexte = y + PAD + 2.7
      let x = MARGE
      cells.forEach((c, k) => {
        doc.setFontSize(8)
        doc.setFont('helvetica', c.gras ? 'bold' : 'normal')
        couleur(doc, c.couleurTexte ?? VINCI.noir, 'text')
        if (c.pastille) c.pastille(x + PAD, yTexte)
        doc.text(c.lignes, x + PAD + (c.pastille ? 4.6 : 0), yTexte, { lineHeightFactor: 1.6 })
        x += cols[k].l
      })
      y += h
    })
    if (y + 7 > BAS_TABLE) y = nouvellePage()
    couleur(doc, VINCI.bleuFonce, 'fill')
    doc.rect(MARGE, y, LARGEUR_TABLE, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    couleur(doc, VINCI.blanc, 'text')
    doc.text(texte(pied), MARGE + PAD, y + 4.7)
    y += 7 + 6
  }

  const decouper = (s: string, largeur: number, gras = false) => {
    doc.setFontSize(8)
    doc.setFont('helvetica', gras ? 'bold' : 'normal')
    return doc.splitTextToSize(texte(s), largeur - 2 * PAD) as string[]
  }

  // 1. Périodes de la plage
  if (periodes.length > 0) {
    const cols: Colonne[] = [
      { titre: 'Période', l: 92 },
      { titre: 'Détail', l: 0 },
      { titre: 'Du', l: 22 },
      { titre: 'Au', l: 22 },
      { titre: 'Durée', l: 26 },
    ]
    cols[1].l = LARGEUR_TABLE - cols.reduce((t, c) => t + c.l, 0)
    const rangs: Cellule[][] = periodes.map((p) => {
      const c = couleursPeriode(p.couleur)
      return [
        {
          lignes: decouper(p.titre.toLocaleUpperCase('fr-FR'), cols[0].l - 4.6, true),
          gras: true,
          couleurTexte: VINCI.bleuFonce,
          pastille: (x, yT) => {
            couleur(doc, c.fond, 'fill')
            couleur(doc, c.bordure, 'draw')
            doc.setLineWidth(0.4)
            doc.roundedRect(x, yT - 2.6, 3.2, 3.2, 0.8, 0.8, 'FD')
          },
        },
        { lignes: decouper(p.sousTitre || '-', cols[1].l) },
        { lignes: [jourFR(p.debut)] },
        { lignes: [jourFR(p.fin)] },
        { lignes: [texte(dureeLisible(p.debut, p.fin))], couleurTexte: VINCI.texteSecondaire },
      ]
    })
    tableau('Périodes', cols, rangs, `${periodes.length} période${periodes.length > 1 ? 's' : ''} sur la plage exportée`)
  }

  // 2. Événements
  if (lignes.length > 0) {
    const cols: Colonne[] = [
      { titre: 'Date', l: 22 },
      { titre: 'Catégorie', l: 34 },
      { titre: 'Événement', l: 70 },
      { titre: 'Description', l: 0 },
      { titre: 'Pièces jointes', l: 40 },
    ]
    cols[3].l = LARGEUR_TABLE - cols.reduce((t, c) => t + c.l, 0)
    const rangs: Cellule[][] = lignes.map((l) => [
      { lignes: [jourFR(l.jour)] },
      {
        lignes: decouper(l.categorie || 'Sans catégorie', cols[1].l - 4),
        pastille: (x, yT) => {
          couleur(doc, l.couleurs.couleurBg, 'fill')
          couleur(doc, l.couleurs.couleurBorder, 'draw')
          doc.setLineWidth(0.3)
          doc.roundedRect(x, yT - 2.6, 3.2, 3.2, 0.5, 0.5, 'FD')
          couleur(doc, l.couleurs.couleurPoint, 'fill')
          doc.circle(x + 1.6, yT - 1, 0.7, 'F')
        },
      },
      { lignes: decouper(l.titre, cols[2].l, true), gras: true, couleurTexte: VINCI.bleuFonce },
      { lignes: l.description ? decouper(l.description, cols[3].l) : ['-'] },
      { lignes: l.piecesJointes.length ? decouper(l.piecesJointes.join(', '), cols[4].l) : ['-'], couleurTexte: VINCI.texteSecondaire },
    ])
    tableau('Événements', cols, rangs, `${lignes.length} événement${lignes.length > 1 ? 's' : ''} sur la période`)
  }
}

export type ImageJointe = { jour: string; titreEvenement: string; nom: string; dataUrl: string }

export type ParametresExport = {
  noeud: HTMLElement
  miseEnPage: MiseEnPageFrise
  nomProjet: string
  nomFichierProjet: string
  profil: ProfilSociete | null
  /** 'AAAA-MM-JJ' */
  debut: string
  fin: string
  chargerImages: () => Promise<ImageJointe[]>
  /** lignes du tableau du journal (événements cochés « Frise » de la période) */
  journal: LigneJournal[]
  /** périodes affichées qui intersectent la plage (tableau « Périodes » avant les événements) */
  periodes?: LignePeriode[]
}

export async function genererFrisePDF(p: ParametresExport) {
  const { disposition: d, plan } = p.miseEnPage
  const zoneHaut = p.miseEnPage.zoneHaut
  const zone = p.miseEnPage.zone

  // 1. Capture — échelle plafonnée (surface ≤ ~16,7 Mpx)
  const largeurPx = p.noeud.offsetWidth
  const hauteurPx = p.noeud.offsetHeight
  const echelleSouhaitee = Math.min(3, Math.max(1, (plan.echelle * DPI_CIBLE) / 25.4))
  const echelleMaxSurface = Math.sqrt(SURFACE_MAX_CANVAS / Math.max(1, largeurPx * hauteurPx))
  const echelleCanvas = Math.max(0.1, Math.min(echelleSouhaitee, echelleMaxSurface))
  if (document.fonts?.ready) await document.fonts.ready
  // Tailwind (preflight) met les <img> en display:block : cela fausse la mesure de la ligne de base
  // du texte faite par html2canvas (texte décalé d'une demi-ligne vers le bas et rogné par les bulles).
  // On rétablit le comportement par défaut des images le temps de la capture uniquement.
  const correctif = document.createElement('style')
  correctif.textContent = 'img { display: inline !important; vertical-align: baseline !important; }'
  document.head.appendChild(correctif)
  let canvas: HTMLCanvasElement
  try {
    canvas = await html2canvas(p.noeud, {
      scale: echelleCanvas,
      backgroundColor: VINCI.blanc,
      logging: false,
      useCORS: true,
      windowWidth: Math.max(window.innerWidth, largeurPx),
      windowHeight: Math.max(window.innerHeight, hauteurPx),
    })
  } finally {
    correctif.remove()
  }


  // 2. Document
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  let logo: Contexte['logo'] = null
  if (p.profil?.logoSociete) {
    try {
      logo = await reencoder(p.profil.logoSociete, 'PNG', 400)
    } catch {
      logo = null
    }
  }
  const ctx: Contexte = {
    nomProjet: p.nomProjet,
    profil: p.profil,
    logo,
    periode: `Période du ${jourFR(p.debut)} au ${jourFR(p.fin)}`,
  }

  // 3. Pages de frise : découpe entre les bulles, même échelle partout
  const coupes = plan.coupes
  const hauteurMm = d.hauteurTotale * plan.echelle
  const yFrise = zoneHaut + Math.max(0, (zone.hauteur - hauteurMm) / 2)
  const nbPagesFrise = coupes.length - 1
  const portraits: boolean[] = []
  for (let i = 0; i < nbPagesFrise; i++) {
    if (i > 0) doc.addPage('a4', 'landscape')
    portraits.push(false)
    dessinerEntete(doc, A4_L, ctx, 'Frise chronologique')
    dessinerLegende(doc, p.miseEnPage.legende)
    const x0 = coupes[i] - coupes[0]
    const largeurTranchePx = coupes[i + 1] - coupes[i]
    const sx = Math.round(x0 * echelleCanvas)
    const sw = Math.max(1, Math.min(canvas.width - sx, Math.round(largeurTranchePx * echelleCanvas)))
    const tranche = document.createElement('canvas')
    tranche.width = sw
    tranche.height = canvas.height
    const tctx = tranche.getContext('2d')!
    tctx.fillStyle = VINCI.blanc
    tctx.fillRect(0, 0, sw, canvas.height)
    tctx.drawImage(canvas, sx, 0, sw, canvas.height, 0, 0, sw, canvas.height)
    const largeurMm = largeurTranchePx * plan.echelle
    const xPage = nbPagesFrise === 1 ? MARGE + Math.max(0, (zone.largeur - largeurMm) / 2) : MARGE
    // JPEG compressé, jamais PNG
    doc.addImage(tranche.toDataURL('image/jpeg', QUALITE_JPEG), 'JPEG', xPage, yFrise, largeurMm, hauteurMm, undefined, 'FAST')
    tranche.width = 0
    tranche.height = 0
  }
  canvas.width = 0
  canvas.height = 0

  // 4. Tableaux du journal : périodes de la plage puis événements cochés « Frise »
  const periodes = p.periodes ?? []
  if (p.journal.length > 0 || periodes.length > 0) dessinerTableauJournal(doc, ctx, p.journal, periodes, portraits)

  // 5. Pièces jointes images de la période : pages portrait
  const images = await p.chargerImages()
  for (const im of images) {
    let jpeg: Awaited<ReturnType<typeof reencoder>>
    try {
      jpeg = await reencoder(im.dataUrl, 'JPEG', 2200)
    } catch {
      continue
    }
    doc.addPage('a4', 'portrait')
    portraits.push(true)
    dessinerEntete(doc, A4_H, ctx, 'Pièces jointes')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    couleur(doc, VINCI.bleu, 'text')
    const legende = doc.splitTextToSize(texte(`${jourFR(im.jour)} - ${im.titreEvenement}`), A4_H - 2 * MARGE)
    doc.text(legende.slice(0, 2), MARGE, ENTETE_H + 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    couleur(doc, VINCI.texteSecondaire, 'text')
    const yNom = ENTETE_H + 8 + Math.min(2, legende.length) * 4.5
    doc.text(texte(im.nom), MARGE, yNom)
    const haut = yNom + 4
    const boiteL = A4_H - 2 * MARGE
    const boiteH = A4_L - 12 - haut
    const r = Math.min(boiteL / jpeg.w, boiteH / jpeg.h)
    const w = jpeg.w * r
    const h = jpeg.h * r
    doc.addImage(jpeg.data, 'JPEG', MARGE + (boiteL - w) / 2, haut, w, h, undefined, 'FAST')
  }

  // 6. Pieds de page (total connu)
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const portrait = portraits[i - 1] ?? false
    dessinerPied(doc, portrait ? A4_H : A4_L, portrait ? A4_L : A4_H, i, total)
  }

  // 7. Période dans le nom de fichier
  const blob = doc.output('blob')
  telechargerBlob(blob, `Frise_${p.nomFichierProjet}_${p.debut}_au_${p.fin}.pdf`)
}
