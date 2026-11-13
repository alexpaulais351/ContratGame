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

test('DO : procédure d’instruction complète (10 j, 15 j, 60 j, 90 j)', () => {
  const r = recommander(sit({ probleme: 'infiltration', moment: 'an2_10', doSouscrite: 'oui' }))
  for (const d of ['10 jours', '15 jours', '60 jours', '90 jours']) assert.ok(r.etapes.some((e) => e.delai?.startsWith(d)), d)
})

test('ouvrage non soumis : RCD génie civil proposée', () => {
  const r = recommander(sit({ probleme: 'fissure_structurelle', moment: 'an2_10', ouvrage: 'exclu' }))
  assert.ok(r.garanties.some((g) => g.cle === 'rcdgc'))
  assert.ok(r.surligner.includes('rcdgc'))
})

test('engin cassé → bris de machine en priorité', () => {
  const r = recommander(sit({ probleme: 'dommage_engin', moment: 'avant_reception' }))
  assert.equal(r.garanties[0].cle, 'bdm')
  assert.ok(r.surligner.includes('bdm'))
})

test('vol sur chantier → TRC, bris de machine et TRS', () => {
  const g = toutes(sit({ probleme: 'vol_chantier', moment: 'avant_reception', trcSouscrite: 'oui' }))
  assert.equal(g[0], 'trc')
  assert.ok(g.includes('bdm') && g.includes('trs'))
})

test('incendie base vie → multirisque TRS, franchise aggravée signalée', () => {
  const r = recommander(sit({ probleme: 'incendie_base_vie', moment: 'avant_reception' }))
  assert.equal(r.garanties[0].cle, 'trs')
  assert.ok(r.pieges.some((p) => p.includes('60 000 €')))
})

test('sinistre auto → constat sous 5 jours ouvrés', () => {
  const r = recommander(sit({ probleme: 'sinistre_auto', moment: 'avant_reception' }))
  assert.equal(r.garanties[0].cle, 'auto')
  assert.ok(r.etapes.some((e) => e.delai?.includes('5 jours ouvrés')))
})

test('avarie de transport → réserves sous 3 jours (C. com. L133-3)', () => {
  const r = recommander(sit({ probleme: 'avarie_transport', moment: 'avant_reception' }))
  assert.equal(r.garanties[0].cle, 'transport')
  assert.ok(r.etapes.some((e) => e.source?.includes('L133-3')))
})

test('règle groupe rappelée à l’entreprise, pas au maître d’ouvrage', () => {
  const ent = recommander(sit({ probleme: 'reclamation_tiers', moment: 'avant_reception', role: 'entreprise' }))
  const moa = recommander(sit({ probleme: 'reclamation_tiers', moment: 'avant_reception', role: 'moa' }))
  assert.ok(ent.etapes.some((e) => e.texte.startsWith('Règle groupe')))
  assert.ok(!moa.etapes.some((e) => e.texte.startsWith('Règle groupe')))
})

test('les garanties surlignées existent dans les fiches', async () => {
  const { ASSURANCES } = await import('@/lib/boite-a-outils/assurances')
  const cles = new Set(ASSURANCES.map((a) => a.cle))
  for (const p of PROBLEMES)
    for (const m of MOMENTS) for (const c of recommander(sit({ probleme: p.cle, moment: m.cle })).surligner) assert.ok(cles.has(c), `${p.cle}/${c}`)
})
