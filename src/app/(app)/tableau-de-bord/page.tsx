import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { chargerSynthese } from '@/components/modules/tableau-de-bord/donnees'
import { CartesKPI } from '@/components/modules/tableau-de-bord/CartesKPI'
import { TableauProjets } from '@/components/modules/tableau-de-bord/TableauProjets'

export const dynamic = 'force-dynamic'

export default async function TableauDeBordPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const synthese = await chargerSynthese(session.user.id)
  return (
    <main className="p-6">
      <h1 className="page-titre">Tableau de bord</h1>
      <p className="mb-6 text-sm text-vinci-texte-secondaire">
        Synthèse financière de l’ensemble de vos projets (réalisé = dernière situation de chaque projet).
      </p>
      {synthese.projets.length === 0 ? (
        <p className="text-vinci-texte-secondaire">Aucun projet pour le moment.</p>
      ) : (
        <div className="space-y-6">
          <CartesKPI totaux={synthese.totaux} />
          <TableauProjets synthese={synthese} />
        </div>
      )}
    </main>
  )
}
