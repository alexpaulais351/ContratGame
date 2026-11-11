import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculerScores,
  classer,
  decisionSuggeree,
  indexerNotations,
  meilleurFournisseur,
  scoreMaximum,
  scoreNormalise,
  scoreTotalPondere,
  totalMontants,
  type CritereCalc,
  type NotationCalc,
} from './scores'

const criteres: CritereCalc[] = [
  { id: 'c1', type: 'note_1_3', coefficient: 3, famille: 'financier' },
  { id: 'c2', type: 'note_1_3', coefficient: 1, famille: 'technique' },
  { id: 'c3', type: 'texte', coefficient: 5, famille: 'offre' },
  { id: 'c4', type: 'note_1_3', coefficient: 0, famille: 'csrd' },
  { id: 'm1', type: 'montant', coefficient: 0, famille: 'couts' },
  { id: 'm2', type: 'montant', coefficient: 0, famille: 'couts' },
]

const nt = (critereId: string, fournisseurId: string, note: number | null, extra: Partial<NotationCalc> = {}): NotationCalc => ({
  critereId,
  fournisseurId,
  note,
  estNonConformiteMajeure: false,
  estNonConformiteNegociable: false,
  ...extra,
})

test('score total pondéré = Σ note × coef (notes 1-3 uniquement)', () => {
  const idx = indexerNotations([nt('c1', 'A', 3), nt('c2', 'A', 2), nt('c3', 'A', 3), nt('c4', 'A', 3)])
  assert.equal(scoreTotalPondere(criteres, idx, 'A'), 3 * 3 + 2 * 1)
  assert.equal(scoreTotalPondere(criteres, idx, 'B'), 0)
})

test('notes hors bornes ignorées', () => {
  const idx = indexerNotations([nt('c1', 'A', 5), nt('c2', 'A', 0)])
  assert.equal(scoreTotalPondere(criteres, idx, 'A'), 0)
})

test('score maximum et normalisé', () => {
  assert.equal(scoreMaximum(criteres), 3 * (3 + 1))
  assert.equal(scoreNormalise(6, 12), 50)
  assert.equal(scoreNormalise(5, 0), 0)
})

test('classement avec ex aequo', () => {
  const r = classer([
    { id: 'a', valeur: 50 },
    { id: 'b', valeur: 80 },
    { id: 'c', valeur: 80 },
    { id: 'd', valeur: 10 },
  ])
  assert.equal(r.get('b'), 1)
  assert.equal(r.get('c'), 1)
  assert.equal(r.get('a'), 3)
  assert.equal(r.get('d'), 4)
})

test('décision suggérée', () => {
  assert.equal(decisionSuggeree(95, 1, 5, 60), 'no_go')
  assert.equal(decisionSuggeree(0, 0, 0, 60), 'en_attente')
  assert.equal(decisionSuggeree(60, 0, 3, 60), 'go')
  assert.equal(decisionSuggeree(59.9, 0, 3, 60), 'en_attente')
})

test('calculerScores : go / en attente / no go', () => {
  const notations = [
    nt('c1', 'A', 3),
    nt('c2', 'A', 3),
    nt('c1', 'B', 2),
    nt('c2', 'B', 1),
    nt('c1', 'C', 3),
    nt('c2', 'C', 3, { estNonConformiteMajeure: true }),
    nt('c3', 'B', null, { estNonConformiteNegociable: true }),
  ]
  const s = calculerScores(criteres, ['A', 'B', 'C'], notations, 60)
  const a = s.get('A')!
  const b = s.get('B')!
  const c = s.get('C')!
  assert.equal(a.total, 12)
  assert.equal(a.pourcentage, 100)
  assert.equal(a.decisionSuggeree, 'go')
  assert.equal(b.total, 7)
  assert.ok(Math.abs(b.pourcentage - (7 / 12) * 100) < 1e-9)
  assert.equal(b.decisionSuggeree, 'en_attente')
  assert.equal(b.nbNcNegociables, 1)
  assert.equal(c.nbNcMajeures, 1)
  assert.equal(c.decisionSuggeree, 'no_go')
  assert.equal(a.classement, 1)
  assert.equal(c.classement, 1)
  assert.equal(b.classement, 3)
  assert.equal(meilleurFournisseur(s), 'A')
})

test('meilleur fournisseur : null si tous éliminés', () => {
  const s = calculerScores(criteres, ['A'], [nt('c1', 'A', 3, { estNonConformiteMajeure: true })], 60)
  assert.equal(meilleurFournisseur(s), null)
})

test('total des montants par famille', () => {
  const idx = indexerNotations([nt('m1', 'A', null, { valeurTexte: '1000.5' }), nt('m2', 'A', null, { valeurTexte: '200' })])
  assert.equal(totalMontants(criteres, idx, 'A', 'couts'), 1200.5)
  assert.equal(totalMontants(criteres, idx, 'B', 'couts'), null)
})
