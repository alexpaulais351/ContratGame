import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { DetailSituation } from '@/components/modules/situations/DetailSituation'
import { calculerRecapST } from '@/components/modules/situations/recap-st'
import type { LigneDETableau } from '@/components/modules/situations/types'

export default async function SituationDetailPage({ params }: { params: { id: string; situationId: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const situation = await prisma.situation.findFirst({
    where: { id: params.situationId, projetId: projet.id },
    include: { lignes: true },
  })
  if (!situation) notFound()
  const precedente = await prisma.situation.findFirst({
    where: { projetId: projet.id, numero: { lt: situation.numero } },
    orderBy: { numero: 'desc' },
    include: { lignes: true },
  })
  const lignesDE = await prisma.ligneDE.findMany({ where: { projetId: projet.id }, orderBy: { ordre: 'asc' } })
  const cur = new Map(situation.lignes.map((l) => [l.ligneDEId, l]))
  const prec = new Map((precedente?.lignes ?? []).map((l) => [l.ligneDEId, l]))
  const lignes: LigneDETableau[] = lignesDE.map((l) => ({
    id: l.id, code: l.code, designation: l.designation, unite: l.unite,
    quantite: l.quantite, prixUnitaire: l.prixUnitaire, estChapitre: l.estChapitre,
    cumulPrecedent: prec.get(l.id)?.quantite ?? 0,
    puPrecedent: prec.get(l.id)?.prixUnitaire ?? l.prixUnitaire,
    puSituation: cur.get(l.id)?.prixUnitaire ?? l.prixUnitaire,
    cumul: cur.get(l.id)?.quantite ?? 0,
  }))
  const recapST = await calculerRecapST(projet.id, situation.annee, situation.mois)
  return (
    <DetailSituation
      projetId={projet.id}
      nomProjet={projet.name}
      situation={{
        id: situation.id, numero: situation.numero, libelle: situation.libelle,
        annee: situation.annee, mois: situation.mois,
        statut: situation.statut === 'validee' ? 'validee' : 'brouillon',
      }}
      numeroPrecedent={precedente?.numero ?? null}
      lignes={lignes}
      recapST={recapST}
    />
  )
}
