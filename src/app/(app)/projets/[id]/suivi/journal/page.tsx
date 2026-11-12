import { prisma } from '@/lib/prisma'
import { CATEGORIES_SYSTEME } from '@/lib/categories-systeme'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { JournalClient } from '@/components/modules/journal/JournalClient'
import { versJour, type CategorieDTO, type EvenementDTO } from '@/components/modules/journal/types'
import type { PeriodeDTO } from '@/components/modules/journal/periodes'

export default async function JournalPage({ params }: { params: { id: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const [categories, evenements, periodes] = await Promise.all([
    prisma.categorieEvenement.findMany({
      where: { projetId: projet.id },
      orderBy: [{ estSysteme: 'desc' }, { nom: 'asc' }],
      select: { id: true, nom: true, couleurBg: true, couleurBorder: true, couleurText: true, couleurPoint: true, estSysteme: true },
    }),
    prisma.evenementChantier.findMany({
      where: { projetId: projet.id },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: { fichiers: { select: { id: true, nom: true, type: true, taille: true } } },
    }),
    prisma.periodeFrise.findMany({
      where: { projetId: projet.id },
      orderBy: [{ dateDebut: 'asc' }, { dateFin: 'asc' }, { ordre: 'asc' }],
    }),
  ])

  // Catégories système dans l'ordre de la palette, puis personnalisées par nom
  const rang = (nom: string) => {
    const i = CATEGORIES_SYSTEME.findIndex((c) => c.nom === nom)
    return i < 0 ? CATEGORIES_SYSTEME.length : i
  }
  const cats: CategorieDTO[] = [...categories].sort(
    (a, b) => Number(b.estSysteme) - Number(a.estSysteme) || rang(a.nom) - rang(b.nom) || a.nom.localeCompare(b.nom, 'fr'),
  )
  const evs: EvenementDTO[] = evenements.map((e) => ({
    id: e.id,
    jour: versJour(e.date),
    titre: e.titre,
    description: e.description,
    categorie: e.categorie,
    categorieId: e.categorieId,
    afficherFrise: e.afficherFrise,
    source: e.source,
    courrierId: e.courrierId,
    fichiers: e.fichiers,
  }))

  const pers: PeriodeDTO[] = periodes.map((p) => ({
    id: p.id,
    titre: p.titre,
    sousTitre: p.sousTitre,
    debut: versJour(p.dateDebut),
    fin: versJour(p.dateFin),
    couleur: p.couleur,
    afficherFrise: p.afficherFrise,
    zoneFond: p.zoneFond,
    ordre: p.ordre,
  }))

  return <JournalClient projetId={projet.id} nomProjet={projet.name} categories={cats} evenements={evs} periodes={pers} />
}
