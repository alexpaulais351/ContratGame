import { prisma } from '@/lib/prisma'
import { getProjetPourPage } from '@/lib/auth-helpers'
import { toInputDate } from '@/lib/utils'
import { InfosProjetForm } from '@/components/modules/infos-projet/InfosProjetForm'
import { ModulesVisibles } from '@/components/modules/infos-projet/ModulesVisibles'
import { MembresProjet } from '@/components/modules/infos-projet/MembresProjet'
import { ZoneDanger } from '@/components/modules/infos-projet/ZoneDanger'

export default async function InfosPage({ params }: { params: { id: string } }) {
  const { projet, member, user } = await getProjetPourPage(params.id)
  const membres = await prisma.projetMember.findMany({
    where: { projetId: projet.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { user: { name: 'asc' } },
  })
  const estOwner = member.role === 'owner'
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="page-titre">Informations du projet</h1>
      <InfosProjetForm
        projetId={projet.id}
        initial={{
          name: projet.name,
          description: projet.description ?? '',
          moaNom: projet.moaNom ?? '',
          moaPrenom: projet.moaPrenom ?? '',
          moaAdresse: projet.moaAdresse ?? '',
          numeroAffaire: projet.numeroAffaire ?? '',
          numeroCommande: projet.numeroCommande ?? '',
          numeroOTP: projet.numeroOTP ?? '',
          adresseChantier: projet.adresseChantier ?? '',
          dateDebut: toInputDate(projet.dateDebut),
          dateFin: toInputDate(projet.dateFin),
        }}
      />
      <ModulesVisibles
        projetId={projet.id}
        masquesInitial={Array.isArray(projet.modulesMasques) ? (projet.modulesMasques as string[]) : []}
      />
      <MembresProjet
        projetId={projet.id}
        estOwner={estOwner}
        moiId={user.id ?? ''}
        membres={membres.map((m) => ({ id: m.id, userId: m.userId, nom: m.user.name, email: m.user.email, role: m.role }))}
      />
      {estOwner && <ZoneDanger projetId={projet.id} nomProjet={projet.name} />}
    </div>
  )
}
