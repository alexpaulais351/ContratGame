// Pas de 'use client' : calcul serveur du récap ST pour un mois donné.
// Usage (PDF de situation) :
//   import { getRecapSousTraitantsMois } from '@/components/modules/sous-traitants/recap'
//   const lignes = await getRecapSousTraitantsMois(projetId, 2026, 4)  // RecapSTMois
//   → <SectionSousTraitantsPDF lignes={lignes} /> (src/lib/pdf/sous-traitants.tsx)
import { prisma } from '@/lib/prisma'
import { cleMois } from '@/lib/mois'
import type { RecapSTMois } from '@/lib/pdf/sous-traitants'
import { montantTotalST, pctAvancement } from './calcul'

/** Récap des ST d'un projet pour un mois : facturé du mois, cumul (jusqu'à ce mois inclus), reste, %. mois = 1-12. */
export async function getRecapSousTraitantsMois(projetId: string, annee: number, mois: number): Promise<RecapSTMois> {
  const sts = await prisma.sousTraitant.findMany({
    where: { projetId },
    orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    include: { avenants: true, facturations: true },
  })
  const limite = cleMois(annee, mois)
  return sts.map((st) => {
    const montantTotal = montantTotalST(st.montantMarche, st.avenants)
    const factureMois = st.facturations.filter((f) => f.annee === annee && f.mois === mois).reduce((s, f) => s + f.montant, 0)
    const cumulFacture = st.facturations.filter((f) => cleMois(f.annee, f.mois) <= limite).reduce((s, f) => s + f.montant, 0)
    return { nom: st.nom, montantTotal, factureMois, cumulFacture, reste: montantTotal - cumulFacture, pct: pctAvancement(cumulFacture, montantTotal) }
  })
}
