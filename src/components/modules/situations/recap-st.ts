import { prisma } from '@/lib/prisma'
import { cleMois } from '@/lib/mois'
import type { RecapSTLigne } from './types'

/** Récap des facturations ST du mois (annee/mois) et cumulées jusqu'à ce mois (inclus). Serveur uniquement. */
export async function calculerRecapST(projetId: string, annee: number, mois: number): Promise<RecapSTLigne[]> {
  const sts = await prisma.sousTraitant.findMany({
    where: { projetId },
    orderBy: { ordre: 'asc' },
    include: { avenants: true, facturations: true },
  })
  const cle = cleMois(annee, mois)
  return sts.map((st) => {
    const montantTotal = st.montantMarche + st.avenants.reduce((a, v) => a + v.montant, 0)
    const factureMois = st.facturations.filter((f) => f.annee === annee && f.mois === mois).reduce((a, f) => a + f.montant, 0)
    const cumule = st.facturations.filter((f) => cleMois(f.annee, f.mois) <= cle).reduce((a, f) => a + f.montant, 0)
    return {
      id: st.id,
      nom: st.nom,
      montantTotal,
      factureMois,
      cumule,
      reste: montantTotal - cumule,
      pourcent: montantTotal > 0 ? (cumule / montantTotal) * 100 : 0,
    }
  })
}
