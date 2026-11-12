import { prisma } from '@/lib/prisma'

export type LigneProjetTDB = {
  id: string
  nom: string
  numeroAffaire: string | null
  montantDE: number
  realise: number
  pct: number
  pnPresente: number
  pnPondere: number
  pnAccepte: number
  stTotal: number
  stFacture: number
  courriersBrouillon: number
  derniereSituation: { numero: number; annee: number; mois: number; libelle: string } | null
}

export type SyntheseTDB = {
  projets: LigneProjetTDB[]
  totaux: Omit<LigneProjetTDB, 'id' | 'nom' | 'numeroAffaire' | 'derniereSituation'> & { stReste: number; nbProjets: number }
}

const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0)

/**
 * Synthèse financière de tous les projets dont l'utilisateur est membre.
 * Requêtes groupées (une par table, filtrées sur la liste des projets) : pas de N+1.
 */
export async function chargerSynthese(userId: string): Promise<SyntheseTDB> {
  const projets = await prisma.projet.findMany({
    where: { members: { some: { userId } } },
    select: { id: true, name: true, numeroAffaire: true },
    orderBy: { name: 'asc' },
  })
  const ids = projets.map((p) => p.id)

  const [lignesDE, dernieres, pns, sts, avenants, facturations, brouillons] = await Promise.all([
    prisma.ligneDE.findMany({
      where: { projetId: { in: ids }, estChapitre: false },
      select: { projetId: true, quantite: true, prixUnitaire: true },
    }),
    // Dernière situation (n° le plus élevé) de chaque projet
    prisma.situation.findMany({
      where: { projetId: { in: ids } },
      distinct: ['projetId'],
      orderBy: [{ projetId: 'asc' }, { numero: 'desc' }],
      select: { id: true, projetId: true, numero: true, annee: true, mois: true, libelle: true },
    }),
    prisma.prixNouveau.findMany({
      where: { projetId: { in: ids } },
      select: { projetId: true, montantPresente: true, potentielAcceptation: true, montantAccepte: true },
    }),
    prisma.sousTraitant.findMany({
      where: { projetId: { in: ids } },
      select: { id: true, projetId: true, montantMarche: true },
    }),
    prisma.avenantSousTraitant.groupBy({
      by: ['sousTraitantId'],
      where: { sousTraitant: { projetId: { in: ids } } },
      _sum: { montant: true },
    }),
    prisma.facturationSousTraitant.groupBy({
      by: ['sousTraitantId'],
      where: { sousTraitant: { projetId: { in: ids } } },
      _sum: { montant: true },
    }),
    prisma.courrierChantier.groupBy({
      by: ['projetId'],
      where: { projetId: { in: ids }, statut: 'brouillon' },
      _count: { _all: true },
    }),
  ])

  const lignesSit = await prisma.ligneSituation.findMany({
    where: { situationId: { in: dernieres.map((s) => s.id) }, ligneDE: { estChapitre: false } },
    select: { situationId: true, quantite: true, prixUnitaire: true },
  })

  const parProjet = new Map<string, LigneProjetTDB>(
    projets.map((p) => [
      p.id,
      {
        id: p.id, nom: p.name, numeroAffaire: p.numeroAffaire,
        montantDE: 0, realise: 0, pct: 0, pnPresente: 0, pnPondere: 0, pnAccepte: 0,
        stTotal: 0, stFacture: 0, courriersBrouillon: 0, derniereSituation: null,
      },
    ]),
  )

  for (const l of lignesDE) parProjet.get(l.projetId)!.montantDE += l.quantite * l.prixUnitaire

  const projetDeSituation = new Map<string, string>()
  for (const s of dernieres) {
    projetDeSituation.set(s.id, s.projetId)
    parProjet.get(s.projetId)!.derniereSituation = { numero: s.numero, annee: s.annee, mois: s.mois, libelle: s.libelle }
  }
  for (const l of lignesSit) {
    const pid = projetDeSituation.get(l.situationId)
    if (pid) parProjet.get(pid)!.realise += l.quantite * l.prixUnitaire
  }

  for (const pn of pns) {
    const p = parProjet.get(pn.projetId)!
    p.pnPresente += pn.montantPresente
    p.pnPondere += (pn.montantPresente * pn.potentielAcceptation) / 100
    p.pnAccepte += pn.montantAccepte ?? 0
  }

  const sommeAvenants = new Map(avenants.map((a) => [a.sousTraitantId, a._sum.montant ?? 0]))
  const sommeFact = new Map(facturations.map((f) => [f.sousTraitantId, f._sum.montant ?? 0]))
  for (const st of sts) {
    const p = parProjet.get(st.projetId)!
    p.stTotal += st.montantMarche + (sommeAvenants.get(st.id) ?? 0)
    p.stFacture += sommeFact.get(st.id) ?? 0
  }

  for (const c of brouillons) parProjet.get(c.projetId)!.courriersBrouillon = c._count._all

  const lignes = [...parProjet.values()].map((p) => ({ ...p, pct: pct(p.realise, p.montantDE) }))

  const t = lignes.reduce(
    (a, p) => ({
      montantDE: a.montantDE + p.montantDE,
      realise: a.realise + p.realise,
      pnPresente: a.pnPresente + p.pnPresente,
      pnPondere: a.pnPondere + p.pnPondere,
      pnAccepte: a.pnAccepte + p.pnAccepte,
      stTotal: a.stTotal + p.stTotal,
      stFacture: a.stFacture + p.stFacture,
      courriersBrouillon: a.courriersBrouillon + p.courriersBrouillon,
    }),
    { montantDE: 0, realise: 0, pnPresente: 0, pnPondere: 0, pnAccepte: 0, stTotal: 0, stFacture: 0, courriersBrouillon: 0 },
  )

  return {
    projets: lignes,
    totaux: { ...t, pct: pct(t.realise, t.montantDE), stReste: t.stTotal - t.stFacture, nbProjets: lignes.length },
  }
}
