import type { PrismaClient } from '@prisma/client'

export async function seedPrixNouveaux(prisma: PrismaClient, projetId: string) {
  await prisma.prixNouveau.deleteMany({ where: { projetId } })
  await prisma.prixNouveau.createMany({
    data: [
      {
        projetId, ordre: 0,
        numero: 'PN-001',
        intitule: 'Fourniture et pose de traverses béton supplémentaires - zone PK 118',
        dateDevis: new Date('2026-02-12'),
        montantPresente: 48600,
        montantAccepte: 45200,
        debourseReel: 38900,
        numeroOS: 'OS-007',
        dateOS: new Date('2026-03-04'),
        delaiSupplementaire: '5 jours ouvrés',
        potentielAcceptation: 100,
        statut: 'accepte',
        commentaire: 'Accepté par la MOA après négociation sur le prix unitaire.',
      },
      {
        projetId, ordre: 1,
        numero: 'PN-002',
        intitule: 'Purge et évacuation de ballast pollué - tranchée drainante',
        dateDevis: new Date('2026-05-20'),
        montantPresente: 72350,
        montantAccepte: null,
        debourseReel: null,
        potentielAcceptation: 60,
        statut: 'en_cours',
        commentaire: 'Relance MOA prévue ; en attente de validation du métré contradictoire.',
      },
    ],
  })
}
