import { test } from 'node:test'
import assert from 'node:assert/strict'
import { debutJourParis, decalerJour, jourParis, libellePage, normaliserChemin, periodeDepuis } from './activite'

const ID = 'cm3x9k2a10000qwerty12345a'

test('normaliserChemin : query, hash, majuscules, identifiants', () => {
  assert.deepEqual(normaliserChemin('/Projets?nouveau=1#x'), { chemin: '/projets', projetId: '' })
  assert.deepEqual(normaliserChemin(`/projets/${ID}/suivi/journal`), { chemin: '/projets/[id]/suivi/journal', projetId: ID })
  assert.deepEqual(normaliserChemin(`/projets/${ID}/suivi/situations/${ID}/`), {
    chemin: '/projets/[id]/suivi/situations/[id]',
    projetId: ID,
  })
  assert.equal(normaliserChemin('https://exemple.fr'), null)
  assert.equal(normaliserChemin('//exemple.fr'), null)
  assert.equal(normaliserChemin(42), null)
  assert.equal(normaliserChemin('/pa ge'), null)
})

test('libellePage : pages fixes et modules projet', () => {
  assert.equal(libellePage('/accueil').libelle, 'Accueil')
  assert.equal(libellePage('/projets/[id]/suivi/journal').libelle, 'Journal')
  assert.equal(libellePage('/projets/[id]/suivi/journal/fiche-ecart').libelle, 'Journal — Fiche écart')
  assert.equal(libellePage('/projets/[id]/suivi/sous-traitants').libelle, 'Suivi ST')
  assert.equal(libellePage('/projets/[id]/sous-traitants').libelle, 'Sous-traitants')
  assert.equal(libellePage('/projets/[id]/courriers/[id]').libelle, 'Courriers — détail')
  assert.equal(libellePage('/projets/[id]/detail-estimatif').rubrique, 'Gestion Financière')
})

test('jours Europe/Paris', () => {
  assert.equal(jourParis(new Date('2026-11-12T23:30:00Z')), '2026-11-13')
  assert.equal(jourParis(new Date('2026-07-01T21:59:00Z')), '2026-07-01')
  assert.equal(decalerJour('2026-03-01', -1), '2026-02-28')
  assert.equal(periodeDepuis('x').cle, '30j')
  assert.equal(debutJourParis('2026-11-12').toISOString(), '2026-11-11T23:00:00.000Z')
  assert.equal(debutJourParis('2026-07-01').toISOString(), '2026-06-30T22:00:00.000Z')
})
