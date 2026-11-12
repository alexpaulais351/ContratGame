import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MOMENTS, PROBLEMES, ROLES, SITUATION_DEFAUT, recommander, type Situation } from './aide-decision'

const sit = (p: Partial<Situation>): Situation => ({ ...SITUATION_DEFAUT, ...p })
const principales = (s: Situation) => recommander(s).garanties.filter((g) => g.principale).map((g) => g.cle)
const toutes = (s: Situation) => recommander(s).garanties.map((g) => g.cle)

test('fissure structurelle à 5 ans → DO (MOA) puis RCD', () => {
  const r = recommander(sit({ probleme: 'fissure_structurelle', moment: 'an2_10', role: 'moa', doSouscrite: 'oui' }))
  assert.deepEqual(r.garanties.slice(0, 2).map((g) => g.cle), ['do', 'rcd'])
  assert.ok(r.etapes.some((e) => e.delai?.includes('60 jours')))
  assert.ok(r.etapes.some((e) => e.delai?.includes('90 jours')))
  assert.ok(r.surligner.includes('do') && r.surligner.includes('rcd'))
})

test('fissure structurelle sans DO → RCD en principal', () => {
  const r = recommander(sit({ probleme: 'fissure_structurelle', moment: 'an2_10', doSouscrite: 'non' }))
  assert.equal(r.garanties[0].cle, 'rcd')
  assert.ok(!r.etapes.some((e) => e.delai?.includes('60 jours')))
})

test('équipement dissociable à 18 mois → garantie biennale', () => {
  assert.deepEqual(principales(sit({ probleme: 'equipement_dissociable', moment: 'an1_2' })), ['biennale'])
})

test('équipement dissociable à 5 ans → biennale expirée', () => {
  const g = toutes(sit({ probleme: 'equipement_dissociable', moment: 'an2_10' }))
  assert.equal(g[0], 'aucune')
})

test('réserve à la réception → GPA', () => {
  const r = recommander(sit({ probleme: 'reserve_non_levee', moment: 'reception' }))
  assert.equal(r.garanties[0].cle, 'gpa')
  assert.ok(r.courriers.some((c) => c.type === 'mise_en_demeure'))
})

test('dommage en cours de travaux → TRC si souscrite, sinon contrat / RC', () => {
  assert.equal(principales(sit({ probleme: 'dommage_ouvrage_travaux', moment: 'avant_reception', trcSouscrite: 'oui' }))[0], 'trc')
  const sans = toutes(sit({ probleme: 'dommage_ouvrage_travaux', moment: 'avant_reception', trcSouscrite: 'non' }))
  assert.ok(!sans.includes('trc'))
  assert.equal(sans[0], 'contractuelle')
  assert.ok(sans.includes('rc'))
})

test('dommage à un voisin → RC de l’entreprise + troubles du voisinage (MOA)', () => {
  const r = recommander(sit({ probleme: 'dommage_voisin', moment: 'avant_reception', role: 'moa' }))
  assert.equal(r.garanties[0].cle, 'rc')
  assert.ok(r.garanties.some((g) => g.cle === 'voisinage'))
  assert.ok(r.quiContreQui.some((q) => q.qui.startsWith('Maître d’ouvrage')))
})

test('plus de 10 ans → plus de garantie décennale', () => {
  const r = recommander(sit({ probleme: 'fissure_structurelle', moment: 'plus10' }))
  assert.equal(r.garanties[0].cle, 'aucune')
  assert.ok(r.pourquoi.join(' ').includes('10 ans'))
})

test('GPA dans l’année : GPA puis DO après mise en demeure', () => {
  assert.deepEqual(toutes(sit({ probleme: 'infiltration', moment: 'annee1' })).slice(0, 2), ['gpa', 'do'])
})

test('ouvrage exclu : alerte L243-1-1', () => {
  const r = recommander(sit({ probleme: 'fissure_structurelle', moment: 'an2_10', ouvrage: 'exclu' }))
  assert.ok(r.alertes.some((a) => a.includes('L243-1-1')))
})

test('entreprise liquidée → DO + action directe RCD', () => {
  const r = recommander(sit({ probleme: 'entreprise_liquidee', moment: 'an2_10' }))
  assert.deepEqual(r.garanties.slice(0, 2).map((g) => g.cle), ['do', 'rcd'])
  assert.ok(r.etapes.some((e) => e.source?.includes('L124-3')))
})

test('toutes les combinaisons produisent une recommandation complète', () => {
  for (const p of PROBLEMES)
    for (const m of MOMENTS)
      for (const ro of ROLES) {
        const r = recommander(sit({ probleme: p.cle, moment: m.cle, role: ro.cle }))
        assert.ok(r.garanties.length > 0, `${p.cle}/${m.cle}`)
        assert.ok(r.etapes.length > 0, `${p.cle}/${m.cle}`)
        assert.ok(r.documents.length > 0)
        assert.equal(new Set(r.garanties.map((g) => g.cle)).size, r.garanties.length)
      }
})
