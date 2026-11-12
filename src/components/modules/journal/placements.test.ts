import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ECART_LIGNE,
  ESPACE_VERTICAL,
  LARGEUR_BULLE,
  LARGEUR_MOIS,
  MARGE_AXE,
  PERIODE,
  abscisseDebutJour,
  abscisseFinJour,
  abscisseJour,
  ajusterLibelle,
  hauteurBandePeriodes,
  rangerPeriodes,
  segmentsPeriode,
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
  type ElementPeriode,
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

// ---------------------------------------------------------------------------
// Périodes
// ---------------------------------------------------------------------------

function per(id: string, debut: string, fin: string): ElementPeriode {
  return { id, debut, fin }
}

function assertPeriodesSansChevauchement(d: DispositionFrise) {
  for (let i = 0; i < d.periodes.length; i++) {
    for (let j = i + 1; j < d.periodes.length; j++) {
      const a = d.periodes[i]
      const b = d.periodes[j]
      const h = a.gauche < b.droite && b.gauche < a.droite
      const v = a.top < b.top + b.hauteur && b.top < a.top + a.hauteur
      assert.ok(!(h && v), `périodes ${a.id} et ${b.id} se chevauchent`)
    }
  }
  // bande des périodes strictement au-dessus de toutes les bulles
  const basBande = Math.max(0, ...d.periodes.map((p) => p.top + p.hauteur))
  assert.ok(basBande <= d.hauteurPeriodes)
  for (const p of d.placements) assert.ok(topBulle(p, d.yLigne) >= d.hauteurPeriodes - 0.001, `bulle ${p.id} sous la bande des périodes`)
}

test('périodes : rangées par intervalles (chevauchement → rangées distinctes, jours inclus)', () => {
  const { rangees, nbRangees } = rangerPeriodes([
    per('prep', '2026-01-05', '2026-02-27'),
    per('visa', '2026-02-01', '2026-03-15'),
    per('go', '2026-03-01', '2026-07-31'),
    per('ete', '2026-08-01', '2026-08-21'),
    per('colle', '2026-07-31', '2026-08-02'), // touche 'go' (31/07 inclus) et 'ete'
  ])
  assert.equal(rangees.get('prep'), 0)
  assert.equal(rangees.get('visa'), 1)
  assert.equal(rangees.get('go'), 0) // commence après la fin de 'prep'
  assert.equal(rangees.get('colle'), 1) // 31/07 chevauche 'go' (rangée 0)
  assert.equal(rangees.get('ete'), 0) // 01/08 > 31/07 : la rangée 0 est libre
  assert.equal(nbRangees, 2)
  assert.equal(hauteurBandePeriodes(0), 0)
  assert.equal(hauteurBandePeriodes(2), PERIODE.margeHaut + 2 * PERIODE.hauteur + PERIODE.espace + PERIODE.margeBas)
})

test('périodes : même échelle que les bulles, bornes = début du 1er jour → fin du dernier jour', () => {
  const evs = [el('a', '2026-01-10'), el('b', '2026-03-20')]
  for (const L of [LARGEUR_MOIS, 97.3]) {
    const d = calculerFrise(evs, { largeurMois: L, periodes: [per('p', '2026-01-10', '2026-03-20')] })
    const p = d.periodes[0]
    const iDebut = 2026 * 12
    assert.equal(p.gauche, abscisseDebutJour('2026-01-10', iDebut, L))
    assert.equal(p.droite, abscisseFinJour('2026-03-20', iDebut, L))
    // la bulle du 10/01 (milieu du jour) est à l'intérieur du 1er jour de la période
    const a = d.placements.find((q) => q.id === 'a')!
    assert.ok(a.x > p.gauche && a.x - p.gauche < L / 31)
    assert.ok(Math.abs(abscisseFinJour('2026-01-31', iDebut, L) - abscisseDebutJour('2026-02-01', iDebut, L)) < 1e-9)
  }
})

test('périodes : la bande décale bulles du haut, axe et bulles du bas (aucun chevauchement)', () => {
  const evs = [el('a', '2026-04-10'), el('b', '2026-04-11'), el('c', '2026-04-12'), el('d', '2026-05-02')]
  const sans = calculerFrise(evs)
  const avec = calculerFrise(evs, { periodes: [per('p1', '2026-04-01', '2026-04-30'), per('p2', '2026-04-15', '2026-05-20')] })
  assert.equal(sans.hauteurPeriodes, 0)
  assert.equal(avec.hauteurPeriodes, hauteurBandePeriodes(2))
  assert.equal(avec.yLigne, sans.yLigne + avec.hauteurPeriodes)
  assert.equal(avec.hauteurTotale, sans.hauteurTotale + avec.hauteurPeriodes)
  // placements des bulles inchangés (relatifs à la ligne)
  assert.deepEqual(avec.placements, sans.placements)
  assertPeriodesSansChevauchement(avec)
  assertSansChevauchement(avec)
})

test('périodes : non-chevauchement sur des jeux aléatoires', () => {
  const r = rng(7)
  const j = (m: number, d: number) => `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  for (let essai = 0; essai < 30; essai++) {
    const periodes: ElementPeriode[] = []
    for (let i = 0; i < 1 + Math.floor(r() * 8); i++) {
      const m1 = 1 + Math.floor(r() * 10)
      const m2 = Math.min(12, m1 + Math.floor(r() * 3))
      const d1 = j(m1, 1 + Math.floor(r() * 28))
      const d2 = j(m2, 1 + Math.floor(r() * 28))
      periodes.push(per(`p${essai}-${i}`, d1 < d2 ? d1 : d2, d1 < d2 ? d2 : d1))
    }
    const evs = Array.from({ length: 10 }, (_, i) => el(`e${essai}-${i}`, j(1 + Math.floor(r() * 12), 1 + Math.floor(r() * 28))))
    const d = calculerFrise(evs, { periodes, largeurMois: 60 + r() * 300 })
    assertPeriodesSansChevauchement(d)
    assertSansChevauchement(d)
    // deux périodes d'une même rangée ne se chevauchent pas dans le temps
    for (const a of d.periodes) for (const b of d.periodes) if (a !== b && a.rangee === b.rangee) assert.ok(a.fin < b.debut || b.fin < a.debut)
  }
})

test('périodes : étendue des mois et recadrage incluent début/fin des périodes', () => {
  const d = calculerFrise([el('a', '2026-03-10')], { periodes: [per('p', '2026-01-05', '2026-05-27')] })
  assert.equal(d.mois.length, 5) // janvier → mai
  const p = d.periodes[0]
  assert.ok(d.contenuGauche <= p.gauche && d.contenuDroite >= p.droite)
  // sans bulle : seules les périodes définissent le contenu
  const seules = calculerFrise([], { periodes: [per('p', '2026-02-01', '2026-02-28')] })
  assert.equal(seules.mois.length, 1)
  assert.ok(seules.contenuGauche <= seules.periodes[0].gauche && seules.contenuDroite >= seules.periodes[0].droite)
})

test('périodes : rognées à la plage exportée (limites) et aux mois de l\'axe', () => {
  const opts = { moisDebut: '2026-03', moisFin: '2026-04', limitesPeriodes: { debut: '2026-03-10', fin: '2026-04-20' } }
  const d = calculerFrise([el('a', '2026-03-15')], {
    ...opts,
    periodes: [per('long', '2026-01-01', '2026-12-31'), per('dedans', '2026-03-12', '2026-03-20'), per('hors', '2026-06-01', '2026-06-30')],
  })
  assert.deepEqual(d.periodes.map((p) => p.id).sort(), ['dedans', 'long'])
  const long = d.periodes.find((p) => p.id === 'long')!
  const iDebut = 2026 * 12 + 2
  assert.equal(long.gauche, abscisseDebutJour('2026-03-10', iDebut, LARGEUR_MOIS))
  assert.equal(long.droite, abscisseFinJour('2026-04-20', iDebut, LARGEUR_MOIS))
  assert.ok(long.tronqueDebut && long.tronqueFin)
  const dedans = d.periodes.find((p) => p.id === 'dedans')!
  assert.ok(!dedans.tronqueDebut && !dedans.tronqueFin)
  assert.ok(d.contenuGauche <= long.gauche && d.contenuDroite >= long.droite)
})

test('périodes : segments par page (libellé répété et recentré sur chaque partie visible)', () => {
  const p = { gauche: 100, droite: 900 }
  assert.deepEqual(segmentsPeriode(p), [{ gauche: 100, droite: 900, coupeGauche: false, coupeDroite: false }])
  assert.deepEqual(segmentsPeriode(p, [0, 400, 700, 1000]), [
    { gauche: 100, droite: 400, coupeGauche: false, coupeDroite: true },
    { gauche: 400, droite: 700, coupeGauche: true, coupeDroite: true },
    { gauche: 700, droite: 900, coupeGauche: true, coupeDroite: false },
  ])
  // une coupe hors de la période ne la découpe pas
  assert.equal(segmentsPeriode(p, [0, 950, 2000]).length, 1)
  assert.equal(ajusterLibelle('PÉRIODE DE PRÉPARATION', 1000, 7), 'PÉRIODE DE PRÉPARATION')
  const court = ajusterLibelle('PÉRIODE DE PRÉPARATION', 70, 7)
  assert.ok(court.endsWith('…') && court.length <= 10)
})

test('coupes : jamais au travers des bulles, et pas de segment de période illisible quand on peut l\'éviter', () => {
  const elements: ElementFrise[] = []
  for (let m = 1; m <= 6; m++) elements.push(el('a' + m, `2026-0${m}-03`), el('b' + m, `2026-0${m}-10`))
  const periodes = [per('p1', '2026-01-02', '2026-03-28'), per('p2', '2026-03-01', '2026-06-25'), per('p3', '2026-04-14', '2026-04-30')]
  const d = calculerFrise(elements, { periodes })
  const coupes = calculerCoupes(d.placements, d.contenuGauche, d.contenuDroite, 700, d.periodes)
  for (let i = 1; i < coupes.length - 1; i++) {
    const c = coupes[i]
    assert.ok(c - coupes[i - 1] <= 700)
    for (const p of d.placements) assert.ok(!(p.gauche < c && p.droite > c), `coupe ${c} traverse ${p.id}`)
  }
  // cas évitable : une coupe « naïve » à la limite de page couperait une période courte en deux
  // morceaux illisibles → la coupe se fait juste avant la période
  const d2 = calculerFrise([el('a', '2026-01-10'), el('b', '2026-06-20')], { periodes: [per('court', '2026-03-10', '2026-03-25')] })
  const court = d2.periodes[0]
  const naive = d2.contenuGauche + 700
  assert.ok(court.gauche < naive && court.droite > naive, 'scénario : la limite de page tombe dans la période')
  const c2 = calculerCoupes(d2.placements, d2.contenuGauche, d2.contenuDroite, 700, d2.periodes)
  assert.ok(c2.length > 2)
  for (const s of segmentsPeriode(court, c2)) assert.ok(s.droite - s.gauche >= PERIODE.largeurMinSegment - 1 || (!s.coupeGauche && !s.coupeDroite))
  assert.equal(segmentsPeriode(court, c2).length, 1)
})

test('étalement et plan de pages avec périodes : remplissage de la page et contenu complet', () => {
  const elements = [el('a', '2026-01-10'), el('b', '2026-02-15'), el('c', '2026-03-03')]
  const periodes = [per('prep', '2026-01-05', '2026-02-27'), per('visa', '2026-02-10', '2026-04-15')]
  const zone = { largeur: 277, hauteur: 150, echelleMax: 0.35 }
  const { disposition } = chercherLargeurMois(elements, zone, { periodes, moisDebut: '2026-01', moisFin: '2026-04' })
  const rempli = largeurContenu(disposition) * echellePour(disposition, zone)
  assert.ok(rempli <= zone.largeur + 0.01 && rempli >= zone.largeur * 0.995)
  assert.equal(disposition.periodes.length, 2)
  for (const p of disposition.periodes) assert.ok(p.gauche >= disposition.contenuGauche && p.droite <= disposition.contenuDroite)
  assertPeriodesSansChevauchement(disposition)
  const plan = planifierPages(disposition, zone)
  assert.equal(plan.coupes[0], disposition.contenuGauche)
  assert.equal(plan.coupes[plan.coupes.length - 1], disposition.contenuDroite)
})

test('calculerCoupes : jamais de page quasi vide, même si une coupe proche du début ne traverse aucune bulle', () => {
  // bulles serrées sur toute la largeur : seule la coupe juste avant la 1re bulle ne traverse rien
  const bulles = Array.from({ length: 20 }, (_, i) => ({ gauche: 60 + i * 120, droite: 60 + i * 120 + 185 }))
  const coupes = calculerCoupes(bulles, 49, 2500, 1369)
  for (let i = 0; i < coupes.length - 2; i++) {
    assert.ok(coupes[i + 1] - coupes[i] >= 1369 / 2, `page ${i + 1} trop étroite : ${coupes[i + 1] - coupes[i]} px`)
  }
})
