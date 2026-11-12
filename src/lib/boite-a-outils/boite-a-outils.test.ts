import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ajouterJours, ajouterMois, echeance, ecartJours, estJourOuvrable, joursFeries, joursOuvres, jourSemaine, paques,
  reporterJourOuvrable, versJours,
} from './dates'
import { interetsMoratoires, penalitesRetard, retenueGarantie, revisionPrix } from './calculs'
import { VARIANTES_DGD, calculerEcheancesDGD, polygoneFleche, varianteDGD } from './dgd'
import { ASSURANCES, FIN_FRISE } from './assurances'
import { DELAIS_CLES, THEMES_DELAIS } from './delais-cles'

test('dates : validation et arithmétique', () => {
  assert.equal(versJours('2026-02-30'), null)
  assert.equal(versJours('abc'), null)
  assert.equal(ajouterJours('2026-01-31', 30), '2026-03-02')
  assert.equal(ajouterJours('2024-02-28', 1), '2024-02-29')
  assert.equal(ecartJours('2026-01-01', '2026-12-31'), 364)
  assert.equal(jourSemaine('2026-11-12'), 4) // jeudi
})

test('dates : mois de quantième à quantième, fin de mois', () => {
  assert.equal(ajouterMois('2026-01-31', 1), '2026-02-28')
  assert.equal(ajouterMois('2024-01-31', 1), '2024-02-29')
  assert.equal(ajouterMois('2026-08-15', 6), '2027-02-15')
  assert.equal(ajouterMois('2026-11-30', 3), '2027-02-28')
})

test('dates : Pâques et jours fériés', () => {
  assert.equal(paques(2024), '2024-03-31')
  assert.equal(paques(2025), '2025-04-20')
  assert.equal(paques(2026), '2026-04-05')
  const f = joursFeries(2026).map((x) => x.date)
  assert.ok(f.includes('2026-04-06')) // lundi de Pâques
  assert.ok(f.includes('2026-05-14')) // Ascension
  assert.ok(f.includes('2026-05-25')) // lundi de Pentecôte
  assert.equal(f.length, 11)
  assert.equal(estJourOuvrable('2026-07-14'), false)
  assert.equal(estJourOuvrable('2026-11-12'), true)
})

test('dates : report au premier jour ouvrable', () => {
  assert.equal(reporterJourOuvrable('2026-11-14'), '2026-11-16') // samedi → lundi
  assert.equal(reporterJourOuvrable('2026-12-25'), '2026-12-28') // Noël (ven.) → lundi
  const e = echeance('2026-10-02', { jours: 30 }) // 01/11 dimanche + Toussaint → lundi 02/11
  assert.deepEqual(e, { brute: '2026-11-01', date: '2026-11-02', reportee: true })
  assert.deepEqual(echeance('2026-10-02', { jours: 30 }, false), { brute: '2026-11-01', date: '2026-11-01', reportee: false })
  assert.equal(joursOuvres('2026-11-06', '2026-11-13'), 4) // 9,10,12,13 (11/11 férié)
})

test('intérêts moratoires : BCE + 8 points, 40 €', () => {
  const r = interetsMoratoires({ montant: 100_000, echeance: '2026-03-01', paiement: '2026-03-31', tauxBCE: 2.15 })
  assert.equal(r.joursRetard, 30)
  assert.equal(r.tauxApplique, 10.15)
  assert.equal(r.interets, 834.25) // 100000 × 10,15 % × 30 / 365
  assert.equal(r.indemniteForfaitaire, 40)
  assert.equal(r.total, 874.25)
  const zero = interetsMoratoires({ montant: 1000, echeance: '2026-03-31', paiement: '2026-03-20', tauxBCE: 2 })
  assert.equal(zero.total, 0)
})

test('révision de prix : part fixe et arrondi', () => {
  const r = revisionPrix({ p0: 10_000, indexBase: 100, indexMois: 110, partFixe: 0.125 })
  assert.ok(Math.abs(r.coefficient - 1.0875) < 1e-12)
  assert.equal(r.montantRevise, 10_875)
  const s = revisionPrix({ p0: 1000, indexBase: 123.4, indexMois: 130.1, partFixe: 0, decimalesCoefficient: 3, modeArrondi: 'superieur' })
  assert.equal(s.coefficient, 1.055)
  assert.throws(() => revisionPrix({ p0: 1, indexBase: 0, indexMois: 1, partFixe: 0 }))
})

test('pénalités : 1/3000, plafond 10 %, exonération 1 000 €', () => {
  const r = penalitesRetard({ montantHT: 900_000, joursRetard: 20 })
  assert.equal(r.penaliteJournaliere, 300)
  assert.equal(r.brut, 6000)
  assert.equal(r.du, 6000)
  const p = penalitesRetard({ montantHT: 300_000, joursRetard: 400 })
  assert.equal(p.plafonne, true)
  assert.equal(p.du, 30_000)
  const e = penalitesRetard({ montantHT: 90_000, joursRetard: 10 })
  assert.equal(e.brut, 300)
  assert.equal(e.exonere, true)
  assert.equal(e.du, 0)
})

test('retenue de garantie : 5 % et libération', () => {
  const r = retenueGarantie({ montantInitialHT: 200_000, modificationsHT: 20_000, taux: 5, dateReception: '2026-06-30' })
  assert.equal(r.base, 220_000)
  assert.equal(r.retenue, 11_000)
  assert.equal(r.finGarantie, '2027-06-30')
  assert.equal(r.remboursementAuPlusTard, '2027-07-30')
  assert.equal(retenueGarantie({ montantInitialHT: 1, taux: 6 }).tauxSuperieurAuMaximum, true)
})

test('DGD CCAG 2021 : enchaînement des délais', () => {
  const v = varianteDGD('ccag2021')
  const r = Object.fromEntries(calculerEcheancesDGD(v, '2026-01-05', {}, false).map((x) => [x.cle, x]))
  assert.equal(r.pdf.date, '2026-02-04')
  assert.equal(r.dg.date, '2026-03-06')
  assert.equal(r.renvoi.date, '2026-04-05')
  assert.equal(r.decision.date, '2026-05-05')
  assert.equal(r.ta.date, '2026-11-05')
  assert.equal(r.tacite2.date, '2026-03-16')
  assert.equal(r.retard.date, null)
})

test('DGD : les dates réelles saisies décalent les étapes suivantes', () => {
  const v = varianteDGD('ccag2021')
  const r = Object.fromEntries(calculerEcheancesDGD(v, '2026-01-05', { pdf: '2026-02-10' }, false).map((x) => [x.cle, x]))
  assert.equal(r.pdf.depassement, true)
  assert.equal(r.dg.date, '2026-03-12')
})

test('DGD CCCG : 45 / 90 / 45 jours, 6 mois puis 3 mois', () => {
  const v = varianteDGD('cccg')
  assert.ok(v.alerte && v.alerte.includes('SNCF'))
  const r = Object.fromEntries(calculerEcheancesDGD(v, '2026-01-05', {}, false).map((x) => [x.cle, x]))
  assert.equal(r.pdf.date, '2026-02-19')
  assert.equal(r.dg.date, '2026-05-20')
  assert.equal(r.renvoi.date, '2026-07-04')
  assert.equal(r.decision.date, '2027-01-04')
  assert.equal(r.ta.date, '2027-04-04')
})

test('DGD : géométrie cohérente (boîtes dans le canevas)', () => {
  for (const v of VARIANTES_DGD) {
    for (const b of v.schema.boites) {
      assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= v.schema.largeur && b.y + b.h <= v.schema.hauteur, `${v.cle}/${b.id}`)
    }
    assert.equal(new Set(v.etapes.map((e) => e.cle)).size, v.etapes.length)
  }
  assert.equal(polygoneFleche({ x1: 0, x2: 100, y: 50, h: 20, label: '', couleur: 'jaune', sens: 'double' }).split(' ').length, 10)
})

test('données : assurances et délais clés', () => {
  for (const a of ASSURANCES) for (const s of a.segments) assert.ok(s.de < s.a && s.a <= FIN_FRISE, a.cle)
  for (const d of DELAIS_CLES) assert.ok(THEMES_DELAIS.includes(d.theme))
})
