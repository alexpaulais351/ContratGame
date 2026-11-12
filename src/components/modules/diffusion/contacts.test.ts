import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  basculerCopie, blocDestinataire, emailsUniques, estDestinataire, estEnCopie, grouperParRole, lienMailto, texteCopies,
  type ContactDiffusionDTO,
} from './contacts'

const c = (p: Partial<ContactDiffusionDTO>): ContactDiffusionDTO => ({
  id: p.organisation ?? 'x', organisation: 'Org', civilite: null, prenom: null, nom: null, fonction: null, role: 'autre',
  email: null, telephone: null, adresse: null, destinataireParDefaut: false, copieParDefaut: false, diffusionCR: true,
  commentaire: null, ordre: 0, ...p,
})

const moa = c({ organisation: 'Ville de Saint-Exemple', role: 'moa', civilite: 'Madame', prenom: 'Claire', nom: 'Moreau', fonction: 'DST', adresse: '1 place de la Mairie\n99000 Saint-Exemple', email: 'c.moreau@ville.example', destinataireParDefaut: true })
const moe = c({ organisation: 'Cabinet Exemple', role: 'moe', prenom: 'Laurent', nom: 'Girard', email: 'l.girard@archi.example', copieParDefaut: true })
const st = c({ organisation: 'Terrassements', role: 'sous_traitant', email: 'L.GIRARD@archi.example', diffusionCR: true })

test('blocDestinataire : format courrier', () => {
  assert.equal(blocDestinataire(moa), 'Ville de Saint-Exemple\nÀ l’attention de Madame Claire Moreau, DST\n1 place de la Mairie\n99000 Saint-Exemple')
  assert.equal(blocDestinataire(c({ organisation: 'Mairie' })), 'Mairie')
})

test('copies : texte, bascule et détection', () => {
  assert.equal(texteCopies([moe, st]), 'Cabinet Exemple (Laurent Girard) ; Terrassements')
  const t = basculerCopie('Service contrats', moe, true)
  assert.equal(t, 'Service contrats ; Cabinet Exemple (Laurent Girard)')
  assert.ok(estEnCopie(t, moe))
  assert.equal(basculerCopie(t, moe, false), 'Service contrats')
  assert.ok(estDestinataire(blocDestinataire(moa), moa))
  assert.ok(!estDestinataire(blocDestinataire(moa), moe))
})

test('groupes par rôle et mailto', () => {
  assert.deepEqual(grouperParRole([st, moe, moa]).map((g) => g.role), ['moa', 'moe', 'sous_traitant'])
  assert.deepEqual(emailsUniques([moe, st]), ['l.girard@archi.example'])
  assert.equal(lienMailto([moa, moe, st], 'Projet A&B'), 'mailto:c.moreau@ville.example?subject=Projet%20A%26B&cc=l.girard@archi.example')
  assert.equal(lienMailto([], 'x'), null)
})
