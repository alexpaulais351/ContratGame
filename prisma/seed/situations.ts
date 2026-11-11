import type { PrismaClient } from '@prisma/client'

/** Situation n°1 (mars 2026, validée) : cumuls sur ~60 % des lignes DE (hors chapitres). */
export async function seedSituations(prisma: PrismaClient, projetId: string) {
  await prisma.situation.deleteMany({ where: { projetId } })
  const lignes = await prisma.ligneDE.findMany({ where: { projetId, estChapitre: false }, orderBy: { ordre: 'asc' } })
  const sit = await prisma.situation.create({
    data: { projetId, numero: 1, libelle: 'Travaux de mars', annee: 2026, mois: 3, statut: 'validee' },
  })
  const taux = [0.5, 0.25, 0.8, 0.1, 1]
  const data = lignes
    .filter((_, i) => i % 5 !== 4 && i % 5 !== 3)
    .map((l, i) => ({
      situationId: sit.id,
      ligneDEId: l.id,
      quantite: Math.round(l.quantite * taux[i % taux.length] * 100) / 100,
      prixUnitaire: l.prixUnitaire,
    }))
  if (data.length) await prisma.ligneSituation.createMany({ data })
}
