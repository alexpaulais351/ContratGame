import type { PrismaClient } from '@prisma/client'

export async function seedSousTraitants(prisma: PrismaClient, projetId: string) {
  const st1 = await prisma.sousTraitant.create({
    data: {
      projetId, nom: 'Signalisation Sud SAS', contact: 'Marc Delorme', telephone: '04 91 00 11 22',
      email: 'm.delorme@signalisation-sud.example', paiementDirect: true, montantMarche: 480000, montantAS: 12000,
      commentaire: 'Pose et réglage de la signalisation ferroviaire.', ordre: 0,
      avenants: { create: [{ numero: 'AV1', libelle: 'Signaux supplémentaires zone nord', montant: 36000, date: new Date('2026-03-10') }] },
    },
  })
  const fact = [[1, 62000], [2, 85500], [3, 91000], [4, 74000]]
  for (const [mois, montant] of fact) {
    await prisma.facturationSousTraitant.create({ data: { sousTraitantId: st1.id, annee: 2026, mois, montant } })
  }
  const st2 = await prisma.sousTraitant.create({
    data: {
      projetId, nom: 'Terrassements Provence', contact: 'Julie Arnaud', telephone: '04 42 33 44 55',
      email: 'contact@terrassements-provence.example', paiementDirect: false, montantMarche: 220000, montantAS: 0, ordre: 1,
    },
  })
  for (const [mois, montant] of [[2, 40000], [3, 55000], [4, 30000]]) {
    await prisma.facturationSousTraitant.create({ data: { sousTraitantId: st2.id, annee: 2026, mois, montant } })
  }
}
