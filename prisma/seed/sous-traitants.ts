import type { PrismaClient } from '@prisma/client'

type StDef = {
  nom: string
  contact: string
  telephone: string
  email: string
  paiementDirect: boolean
  montantMarche: number
  montantAS: number
  commentaire?: string
  avenants: { numero: string; libelle: string; montant: number; date: string }[]
  /** [mois 2026, montant] */
  facturations: [number, number][]
}

const SOUS_TRAITANTS: StDef[] = [
  {
    nom: 'Électricité Martin & Fils',
    contact: 'Marc Martin',
    telephone: '04 91 00 11 22',
    email: 'm.martin@electricite-martin.example',
    paiementDirect: true,
    montantMarche: 480000,
    montantAS: 12000,
    commentaire: 'Lot électricité courants forts et courants faibles.',
    avenants: [{ numero: 'AV1', libelle: 'Éclairage extérieur supplémentaire', montant: 36000, date: '2026-03-10' }],
    facturations: [[1, 62000], [2, 85500], [3, 91000], [4, 74000]],
  },
  {
    nom: 'Terrassements du Centre',
    contact: 'Julie Arnaud',
    telephone: '04 42 33 44 55',
    email: 'contact@terrassements-centre.example',
    paiementDirect: false,
    montantMarche: 220000,
    montantAS: 0,
    commentaire: 'Terrassements généraux, fouilles et plateformes. Intervention de janvier à avril.',
    avenants: [],
    facturations: [[2, 40000], [3, 55000], [4, 30000]],
  },
  {
    nom: 'Plomberie Chauffage Durand',
    contact: 'Pierre Durand',
    telephone: '04 78 55 12 30',
    email: 'p.durand@plomberie-durand.example',
    paiementDirect: true,
    montantMarche: 365000,
    montantAS: 0,
    commentaire: 'Lot plomberie sanitaire, chauffage (chaufferie bois) et ventilation double flux.',
    avenants: [
      { numero: 'AV1', libelle: 'Sanitaires PMR supplémentaires au rez-de-chaussée', montant: 18500, date: '2026-04-20' },
      { numero: 'AV2', libelle: 'Suppression du réseau d’arrosage automatique', montant: -9200, date: '2026-06-15' },
    ],
    facturations: [[3, 18000], [4, 42000], [5, 55000], [6, 61000], [7, 48000], [9, 52000], [10, 39000]],
  },
  {
    nom: 'Menuiseries Alu Exemple',
    contact: 'Sophie Lambert',
    telephone: '04 74 21 67 80',
    email: 'contact@menuiseries-alu.example',
    paiementDirect: false,
    montantMarche: 1096000,
    montantAS: 0,
    commentaire: 'Fourniture et pose des menuiseries extérieures aluminium et des occultations.',
    avenants: [{ numero: 'AV1', libelle: 'Brise-soleil orientables façade sud', montant: 42000, date: '2026-07-06' }],
    facturations: [[6, 220000], [7, 310000], [8, 280000], [9, 195000], [10, 83000]],
  },
  {
    nom: 'Peinture & Revêtements du Val',
    contact: 'Karim Benali',
    telephone: '04 72 90 45 18',
    email: 'k.benali@peinture-val.example',
    paiementDirect: true,
    montantMarche: 148000,
    montantAS: 0,
    commentaire: 'Peintures intérieures, sols souples et faïences. Intervention à partir de septembre ; solde en cours.',
    avenants: [{ numero: 'AV1', libelle: 'Peinture anti-graffiti préau et clôtures', montant: -3000, date: '2026-10-05' }],
    // marché 148 000 - 3 000 = 145 000 : facturé à 100 %
    facturations: [[9, 38000], [10, 62000], [11, 45000]],
  },
]

async function creerSt(prisma: PrismaClient, projetId: string, d: StDef, ordre: number) {
  await prisma.sousTraitant.create({
    data: {
      projetId,
      nom: d.nom,
      contact: d.contact,
      telephone: d.telephone,
      email: d.email,
      paiementDirect: d.paiementDirect,
      montantMarche: d.montantMarche,
      montantAS: d.montantAS,
      commentaire: d.commentaire ?? null,
      ordre,
      avenants: { create: d.avenants.map((a) => ({ numero: a.numero, libelle: a.libelle, montant: a.montant, date: new Date(a.date) })) },
      facturations: { create: d.facturations.map(([mois, montant]) => ({ annee: 2026, mois, montant })) },
    },
  })
}

export async function seedSousTraitants(prisma: PrismaClient, projetId: string) {
  for (const [i, d] of SOUS_TRAITANTS.entries()) await creerSt(prisma, projetId, d, i)
}

/** Projet existant : ajoute les sous-traitants de démo absents (par nom). Renvoie le nombre de ST ajoutés. */
export async function completerSousTraitantsExemple(prisma: PrismaClient, projetId: string): Promise<number> {
  const existants = await prisma.sousTraitant.findMany({ where: { projetId }, select: { nom: true, ordre: true } })
  const noms = new Set(existants.map((s) => s.nom))
  let ordre = existants.reduce((m, s) => Math.max(m, s.ordre), -1) + 1
  let n = 0
  for (const d of SOUS_TRAITANTS) {
    if (noms.has(d.nom)) continue
    await creerSt(prisma, projetId, d, ordre++)
    n++
  }
  return n
}
