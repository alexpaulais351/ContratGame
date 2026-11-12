import { getProjetPourPage } from '@/lib/auth-helpers'
import { referenceSuivante } from '@/actions/courriers'
import { NouveauCourrier } from '@/components/modules/courriers/NouveauCourrier'
import { contactsDiffusionProjet } from '@/components/modules/diffusion/serveur'

export default async function NouveauCourrierPage({ params, searchParams }: { params: { id: string }; searchParams: { modele?: string } }) {
  const { projet } = await getProjetPourPage(params.id)
  const [reference, contacts] = await Promise.all([referenceSuivante(params.id), contactsDiffusionProjet(params.id)])
  const moa = [projet.moaPrenom, projet.moaNom].filter(Boolean).join(' ')
  return (
    <main className="p-6">
      <NouveauCourrier
        projetId={params.id}
        referenceSuggeree={reference}
        contacts={contacts}
        modeleInitial={typeof searchParams.modele === 'string' ? searchParams.modele : undefined}
        contexte={{
          projet: projet.name, moa, moaAdresse: projet.moaAdresse ?? '', numeroAffaire: projet.numeroAffaire ?? '',
          numeroCommande: projet.numeroCommande ?? '', numeroOTP: projet.numeroOTP ?? '', adresseChantier: projet.adresseChantier ?? '',
        }}
      />
    </main>
  )
}
