import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { SuiviSousTraitants, type STSuivi } from '@/components/modules/sous-traitants/SuiviSousTraitants'

export default async function SuiviSTPage({ params, searchParams }: { params: { id: string }; searchParams: { annee?: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const sts = await prisma.sousTraitant.findMany({
    where: { projetId: params.id },
    orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    include: { avenants: true, facturations: true },
  })
  const anneeCourante = new Date().getFullYear()
  const a = Number(searchParams.annee)
  const annee = Number.isInteger(a) && a >= 2000 && a <= 2100 ? a : anneeCourante
  const annees = new Set<number>([anneeCourante, annee])
  sts.forEach((s) => s.facturations.forEach((f) => annees.add(f.annee)))
  const data: STSuivi[] = sts.map((s) => ({
    id: s.id, nom: s.nom, paiementDirect: s.paiementDirect, montantMarche: s.montantMarche,
    montantAvenants: s.avenants.reduce((t, x) => t + x.montant, 0),
    facturations: s.facturations.map((f) => ({ annee: f.annee, mois: f.mois, montant: f.montant })),
  }))
  return (
    <main className="p-6">
      <SuiviSousTraitants
        projetId={params.id}
        nomProjet={projet.name}
        annee={annee}
        annees={Array.from(annees).sort((x, y) => x - y)}
        sousTraitants={data}
      />
    </main>
  )
}
