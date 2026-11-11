import type { PrismaClient } from '@prisma/client'

export async function seedCourriers(prisma: PrismaClient, projetId: string) {
  const projet = await prisma.projet.findUnique({ where: { id: projetId } })
  if (!projet) return
  const nom = projet.name
  const dateEnvoi = new Date('2026-03-12T12:00:00.000Z')
  const reference = 'CR-2026-001'
  const objet = `${nom} – Émission de réserves`

  await prisma.courrierChantier.deleteMany({ where: { projetId, reference } })
  const courrier = await prisma.courrierChantier.create({
    data: {
      projetId,
      reference,
      objet,
      type: 'reserves',
      dateEnvoi,
      statut: 'envoye',
      destinataire: `${[projet.moaPrenom, projet.moaNom].filter(Boolean).join(' ') || 'Maître d’ouvrage'}\n${projet.moaAdresse ?? ''}`.trim(),
      expediteur: 'Conduc Rail – Direction de projet',
      lieu: 'Paris',
      modeEnvoi: 'lrar',
      copies: 'Direction de projet ; Service contrats',
      signataireNom: 'Jean Dupont',
      signataireFonction: 'Directeur de projet',
      corps: `Madame, Monsieur,

Dans le cadre du chantier ${nom} (Marché n° ${projet.numeroCommande ?? '………'} – Affaire ${projet.numeroAffaire ?? '………'}), nous avons pris connaissance de votre ordre de service daté du 2 mars 2026 relatif à la modification du phasage des travaux.

Après examen, nous formulons les réserves suivantes :

1. Les nouvelles contraintes de coupure de voie ne sont pas compatibles avec le planning contractuel.
2. Les incidences financières de cette modification n'ont pas été chiffrées.
3. Les délais d'approvisionnement des matériaux ne permettent pas le respect de la nouvelle date de démarrage.

Nous nous réservons le droit de présenter toute réclamation complémentaire. Nous vous remercions de nous faire part de votre position sous quinze (15) jours.

Dans l’attente de votre retour, nous vous prions d’agréer, Madame, Monsieur, l’expression de nos salutations distinguées.`,
    },
  })

  const cat = await prisma.categorieEvenement.findUnique({ where: { projetId_nom: { projetId, nom: 'Contrat' } } })
  if (cat) {
    await prisma.evenementChantier.deleteMany({ where: { projetId, courrierId: courrier.id } })
    await prisma.evenementChantier.create({
      data: {
        projetId,
        date: dateEnvoi,
        titre: `Courrier ${reference} : ${objet}`,
        categorie: 'Contrat',
        categorieId: cat.id,
        afficherFrise: true,
        source: 'courrier',
        courrierId: courrier.id,
      },
    })
  }
}
