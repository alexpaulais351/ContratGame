'use client'
// Export Excel d'une situation de travaux (exceljs côté client) :
// onglet « Situation » (lignes DE + PN + ST + décompte), mise en forme VINCI.
import type { Borders, Cell, Fill, Worksheet } from 'exceljs'
import { telechargerBlob } from '@/hooks/useExportPDF'
import { VINCI } from '@/lib/design-tokens'
import { formatDateFR } from '@/lib/utils'
import type { ProfilSociete } from '@/stores/profil'
import { sousTotaux, type Totaux } from './calculs'
import type { PNCalcule } from './calculs-pn'
import type { DecompteSituation } from './decompte'
import type { LignePDFSituation, RecapSTLigne } from './types'

const argb = (hex: string) => 'FF' + hex.replace('#', '').toUpperCase()
const remplir = (hex: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } })
const bordure: Partial<Borders> = {
  top: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
  left: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
  bottom: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
  right: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
}
const FMT_EUR = '#,##0.00 "€"'
const FMT_QTE = '#,##0.00'
const FMT_PCT = '0.0" %"'

type Params = {
  nomProjet: string
  profil: ProfilSociete | null
  numero: number
  libelle: string
  periode: string
  statut: string
  lignes: LignePDFSituation[]
  totaux: Totaux
  prixNouveaux: PNCalcule[]
  totauxPN: { base: number; precedent: number; mois: number; cumul: number }
  recapST: RecapSTLigne[]
  decompte: DecompteSituation
}

type Col = { titre: string; largeur: number; fmt?: string }

function enTete(ws: Worksheet, ligne: number, cols: Col[]) {
  const r = ws.getRow(ligne)
  cols.forEach((c, i) => {
    const cell = r.getCell(i + 1)
    cell.value = c.titre
    cell.fill = remplir(VINCI.bleu)
    cell.font = { bold: true, color: { argb: argb(VINCI.blanc) } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = bordure
  })
  r.height = 30
}

function ligneDonnees(ws: Worksheet, ligne: number, valeurs: (string | number | null)[], cols: Col[], style: 'pair' | 'impair' | 'chapitre' | 'total') {
  const r = ws.getRow(ligne)
  valeurs.forEach((v, i) => {
    const cell: Cell = r.getCell(i + 1)
    cell.value = v
    cell.border = bordure
    if (cols[i]?.fmt && typeof v === 'number') cell.numFmt = cols[i].fmt!
    if (style === 'impair') cell.fill = remplir(VINCI.grisClair)
    if (style === 'chapitre') {
      cell.fill = remplir(VINCI.bleuTresClair)
      cell.font = { bold: true, color: { argb: argb(VINCI.bleuFonce) } }
    }
    if (style === 'total') {
      cell.fill = remplir(VINCI.bleuFonce)
      cell.font = { bold: true, color: { argb: argb(VINCI.blanc) } }
    }
    cell.alignment = { vertical: 'middle', wrapText: typeof v === 'string' }
  })
}

function titreSection(ws: Worksheet, ligne: number, texte: string, nbCols: number) {
  ws.mergeCells(ligne, 1, ligne, nbCols)
  const c = ws.getCell(ligne, 1)
  c.value = texte
  c.font = { bold: true, size: 12, color: { argb: argb(VINCI.bleu) } }
  c.border = { bottom: { style: 'medium', color: { argb: argb(VINCI.rouge) } } }
  ws.getRow(ligne).height = 20
}

export async function exporterSituationExcel(p: Params) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Contrat Game'
  wb.created = new Date()

  const ws = wb.addWorksheet(`Situation ${p.numero}`, {
    views: [{ state: 'frozen', ySplit: 5 }],
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })

  const cols: Col[] = [
    { titre: 'Code', largeur: 10 },
    { titre: 'Désignation', largeur: 44 },
    { titre: 'Unité', largeur: 7 },
    { titre: 'Qté marché', largeur: 11, fmt: FMT_QTE },
    { titre: 'PU', largeur: 12, fmt: FMT_EUR },
    { titre: 'Cumul préc.', largeur: 11, fmt: FMT_QTE },
    { titre: 'Qté mois', largeur: 11, fmt: FMT_QTE },
    { titre: 'Cumul', largeur: 11, fmt: FMT_QTE },
    { titre: '%', largeur: 8, fmt: FMT_PCT },
    { titre: 'Montant préc.', largeur: 15, fmt: FMT_EUR },
    { titre: 'Montant mois', largeur: 15, fmt: FMT_EUR },
    { titre: 'Montant cumulé', largeur: 15, fmt: FMT_EUR },
  ]
  const N = cols.length
  cols.forEach((c, i) => (ws.getColumn(i + 1).width = c.largeur))

  // Titre
  ws.mergeCells(1, 1, 1, N)
  const t = ws.getCell(1, 1)
  t.value = `SITUATION DE TRAVAUX N°${p.numero} — ${p.periode}`
  t.fill = remplir(VINCI.bleu)
  t.font = { bold: true, size: 14, color: { argb: argb(VINCI.blanc) } }
  t.alignment = { vertical: 'middle', indent: 1 }
  ws.getRow(1).height = 28
  ws.mergeCells(2, 1, 2, N)
  ws.getCell(2, 1).value = `Projet : ${p.nomProjet}${p.libelle ? ` · ${p.libelle}` : ''} · Statut : ${p.statut === 'validee' ? 'Validée' : p.statut === 'brouillon' ? 'Brouillon' : p.statut}`
  ws.mergeCells(3, 1, 3, N)
  ws.getCell(3, 1).value = `${p.profil?.nomSociete ? `${p.profil.nomSociete} · ` : ''}Édité le ${formatDateFR(new Date())}`
  ws.getCell(3, 1).font = { italic: true, color: { argb: argb(VINCI.texteSecondaire) } }

  // Lignes DE
  let r = 5
  enTete(ws, r, cols)
  const st = sousTotaux(p.lignes)
  let alt = 0
  for (const l of p.lignes) {
    r++
    if (l.estChapitre) {
      const s = st.get(l.id)
      ligneDonnees(ws, r, [l.code, l.designation, '', null, null, null, null, null, s ? s.pourcent : null, s?.precedent ?? null, s?.mois ?? null, s?.cumul ?? null], cols, 'chapitre')
      alt = 0
    } else {
      ligneDonnees(
        ws,
        r,
        [l.code, l.designation, l.unite, l.quantite, l.prixUnitaire, l.cumulPrecedent, l.qteMois, l.cumul, l.pourcent, l.montantPrecedent, l.montantMois, l.montantCumul],
        cols,
        alt++ % 2 === 1 ? 'impair' : 'pair',
      )
    }
  }
  r++
  ligneDonnees(ws, r, ['', 'TOTAL TRAVAUX DU MARCHÉ', '', null, null, null, null, null, p.totaux.pourcent, p.totaux.precedent, p.totaux.mois, p.totaux.cumul], cols, 'total')
  ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: r - 1, column: N } }

  // Prix nouveaux
  if (p.prixNouveaux.length > 0) {
    r += 2
    titreSection(ws, r, 'Prix nouveaux — OS reçus', N)
    r++
    const cp: Col[] = [
      { titre: 'N°', largeur: 0 },
      { titre: 'Intitulé', largeur: 0 },
      { titre: 'N° OS', largeur: 0 },
      { titre: 'Date OS', largeur: 0 },
      { titre: 'Montant', largeur: 0, fmt: FMT_EUR },
      { titre: 'Base', largeur: 0 },
      { titre: '% préc.', largeur: 0, fmt: FMT_PCT },
      { titre: '% cumulé', largeur: 0, fmt: FMT_PCT },
      { titre: '', largeur: 0 },
      { titre: 'Montant préc.', largeur: 0, fmt: FMT_EUR },
      { titre: 'Montant mois', largeur: 0, fmt: FMT_EUR },
      { titre: 'Montant cumulé', largeur: 0, fmt: FMT_EUR },
    ]
    enTete(ws, r, cp)
    p.prixNouveaux.forEach((pn, i) => {
      r++
      ligneDonnees(
        ws,
        r,
        [pn.numero, pn.intitule, pn.numeroOS ?? '', pn.dateOS ? pn.dateOS.split('-').reverse().join('/') : '', pn.montantBase, pn.accepte ? 'accepté' : 'présenté', pn.avancementPrecedent, pn.avancement, '', pn.montantPrecedent, pn.montantMois, pn.montantCumul],
        cp,
        i % 2 === 1 ? 'impair' : 'pair',
      )
    })
    r++
    ligneDonnees(ws, r, ['', 'TOTAL PRIX NOUVEAUX', '', '', p.totauxPN.base, '', null, null, '', p.totauxPN.precedent, p.totauxPN.mois, p.totauxPN.cumul], cp, 'total')
  }

  // Sous-traitants
  if (p.recapST.length > 0) {
    r += 2
    titreSection(ws, r, 'Sous-traitants', N)
    r++
    const cs: Col[] = [
      { titre: 'Sous-traitant', largeur: 0 },
      { titre: '', largeur: 0 },
      { titre: 'PD', largeur: 0 },
      { titre: 'Montant total', largeur: 0, fmt: FMT_EUR },
      { titre: '', largeur: 0 },
      { titre: 'Cumul préc.', largeur: 0, fmt: FMT_EUR },
      { titre: 'Facturé du mois', largeur: 0, fmt: FMT_EUR },
      { titre: 'Cumul facturé', largeur: 0, fmt: FMT_EUR },
      { titre: '%', largeur: 0, fmt: FMT_PCT },
      { titre: 'Reste à facturer', largeur: 0, fmt: FMT_EUR },
    ]
    enTete(ws, r, cs)
    ws.mergeCells(r, 1, r, 2)
    p.recapST.forEach((s, i) => {
      r++
      ligneDonnees(ws, r, [s.nom, '', s.paiementDirect ? 'oui' : 'non', s.montantTotal, '', s.cumulPrecedent, s.factureMois, s.cumule, s.pourcent, s.reste], cs, i % 2 === 1 ? 'impair' : 'pair')
      ws.mergeCells(r, 1, r, 2)
    })
    const tot = p.recapST.reduce(
      (a, s) => ({ total: a.total + s.montantTotal, prec: a.prec + s.cumulPrecedent, mois: a.mois + s.factureMois, cumul: a.cumul + s.cumule, reste: a.reste + s.reste }),
      { total: 0, prec: 0, mois: 0, cumul: 0, reste: 0 },
    )
    r++
    ligneDonnees(ws, r, ['TOTAL SOUS-TRAITANTS', '', '', tot.total, '', tot.prec, tot.mois, tot.cumul, tot.total > 0 ? (tot.cumul / tot.total) * 100 : null, tot.reste], cs, 'total')
    ws.mergeCells(r, 1, r, 2)
  }

  // Décompte
  r += 2
  titreSection(ws, r, 'Décompte de la situation (HT)', N)
  r++
  const cd: Col[] = [
    { titre: 'Montants HT', largeur: 0 },
    { titre: '', largeur: 0 },
    { titre: 'Du mois', largeur: 0, fmt: FMT_EUR },
    { titre: 'Cumulé', largeur: 0, fmt: FMT_EUR },
  ]
  const ecrireDecompte = (lib: string, m: number, c: number, style: 'pair' | 'impair' | 'chapitre' | 'total') => {
    ligneDonnees(ws, r, [lib, '', m, c], cd, style)
    ws.mergeCells(r, 1, r, 2)
  }
  enTete(ws, r, cd)
  ws.mergeCells(r, 1, r, 2)
  const d = p.decompte
  r++; ecrireDecompte('Travaux du marché', p.totaux.mois, p.totaux.cumul, 'pair')
  r++; ecrireDecompte('Prix nouveaux (OS reçus)', p.totauxPN.mois, p.totauxPN.cumul, 'impair')
  r++; ecrireDecompte('Total travaux', d.mois, d.cumul, 'chapitre')
  r++; ecrireDecompte('dont sous-traitants en paiement direct', -d.stPaiementDirectMois, -d.stPaiementDirectCumul, 'impair')
  r++; ecrireDecompte("Montant revenant à l'entreprise", d.titulaireMois, d.titulaireCumul, 'total')

  const buf = await wb.xlsx.writeBuffer()
  const nom = `Situation_${p.numero}_${p.periode}_${p.nomProjet}`.replace(/[^\p{L}\p{N}_-]+/gu, '_')
  telechargerBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nom}.xlsx`)
}
