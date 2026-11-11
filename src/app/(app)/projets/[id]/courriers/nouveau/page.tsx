import { getProjetPourPage } from '@/lib/auth-helpers'
import { referenceSuivante } from '@/actions/courriers'
import { NouveauCourrier } from '@/components/modules/courriers/NouveauCourrier'

export default async function NouveauCourrierPage({ params }: { params: { id: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const reference = await referenceSuivante(params.id)
  const moa = [projet.moaPrenom, projet.moaNom].filter(Boolean).join(' ')
  return (
    <main className="p-6">
      <NouveauCourrier
        projetId={params.id}
        referenceSuggeree={reference}
        contexte={{
          projet: projet.name, moa, moaAdresse: projet.moaAdresse ?? '', numeroAffaire: projet.numeroAffaire ?? '',
          numeroCommande: projet.numeroCommande ?? '', numeroOTP: projet.numeroOTP ?? '', adresseChantier: projet.adresseChantier ?? '',
        }}
      />
    </main>
  )
}
