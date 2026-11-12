import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { DetailSituation } from '@/components/modules/situations/DetailSituation'
import { calculerRecapST } from '@/components/modules/situations/recap-st'
import type { LigneDETableau, LignePNSituation } from '@/components/modules/situations/types'

export default async function SituationDetailPage({ params }: { params: { id: string; situationId: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const situation = await prisma.situation.findFirst({
    where: { id: params.situationId, projetId: projet.id },
    include: { lignes: true, lignesPN: true },
  })
  if (!situation) notFound()
  const precedente = await prisma.situation.findFirst({
    where: { projetId: projet.id, numero: { lt: situation.numero } },
    orderBy: { numero: 'desc' },
    include: { lignes: true, lignesPN: true },
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

  // Prix nouveaux avec OS reçu (n° ou date d'OS renseigné, OS daté au plus tard à la fin du mois de la situation), hors refusés.
  const finMois = new Date(Date.UTC(situation.annee, situation.mois, 0, 23, 59, 59))
  const pns = await prisma.prixNouveau.findMany({
    where: {
      projetId: projet.id,
      statut: { not: 'refuse' },
      OR: [{ dateOS: { not: null, lte: finMois } }, { AND: [{ dateOS: null }, { numeroOS: { not: null } }, { NOT: { numeroOS: '' } }] }],
    },
    orderBy: { ordre: 'asc' },
  })
  const pnCur = new Map(situation.lignesPN.map((l) => [l.prixNouveauId, l]))
  const pnPrec = new Map((precedente?.lignesPN ?? []).map((l) => [l.prixNouveauId, l]))
  const prixNouveaux: LignePNSituation[] = pns.map((p) => {
    const base = p.montantAccepte ?? p.montantPresente
    const cur = pnCur.get(p.id)
    const prec = pnPrec.get(p.id)
    return {
      id: p.id, numero: p.numero, intitule: p.intitule, numeroOS: p.numeroOS,
      dateOS: p.dateOS ? p.dateOS.toISOString().slice(0, 10) : null,
      accepte: p.montantAccepte != null,
      montantBase: cur?.montantBase ?? base,
      montantBasePrecedent: prec?.montantBase ?? base,
      avancementPrecedent: prec?.avancement ?? 0,
      avancement: cur?.avancement ?? 0,
    }
  })
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
      prixNouveaux={prixNouveaux}
    />
  )
}
