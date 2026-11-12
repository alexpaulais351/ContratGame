// Chargement serveur des indicateurs de l’onglet Analyse (importé uniquement par la page serveur).
import { prisma } from '@/lib/prisma'
import { dateDuJour, debutJourParis, decalerJour, jourParis, libellePage, type Periode } from '@/lib/activite'

export type StatutCompte = 'approuve' | 'en_attente' | 'refuse' | 'suspendu'
export const STATUTS: StatutCompte[] = ['approuve', 'en_attente', 'refuse', 'suspendu']

export type PointSerie = { debut: string; fin: string; vues: number; visiteurs: number; connexions: number }
export type PageVue = { chemin: string; libelle: string; rubrique: string; vues: number; visiteurs: number }
export type CompteAnalyse = {
  id: string
  nom: string
  email: string
  entreprise: string | null
  statut: StatutCompte
  estAdmin: boolean
  creeLe: Date
  derniereConnexion: Date | null
  derniereVisite: Date | null
  vues: number
  connexions: number
  projets: number
}
export type ProjetActif = { id: string; nom: string | null; vues: number; visiteurs: number; derniere: Date | null }

export type Analyse = {
  debut: string
  fin: string
  granularite: 'jour' | 'semaine'
  kpi: {
    visiteurs: number
    vues: number
    connexions: number
    comptesActifs: number
    comptesTotal: number
    demandes: number
    projetsCrees: number
    projetsTotal: number
  }
  serie: PointSerie[]
  pages: PageVue[]
  parStatut: Record<StatutCompte, number>
  parRole: { admin: number; user: number }
  comptes: CompteAnalyse[]
  projetsParProprietaire: { id: string; nom: string; projets: number }[]
  projetsActifs: ProjetActif[]
  inscriptions: { mois: string; libelle: string; nombre: number }[]
}

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

const iso = (d: Date) => d.toISOString().slice(0, 10)

export async function chargerAnalyse(periode: Periode): Promise<Analyse> {
  const fin = jourParis()
  const debut = decalerJour(fin, -(periode.jours - 1))
  const dDebut = dateDuJour(debut)
  const instantDebut = debutJourParis(debut)
  const granularite = periode.jours > 120 ? 'semaine' : 'jour'

  // Inscriptions : 12 derniers mois calendaires (mois courant compris)
  const [an, mo] = fin.split('-').map(Number)
  const premierMois = new Date(Date.UTC(an, mo - 12, 1))
  const moisDebut = iso(premierMois)

  const [
    visitesJourUser,
    visitesChemin,
    visitesProjet,
    connexionsPeriode,
    users,
    derniereCx,
    derniereVis,
    proprietaires,
    projetsTotal,
    projetsCrees,
    inscrits,
  ] = await Promise.all([
    prisma.visite.groupBy({ by: ['jour', 'userId'], where: { jour: { gte: dDebut } }, _sum: { nombre: true } }),
    prisma.visite.groupBy({ by: ['chemin', 'userId'], where: { jour: { gte: dDebut } }, _sum: { nombre: true } }),
    prisma.visite.groupBy({
      by: ['projetId', 'userId'],
      where: { jour: { gte: dDebut }, projetId: { not: '' } },
      _sum: { nombre: true },
      _max: { derniere: true },
    }),
    prisma.connexion.findMany({ where: { date: { gte: instantDebut } }, select: { userId: true, date: true } }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, nomSociete: true, statut: true, role: true, createdAt: true, _count: { select: { memberships: true } } },
    }),
    prisma.connexion.groupBy({ by: ['userId'], _max: { date: true } }),
    prisma.visite.groupBy({ by: ['userId'], _max: { derniere: true } }),
    prisma.projetMember.groupBy({ by: ['userId'], where: { role: 'owner' }, _count: { _all: true } }),
    prisma.projet.count(),
    prisma.projet.count({ where: { createdAt: { gte: instantDebut } } }),
    prisma.user.findMany({ where: { createdAt: { gte: debutJourParis(moisDebut) } }, select: { createdAt: true } }),
  ])

  // ── Série temporelle (jour ou semaine glissante de 7 jours depuis le début)
  const pas = granularite === 'semaine' ? 7 : 1
  const seaux: { debut: string; fin: string; vues: number; users: Set<string>; connexions: number }[] = []
  for (let j = debut; j <= fin; j = decalerJour(j, pas)) {
    const f = decalerJour(j, pas - 1)
    seaux.push({ debut: j, fin: f > fin ? fin : f, vues: 0, users: new Set(), connexions: 0 })
  }
  const indexSeau = (jour: string) => Math.floor((dateDuJour(jour).getTime() - dDebut.getTime()) / 86_400_000 / pas)
  const visiteursPeriode = new Set<string>()
  const vuesParUser = new Map<string, number>()
  let vuesTotal = 0
  for (const v of visitesJourUser) {
    const n = v._sum.nombre ?? 0
    const s = seaux[indexSeau(iso(v.jour))]
    if (s) {
      s.vues += n
      s.users.add(v.userId)
    }
    visiteursPeriode.add(v.userId)
    vuesParUser.set(v.userId, (vuesParUser.get(v.userId) ?? 0) + n)
    vuesTotal += n
  }
  const cxParUser = new Map<string, number>()
  for (const c of connexionsPeriode) {
    const s = seaux[indexSeau(jourParis(c.date))]
    if (s) s.connexions++
    cxParUser.set(c.userId, (cxParUser.get(c.userId) ?? 0) + 1)
  }
  const serie: PointSerie[] = seaux.map((s) => ({ debut: s.debut, fin: s.fin, vues: s.vues, visiteurs: s.users.size, connexions: s.connexions }))

  // ── Pages
  const pagesMap = new Map<string, { vues: number; users: Set<string> }>()
  for (const v of visitesChemin) {
    const p = pagesMap.get(v.chemin) ?? { vues: 0, users: new Set<string>() }
    p.vues += v._sum.nombre ?? 0
    p.users.add(v.userId)
    pagesMap.set(v.chemin, p)
  }
  const pages: PageVue[] = [...pagesMap.entries()]
    .map(([chemin, p]) => ({ chemin, ...libellePage(chemin), vues: p.vues, visiteurs: p.users.size }))
    .sort((a, b) => b.vues - a.vues || a.libelle.localeCompare(b.libelle, 'fr'))
    .slice(0, 15)

  // ── Projets actifs
  const projMap = new Map<string, { vues: number; users: Set<string>; derniere: Date | null }>()
  for (const v of visitesProjet) {
    const p = projMap.get(v.projetId) ?? { vues: 0, users: new Set<string>(), derniere: null }
    p.vues += v._sum.nombre ?? 0
    p.users.add(v.userId)
    const d = v._max.derniere
    if (d && (!p.derniere || d > p.derniere)) p.derniere = d
    projMap.set(v.projetId, p)
  }
  const topIds = [...projMap.entries()].sort((a, b) => b[1].vues - a[1].vues).slice(0, 10)
  const noms = await prisma.projet.findMany({ where: { id: { in: topIds.map(([id]) => id) } }, select: { id: true, name: true } })
  const nomParId = new Map(noms.map((p) => [p.id, p.name]))
  const projetsActifs: ProjetActif[] = topIds.map(([id, p]) => ({
    id,
    nom: nomParId.get(id) ?? null,
    vues: p.vues,
    visiteurs: p.users.size,
    derniere: p.derniere,
  }))

  // ── Comptes
  const cxMax = new Map(derniereCx.map((c) => [c.userId, c._max.date]))
  const visMax = new Map(derniereVis.map((v) => [v.userId, v._max.derniere]))
  const parStatut: Record<StatutCompte, number> = { approuve: 0, en_attente: 0, refuse: 0, suspendu: 0 }
  const parRole = { admin: 0, user: 0 }
  const comptes: CompteAnalyse[] = users.map((u) => {
    const statut = (STATUTS as string[]).includes(u.statut) ? (u.statut as StatutCompte) : 'approuve'
    parStatut[statut]++
    parRole[u.role === 'admin' ? 'admin' : 'user']++
    return {
      id: u.id,
      nom: u.name,
      email: u.email,
      entreprise: u.nomSociete,
      statut,
      estAdmin: u.role === 'admin',
      creeLe: u.createdAt,
      derniereConnexion: cxMax.get(u.id) ?? null,
      derniereVisite: visMax.get(u.id) ?? null,
      vues: vuesParUser.get(u.id) ?? 0,
      connexions: cxParUser.get(u.id) ?? 0,
      projets: u._count.memberships,
    }
  })
  const activite = (c: CompteAnalyse) => Math.max(c.derniereVisite?.getTime() ?? 0, c.derniereConnexion?.getTime() ?? 0)
  comptes.sort((a, b) => activite(b) - activite(a) || b.creeLe.getTime() - a.creeLe.getTime())

  const nomUser = new Map(users.map((u) => [u.id, u.name || u.email]))
  const projetsParProprietaire = proprietaires
    .map((p) => ({ id: p.userId, nom: nomUser.get(p.userId) ?? '—', projets: p._count._all }))
    .sort((a, b) => b.projets - a.projets || a.nom.localeCompare(b.nom, 'fr'))

  // ── Inscriptions par mois
  const inscriptions: Analyse['inscriptions'] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(an, mo - 12 + i, 1))
    inscriptions.push({ mois: iso(d).slice(0, 7), libelle: `${MOIS_COURTS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`, nombre: 0 })
  }
  for (const u of inscrits) {
    const m = inscriptions.find((x) => x.mois === jourParis(u.createdAt).slice(0, 7))
    if (m) m.nombre++
  }

  return {
    debut,
    fin,
    granularite,
    kpi: {
      visiteurs: visiteursPeriode.size,
      vues: vuesTotal,
      connexions: connexionsPeriode.length,
      comptesActifs: parStatut.approuve,
      comptesTotal: users.length,
      demandes: parStatut.en_attente,
      projetsCrees,
      projetsTotal,
    },
    serie,
    pages,
    parStatut,
    parRole,
    comptes,
    projetsParProprietaire,
    projetsActifs,
    inscriptions,
  }
}
