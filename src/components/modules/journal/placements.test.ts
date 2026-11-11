import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ECART_LIGNE,
  ESPACE_VERTICAL,
  LARGEUR_BULLE,
  LARGEUR_MOIS,
  MARGE_AXE,
  abscisseJour,
  calculerCoupes,
  calculerFrise,
  chercherLargeurMois,
  couperTexte,
  echellePour,
  largeurContenu,
  planifierPages,
  topBulle,
  type DispositionFrise,
  type ElementFrise,
} from './placements'

function el(id: string, jour: string, titre = 'Événement ' + id, description?: string): ElementFrise {
  return { id, jour, titre, description }
}

function rect(d: DispositionFrise, id: string) {
  const p = d.placements.find((q) => q.id === id)!
  const top = topBulle(p, d.yLigne)
  return { ...p, top, bas: top + p.hauteur }
}

function assertSansChevauchement(d: DispositionFrise) {
  const rs = d.placements.map((p) => rect(d, p.id))
  for (let i = 0; i < rs.length; i++) {
    for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i]
      const b = rs[j]
      const h = a.gauche < b.droite && b.gauche < a.droite
      const v = a.top < b.bas && b.top < a.bas
      assert.ok(!(h && v), `chevauchement entre ${a.id} et ${b.id}`)
    }
  }
  // aucune bulle ne traverse la ligne
  for (const r of rs) assert.ok(r.bas <= d.yLigne - ECART_LIGNE + 0.001 || r.top >= d.yLigne + ECART_LIGNE - 0.001, `${r.id} touche la ligne`)
}

// Générateur pseudo-aléatoire déterministe
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

test('largeur fixe par mois et abscisse des dates', () => {
  const d = calculerFrise([el('a', '2026-01-01'), el('b', '2026-03-31')])
  assert.equal(d.largeurMois, LARGEUR_MOIS)
  assert.equal(d.mois.length, 3)
  assert.equal(d.largeurTotale, 2 * MARGE_AXE + 3 * LARGEUR_MOIS)
  assert.equal(d.mois[1].x, MARGE_AXE + LARGEUR_MOIS)
  // milieu du 16 janvier (31 jours) ≈ milieu du mois
  const x = abscisseJour('2026-01-16', 2026 * 12, LARGEUR_MOIS)
  assert.ok(Math.abs(x - (MARGE_AXE + LARGEUR_MOIS / 2)) < 0.01)
})

test("aplomb : chaque bulle est centrée sur sa date (aucun décalage horizontal)", () => {
  const elements = ['2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-02-10', '2026-02-11'].map((j, i) => el('e' + i, j))
  const d = calculerFrise(elements)
  const iDebut = 2026 * 12
  for (const p of d.placements) {
    const attendu = abscisseJour(p.jour, iDebut, LARGEUR_MOIS)
    assert.equal(p.x, attendu)
    assert.equal(p.gauche, attendu - LARGEUR_BULLE / 2)
    assert.equal(p.droite, attendu + LARGEUR_BULLE / 2)
  }
})

test('ordre : haut contre la ligne, puis bas contre la ligne, puis empilement au plus près', () => {
  const d = calculerFrise([el('a', '2026-04-10'), el('b', '2026-04-11'), el('c', '2026-04-12'), el('d', '2026-04-13')])
  const [a, b, c, dd] = ['a', 'b', 'c', 'd'].map((id) => d.placements.find((p) => p.id === id)!)
  assert.equal(a.cote, 'haut')
  assert.equal(a.distance, ECART_LIGNE)
  assert.equal(b.cote, 'bas')
  assert.equal(b.distance, ECART_LIGNE)
  // c : les deux côtés sont pris → s'empile au plus près (égalité → haut)
  assert.equal(c.cote, 'haut')
  assert.equal(c.distance, a.distance + a.hauteur + ESPACE_VERTICAL)
  // d : bas est désormais le plus proche
  assert.equal(dd.cote, 'bas')
  assert.equal(dd.distance, b.distance + b.hauteur + ESPACE_VERTICAL)
  assertSansChevauchement(d)
})

test('événements éloignés : tous en haut contre la ligne', () => {
  const d = calculerFrise([el('a', '2026-01-05'), el('b', '2026-02-05'), el('c', '2026-03-05')])
  for (const p of d.placements) {
    assert.equal(p.cote, 'haut')
    assert.equal(p.distance, ECART_LIGNE)
  }
})

test("une bulle reprend la place contre la ligne dès qu'elle est libre", () => {
  // a et b se gênent ; c est assez loin de a mais chevauche b
  const d = calculerFrise([el('a', '2026-01-01'), el('b', '2026-01-20'), el('c', '2026-02-10')])
  const c = d.placements.find((p) => p.id === 'c')!
  assert.equal(c.cote, 'haut')
  assert.equal(c.distance, ECART_LIGNE)
})

test('non-chevauchement sur des jeux denses aléatoires (titres et descriptions variables)', () => {
  const r = rng(42)
  for (let essai = 0; essai < 25; essai++) {
    const n = 5 + Math.floor(r() * 40)
    const elements: ElementFrise[] = []
    for (let i = 0; i < n; i++) {
      const mois = 1 + Math.floor(r() * 3)
      const jour = 1 + Math.floor(r() * 28)
      const titre = 'Titre '.repeat(1 + Math.floor(r() * 8))
      const desc = r() > 0.5 ? 'Description longue '.repeat(Math.floor(r() * 6)) : undefined
      elements.push(el(`x${essai}-${i}`, `2026-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`, titre, desc))
    }
    for (const L of [LARGEUR_MOIS, 120, 600]) assertSansChevauchement(calculerFrise(elements, { largeurMois: L }))
  }
})

test('déterminisme : même entrée (dans un autre ordre) → même disposition', () => {
  const els = [el('a', '2026-05-02'), el('b', '2026-05-02'), el('c', '2026-05-03')]
  const d1 = calculerFrise(els)
  const d2 = calculerFrise([...els].reverse())
  assert.deepEqual(d1.placements, d2.placements)
})

test('coupe de texte : lignes bornées et ellipse', () => {
  assert.deepEqual(couperTexte('Réunion de chantier', 24, 3), ['Réunion de chantier'])
  const l = couperTexte('un deux trois quatre cinq six sept huit neuf dix onze douze treize', 10, 2)
  assert.equal(l.length, 2)
  assert.ok(l[1].endsWith('…'))
  for (const x of l) assert.ok(x.length <= 10)
})

test('étalement : la largeur/mois trouvée remplit toute la largeur de la page', () => {
  const elements = [el('a', '2026-01-10'), el('b', '2026-02-15'), el('c', '2026-03-03'), el('d', '2026-03-05'), el('e', '2026-04-20')]
  const zone = { largeur: 277, hauteur: 150, echelleMax: 0.35 }
  const { largeurMois, pages, disposition } = chercherLargeurMois(elements, zone)
  assert.equal(pages, 1)
  const rempli = largeurContenu(disposition) * echellePour(disposition, zone)
  assert.ok(rempli <= zone.largeur + 0.01, `dépasse la page : ${rempli}`)
  assert.ok(rempli >= zone.largeur * 0.995, `page non remplie : ${rempli}`)
  assert.ok(largeurMois !== LARGEUR_MOIS)
  assertSansChevauchement(disposition)
  // page plus large → mois plus larges
  const large = chercherLargeurMois(elements, { ...zone, largeur: 400 })
  assert.ok(large.largeurMois > largeurMois)
})

test('étalement multi-pages : frise longue répartie sur plusieurs pages pleines', () => {
  const elements: ElementFrise[] = []
  for (let m = 1; m <= 12; m++) for (const j of [3, 12, 24]) elements.push(el(`m${m}j${j}`, `2026-${String(m).padStart(2, '0')}-${j}`))
  const zone = { largeur: 277, hauteur: 150, echelleMax: 0.35 }
  const { pages, disposition } = chercherLargeurMois(elements, zone)
  assert.ok(pages > 1)
  const rempli = largeurContenu(disposition) * echellePour(disposition, zone)
  assert.ok(rempli <= pages * zone.largeur)
  assert.ok(rempli >= pages * zone.largeur * 0.9)
})

test('coupes multi-pages : jamais au travers des bulles quand un espace existe', () => {
  const elements: ElementFrise[] = []
  for (let m = 1; m <= 6; m++) elements.push(el('a' + m, `2026-0${m}-03`), el('b' + m, `2026-0${m}-10`))
  const d = calculerFrise(elements)
  const coupes = calculerCoupes(d.placements, d.contenuGauche, d.contenuDroite, 700)
  assert.equal(coupes[0], d.contenuGauche)
  assert.equal(coupes[coupes.length - 1], d.contenuDroite)
  for (let i = 1; i < coupes.length - 1; i++) {
    const c = coupes[i]
    assert.ok(c - coupes[i - 1] <= 700, 'page trop large')
    for (const p of d.placements) assert.ok(!(p.gauche < c && p.droite > c), `coupe ${c} traverse ${p.id}`)
  }
})

test('compression ≤ 15 % pour éviter une page quasi vide, échelle identique sur toutes les pages', () => {
  const elements: ElementFrise[] = []
  for (let m = 1; m <= 4; m++) elements.push(el('a' + m, `2026-0${m}-10`))
  const d = calculerFrise(elements)
  const echelleBase = 0.3
  const h = d.hauteurTotale * echelleBase
  // largeur de page choisie pour qu'il reste une miette de contenu sur une dernière page
  const contenu = largeurContenu(d)
  const zone = { largeur: (contenu - 60) * echelleBase / 1, hauteur: h, echelleMax: echelleBase }
  const sans = calculerCoupes(d.placements, d.contenuGauche, d.contenuDroite, zone.largeur / echelleBase)
  const plan = planifierPages(d, zone)
  assert.ok(sans.length - 1 >= 2)
  assert.ok(plan.compression >= 0.85 && plan.compression < 1)
  assert.equal(plan.coupes.length - 1, sans.length - 2)
  // plus de 15 % nécessaire → pas de compression
  const zone2 = { ...zone, largeur: contenu * 0.5 * echelleBase }
  const plan2 = planifierPages(d, zone2)
  assert.ok(plan2.compression === 1 || plan2.compression >= 0.85)
})
