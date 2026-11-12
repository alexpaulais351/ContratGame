import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculerDecompte } from './decompte'
import type { RecapSTLigne } from './types'

const st = (nom: string, pd: boolean, mois: number, cumule: number): RecapSTLigne => ({
  id: nom, nom, paiementDirect: pd, cumulPrecedent: cumule - mois, montantTotal: 100000, factureMois: mois, cumule, reste: 100000 - cumule, pourcent: cumule / 1000,
})

test('décompte : seuls les sous-traitants en paiement direct sont déduits de la part du titulaire', () => {
  const d = calculerDecompte({ mois: 200000, cumul: 500000 }, [st('A', true, 30000, 90000), st('B', false, 20000, 50000)])
  assert.equal(d.stPaiementDirectMois, 30000)
  assert.equal(d.titulaireMois, 170000)
  assert.equal(d.titulaireCumul, 410000)
  assert.equal(d.stTousMois, 50000)
})

import { calculerPN, totaliserPN } from './calculs-pn'

test('prix nouveau : montants précédent / mois / cumulé à partir de l’avancement', () => {
  const base = { id: 'p', numero: 'PN-1', intitule: 'x', numeroOS: 'OS 7', dateOS: '2026-03-04', accepte: true, montantBase: 40000, montantBasePrecedent: 40000, avancementPrecedent: 25, avancement: 0 }
  const c = calculerPN(base, 60)
  assert.equal(c.montantPrecedent, 10000)
  assert.equal(c.montantCumul, 24000)
  assert.equal(c.montantMois, 14000)
  assert.equal(totaliserPN([c, c]).mois, 28000)
})
