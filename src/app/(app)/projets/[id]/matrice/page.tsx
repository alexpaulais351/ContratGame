import { getProjetPourPage } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { lireBidComp } from '@/lib/matrice-bidcomp'
import { calculerScores, meilleurFournisseur } from '@/components/modules/matrice/scores'
import { ListeMatrices, type MatriceResume } from '@/components/modules/matrice/ListeMatrices'

export default async function MatricesPage({ params }: { params: { id: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const matrices = await prisma.matriceDecisionnelle.findMany({
    where: { projetId: projet.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      fournisseurs: { orderBy: { rang: 'asc' } },
      criteres: { include: { notations: true } },
    },
  })

  const resumes: MatriceResume[] = matrices.map((m) => {
    const notations = m.criteres.flatMap((c) => c.notations)
    const scores = calculerScores(
      m.criteres.map((c) => ({ id: c.id, type: c.type, coefficient: c.coefficient, famille: c.famille })),
      m.fournisseurs.map((f) => f.id),
      notations,
      m.seuilGo,
    )
    const bestId = meilleurFournisseur(scores)
    const best = m.fournisseurs.find((f) => f.id === bestId)
    const bc = lireBidComp(m.bidComp)
    return {
      id: m.id,
      titre: m.titre,
      familleAchats: m.familleAchats,
      typologieAchat: bc.typologieAchat,
      acheteur: m.acheteur,
      nbFournisseurs: m.fournisseurs.length,
      statut: m.statut,
      meilleur: best ? { nom: best.nom, pourcentage: scores.get(best.id)?.pourcentage ?? 0, decision: best.decision } : null,
      updatedAt: m.updatedAt.toISOString(),
    }
  })

  return <ListeMatrices projetId={projet.id} matrices={resumes} />
}
