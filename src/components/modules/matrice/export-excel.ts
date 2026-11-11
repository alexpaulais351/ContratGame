'use client'
// Export Excel de la matrice Bid Comp (exceljs côté client) :
// onglet « Bid Comp » (grille complète) + onglet « Sélection RMS » (synthèse).
import type { Borders, Cell, Fill, Worksheet } from 'exceljs'
import { telechargerBlob } from '@/hooks/useExportPDF'
import { COULEURS_NC, DECISIONS, LIBELLES_NOTES, STATUTS_MATRICE, lireMontant } from '@/lib/matrice-bidcomp'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import { formatDateFR } from '@/lib/utils'
import { analyserMatrice, cleNotation, grouperParSection, symboleDevise } from './grille'
import type { MatriceVue } from './types'

const argb = (hex: string) => 'FF' + hex.replace('#', '').toUpperCase()
const remplir = (hex: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } })
const bordureFine: Partial<Borders> = {
  top: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
  left: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
  bottom: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
  right: { style: 'thin', color: { argb: argb(VINCI.grisBordure) } },
}
const bordureForte = (hex: string): Partial<Borders> => ({
  top: { style: 'medium', color: { argb: argb(hex) } },
  left: { style: 'medium', color: { argb: argb(hex) } },
  bottom: { style: 'medium', color: { argb: argb(hex) } },
  right: { style: 'medium', color: { argb: argb(hex) } },
})

function enTeteVinci(c: Cell) {
  c.fill = remplir(VINCI.bleu)
  c.font = { bold: true, color: { argb: argb(VINCI.blanc) } }
  c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  c.border = bordureFine
}

function ligneTitre(ws: Worksheet, texte: string, nbCols: number, sousTitre?: string) {
  ws.mergeCells(1, 1, 1, nbCols)
  const t = ws.getCell(1, 1)
  t.value = texte
  t.fill = remplir(VINCI.bleu)
  t.font = { bold: true, size: 14, color: { argb: argb(VINCI.blanc) } }
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 28
  if (sousTitre) {
    ws.mergeCells(2, 1, 2, nbCols)
    const s = ws.getCell(2, 1)
    s.value = sousTitre
    s.font = { italic: true, color: { argb: argb(VINCI.texteSecondaire) } }
  }
}

export async function exporterMatriceExcel(m: MatriceVue, nomProjet: string, nomFichier: string) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Conduc Rail'
  wb.created = new Date()

  const a = analyserMatrice(m)
  const F = m.fournisseurs
  const nbCols = 2 + Math.max(F.length, 1)
  const fmtMontant = `#,##0.00 "${symboleDevise(m.devise)}"`
  const statut = STATUTS_MATRICE.find((s) => s.value === m.statut)?.label ?? m.statut

  // ───────────── Onglet 1 : Bid Comp ─────────────
  const ws = wb.addWorksheet('Bid Comp', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 0 }],
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  ws.getColumn(1).width = 46
  ws.getColumn(2).width = 8
  F.forEach((_, i) => (ws.getColumn(3 + i).width = 24))
  ligneTitre(ws, `MATRICE DÉCISIONNELLE D'OFFRES FOURNISSEURS — ${m.titre}`, nbCols, `Projet : ${nomProjet} · Édité le ${formatDateFR(new Date())}`)

  // En-tête (paires libellé / valeur sur 2 colonnes)
  const infos: [string, string | number | null][] = [
    ['Acheteur', m.acheteur],
    ['Site', m.site],
    ["Famille d'achats", m.familleAchats],
    ["Typologie d'achat", m.bidComp.typologieAchat],
    ['Budget théorique (HT)', m.budgetTheorique],
    ['Devise', m.devise],
    ['Seuil GO', `${m.seuilGo} %`],
    ['Statut', statut],
    ["Date d'établissement", m.bidComp.dateEtablissement ? formatDateFR(m.bidComp.dateEtablissement) : ''],
  ]
  let r = 4
  for (const [lib, val] of infos) {
    const cl = ws.getCell(r, 1)
    cl.value = lib
    cl.font = { bold: true, color: { argb: argb(VINCI.bleuFonce) } }
    cl.fill = remplir(VINCI.bleuTresClair)
    cl.border = bordureFine
    const cv = ws.getCell(r, 2)
    ws.mergeCells(r, 2, r, nbCols)
    cv.value = val ?? ''
    cv.border = bordureFine
    if (lib.startsWith('Budget') && typeof val === 'number') cv.numFmt = fmtMontant
    cv.alignment = { horizontal: 'left' }
    r++
  }
  r++

  // Ligne d'en-tête de la grille
  const hdr = ws.getRow(r)
  hdr.values = ['Critère', 'Coef.', ...F.map((f, i) => `${i + 1}. ${f.nom}`)]
  hdr.height = 30
  for (let c = 1; c <= nbCols; c++) enTeteVinci(ws.getCell(r, c))
  ws.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.views = [{ state: 'frozen', xSplit: 2, ySplit: r }]
  r++

  let alt = false
  const ligneDonnees = (libelle: string, coef: string | number, valeurs: ((cell: Cell, i: number) => void) | null) => {
    const fond = alt ? VINCI.grisClair : VINCI.blanc
    alt = !alt
    const c1 = ws.getCell(r, 1)
    c1.value = libelle
    c1.alignment = { wrapText: true, vertical: 'middle', indent: 1 }
    const c2 = ws.getCell(r, 2)
    c2.value = coef
    c2.alignment = { horizontal: 'center', vertical: 'middle' }
    for (let c = 1; c <= nbCols; c++) {
      const cell = ws.getCell(r, c)
      cell.fill = remplir(fond)
      cell.border = bordureFine
      cell.font = { size: 10 }
    }
    if (valeurs) F.forEach((_, i) => {
      const cell = ws.getCell(r, 3 + i)
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      valeurs(cell, i)
    })
    r++
  }

  for (const s of grouperParSection(m.criteres)) {
    // Ligne de section
    for (let c = 1; c <= nbCols; c++) {
      const cell = ws.getCell(r, c)
      cell.fill = remplir(VINCI.bleuClair)
      cell.font = { bold: true, color: { argb: argb(VINCI.blanc) } }
      cell.border = bordureFine
    }
    ws.getCell(r, 1).value = s.libelle.toUpperCase()
    ws.getCell(r, 1).alignment = { indent: 1 }
    r++
    alt = false

    if (s.cle === 'offre') {
      ligneDonnees('Réf. offre', '', (cell, i) => (cell.value = F[i].refOffre ?? ''))
      ligneDonnees("Date de l'offre", '', (cell, i) => (cell.value = F[i].dateOffre ? formatDateFR(F[i].dateOffre) : ''))
      ligneDonnees('Pays de fabrication', '', (cell, i) => (cell.value = F[i].paysFabrication ?? ''))
      ligneDonnees('Incoterm', '', (cell, i) => (cell.value = F[i].incoterm ?? ''))
      ligneDonnees("Montant de l'offre (HT)", '', (cell, i) => {
        cell.value = F[i].montantOffre ?? ''
        cell.numFmt = fmtMontant
        cell.font = { bold: true, size: 10 }
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
      })
      ligneDonnees('Décision', '', (cell, i) => {
        const d = DECISIONS[F[i].decision]
        cell.value = d.label
        cell.fill = remplir(d.couleur)
        cell.font = { bold: true, size: 10, color: { argb: argb(F[i].decision === 'en_attente' ? VINCI.noir : VINCI.blanc) } }
      })
    }

    for (const c of s.criteres) {
      ligneDonnees(c.libelle, c.type === 'note_1_3' ? c.coefficient : '', (cell, i) => {
        const n = a.index.get(cleNotation(c.id, F[i].id))
        if (!n) return
        switch (c.type) {
          case 'note_1_3':
            cell.value = n.note ?? ''
            if (n.note) cell.font = { bold: true, size: 10, color: { argb: argb(n.note === 1 ? VINCI.rouge : n.note === 3 ? VINCI_SECONDAIRE.vert.base : VINCI.noir) } }
            break
          case 'booleen':
            cell.value = n.valeurBool === null ? '' : n.valeurBool ? 'Oui' : 'Non'
            break
          case 'montant': {
            const v = lireMontant(n.valeurTexte)
            cell.value = v ?? ''
            cell.numFmt = fmtMontant
            cell.alignment = { horizontal: 'right', vertical: 'middle' }
            break
          }
          default:
            cell.value = n.valeurTexte ?? ''
        }
        if (n.estNonConformiteMajeure) {
          cell.fill = remplir(COULEURS_NC.majeure.fond)
          cell.border = bordureForte(COULEURS_NC.majeure.bordure)
        } else if (n.estNonConformiteNegociable) {
          cell.fill = remplir(COULEURS_NC.negociable.fond)
          cell.border = bordureForte(COULEURS_NC.negociable.bordure)
        }
        const notes = [
          n.estNonConformiteMajeure ? 'NON-CONFORMITÉ MAJEURE' : n.estNonConformiteNegociable ? 'Non-conformité négociable' : '',
          n.commentaire ?? '',
        ].filter(Boolean)
        if (notes.length) cell.note = notes.join('\n')
      })
    }

    if (s.avecSousTotal && s.criteres.length) {
      for (let c = 1; c <= nbCols; c++) {
        const cell = ws.getCell(r, c)
        cell.fill = remplir(VINCI.bleuTresClair)
        cell.font = { bold: true, color: { argb: argb(VINCI.bleuFonce) } }
        cell.border = bordureFine
      }
      ws.getCell(r, 1).value = `Sous-total ${s.libelle.toLowerCase()}`
      ws.getCell(r, 1).alignment = { indent: 1 }
      F.forEach((f, i) => {
        const cell = ws.getCell(r, 3 + i)
        cell.value = a.sousTotaux.get(s.cle)?.get(f.id) ?? ''
        cell.numFmt = fmtMontant
      })
      r++
    }
  }

  // Pied : scores
  const pied = (libelle: string, coef: string, valeur: (i: number, cell: Cell) => void) => {
    for (let c = 1; c <= nbCols; c++) {
      const cell = ws.getCell(r, c)
      cell.fill = remplir(VINCI.bleuFonce)
      cell.font = { bold: true, color: { argb: argb(VINCI.blanc) } }
      cell.border = bordureFine
      cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle', indent: c === 1 ? 1 : 0 }
    }
    ws.getCell(r, 1).value = libelle
    ws.getCell(r, 2).value = coef
    F.forEach((_, i) => valeur(i, ws.getCell(r, 3 + i)))
    r++
  }
  pied('Score total pondéré', `/${a.maximum}`, (i, c) => (c.value = a.scores.get(F[i].id)?.total ?? 0))
  pied('Score normalisé', `≥${m.seuilGo}%`, (i, c) => {
    c.value = (a.scores.get(F[i].id)?.pourcentage ?? 0) / 100
    c.numFmt = '0.0%'
  })
  pied('Classement', '', (i, c) => {
    const s = a.scores.get(F[i].id)
    c.value = s ? s.classement : ''
    if (a.meilleurId === F[i].id) {
      c.fill = remplir(VINCI.blanc)
      c.font = { bold: true, color: { argb: argb(VINCI.bleuFonce) } }
    }
  })
  pied('Décision suggérée', '', (i, c) => {
    const d = a.scores.get(F[i].id)?.decisionSuggeree ?? 'en_attente'
    c.value = DECISIONS[d].label
  })

  // Synthèse
  r++
  for (const [lib, val, couleur] of [
    ['Opportunités', m.bidComp.synthese.opportunites, VINCI_SECONDAIRE.vert.base],
    ['Risques', m.bidComp.synthese.risques, VINCI.rouge],
    [
      'Recommandation',
      [F.find((f) => f.id === m.bidComp.fournisseurRecommandeId)?.nom ? `Fournisseur recommandé : ${F.find((f) => f.id === m.bidComp.fournisseurRecommandeId)!.nom}` : '', m.bidComp.synthese.recommandation]
        .filter(Boolean)
        .join('\n'),
      VINCI.bleu,
    ],
  ] as const) {
    const cl = ws.getCell(r, 1)
    cl.value = lib
    cl.font = { bold: true, color: { argb: argb(VINCI.blanc) } }
    cl.fill = remplir(couleur)
    cl.alignment = { vertical: 'top', indent: 1 }
    cl.border = bordureFine
    ws.mergeCells(r, 2, r, nbCols)
    const cv = ws.getCell(r, 2)
    cv.value = val
    cv.alignment = { wrapText: true, vertical: 'top' }
    cv.border = bordureFine
    ws.getRow(r).height = Math.min(300, Math.max(30, 15 * (val.split('\n').length + Math.floor(val.length / 110))))
    r++
  }

  // ───────────── Onglet 2 : Sélection RMS ─────────────
  const rs = wb.addWorksheet('Sélection RMS', { pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } })
  const colonnes: { titre: string; largeur: number }[] = [
    { titre: 'Rang', largeur: 8 },
    { titre: 'Fournisseur', largeur: 30 },
    { titre: 'Réf. offre', largeur: 16 },
    { titre: 'Pays', largeur: 14 },
    { titre: 'Incoterm', largeur: 10 },
    { titre: 'Montant offre (HT)', largeur: 18 },
    { titre: 'Écart / budget', largeur: 16 },
    { titre: 'Score pondéré', largeur: 13 },
    { titre: 'Score normalisé', largeur: 13 },
    { titre: 'NC majeures', largeur: 11 },
    { titre: 'NC négociables', largeur: 12 },
    { titre: 'Décision suggérée', largeur: 15 },
    { titre: 'Décision', largeur: 13 },
  ]
  colonnes.forEach((c, i) => (rs.getColumn(i + 1).width = c.largeur))
  ligneTitre(rs, `SÉLECTION — ${m.titre}`, colonnes.length, `Projet : ${nomProjet} · ${m.bidComp.typologieAchat} · ${m.familleAchats ?? ''}`)
  let l = 4
  const synth: [string, string | number | null][] = [
    ['Acheteur', m.acheteur],
    ['Site', m.site],
    ['Budget théorique (HT)', m.budgetTheorique],
    ['Seuil GO', `${m.seuilGo} %`],
  ]
  for (const [lib, val] of synth) {
    const a1 = rs.getCell(l, 1)
    rs.mergeCells(l, 1, l, 2)
    a1.value = lib
    a1.font = { bold: true, color: { argb: argb(VINCI.bleuFonce) } }
    a1.fill = remplir(VINCI.bleuTresClair)
    a1.border = bordureFine
    rs.mergeCells(l, 3, l, 6)
    const v = rs.getCell(l, 3)
    v.value = val ?? ''
    v.border = bordureFine
    v.alignment = { horizontal: 'left' }
    if (typeof val === 'number') v.numFmt = fmtMontant
    l++
  }
  l++
  const h = rs.getRow(l)
  h.values = colonnes.map((c) => c.titre)
  h.height = 30
  colonnes.forEach((_, i) => enTeteVinci(rs.getCell(l, i + 1)))
  l++
  const tries = [...F].sort((x, y) => (a.scores.get(x.id)?.classement ?? 99) - (a.scores.get(y.id)?.classement ?? 99))
  tries.forEach((f, k) => {
    const s = a.scores.get(f.id)
    const ecart = f.montantOffre != null && m.budgetTheorique ? f.montantOffre - m.budgetTheorique : null
    const row = rs.getRow(l)
    row.values = [
      s?.classement ?? '',
      f.nom,
      f.refOffre ?? '',
      f.paysFabrication ?? '',
      f.incoterm ?? '',
      f.montantOffre ?? '',
      ecart ?? '',
      s?.total ?? 0,
      (s?.pourcentage ?? 0) / 100,
      s?.nbNcMajeures ?? 0,
      s?.nbNcNegociables ?? 0,
      DECISIONS[s?.decisionSuggeree ?? 'en_attente'].label,
      DECISIONS[f.decision].label,
    ]
    const recommande = f.id === m.bidComp.fournisseurRecommandeId
    colonnes.forEach((_, i) => {
      const c = rs.getCell(l, i + 1)
      c.border = bordureFine
      c.fill = remplir(recommande ? VINCI.bleuTresClair : k % 2 ? VINCI.grisClair : VINCI.blanc)
      c.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : 'center' }
      if (recommande) c.font = { bold: true, color: { argb: argb(VINCI.bleuFonce) } }
    })
    rs.getCell(l, 6).numFmt = fmtMontant
    rs.getCell(l, 7).numFmt = fmtMontant
    rs.getCell(l, 6).alignment = { horizontal: 'right' }
    rs.getCell(l, 7).alignment = { horizontal: 'right' }
    if (ecart !== null) rs.getCell(l, 7).font = { color: { argb: argb(ecart > 0 ? VINCI.rouge : VINCI_SECONDAIRE.vert.base) } }
    rs.getCell(l, 9).numFmt = '0.0%'
    if (s?.nbNcMajeures) {
      rs.getCell(l, 10).fill = remplir(COULEURS_NC.majeure.fond)
      rs.getCell(l, 10).font = { bold: true, color: { argb: argb(VINCI.rouge) } }
    }
    for (const [col, dec] of [
      [12, s?.decisionSuggeree ?? 'en_attente'],
      [13, f.decision],
    ] as const) {
      const c = rs.getCell(l, col)
      c.fill = remplir(DECISIONS[dec].couleur)
      c.font = { bold: true, color: { argb: argb(dec === 'en_attente' ? VINCI.noir : VINCI.blanc) } }
    }
    l++
  })
  l++
  const reco = F.find((f) => f.id === m.bidComp.fournisseurRecommandeId)
  for (const [lib, val] of [
    ['Fournisseur recommandé', reco?.nom ?? '—'],
    ['Recommandation', m.bidComp.synthese.recommandation],
    ['Opportunités', m.bidComp.synthese.opportunites],
    ['Risques', m.bidComp.synthese.risques],
  ] as const) {
    rs.mergeCells(l, 1, l, 2)
    const c1 = rs.getCell(l, 1)
    c1.value = lib
    c1.font = { bold: true, color: { argb: argb(VINCI.blanc) } }
    c1.fill = remplir(VINCI.bleu)
    c1.alignment = { vertical: 'top', indent: 1, wrapText: true }
    rs.mergeCells(l, 3, l, colonnes.length)
    const c2 = rs.getCell(l, 3)
    c2.value = val
    c2.alignment = { wrapText: true, vertical: 'top' }
    c2.border = bordureFine
    rs.getRow(l).height = Math.min(300, Math.max(20, 15 * (val.split('\n').length + Math.floor(val.length / 150))))
    l++
  }
  l++
  rs.getCell(l, 1).value = `Barème : ${Object.values(LIBELLES_NOTES).join(' · ')} — score normalisé = Σ(note × coef) / (3 × Σ coef)`
  rs.getCell(l, 1).font = { italic: true, size: 9, color: { argb: argb(VINCI.texteSecondaire) } }

  const buffer = await wb.xlsx.writeBuffer()
  telechargerBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nomFichier)
}
