import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/layout/AppShell'
import { ProfilHydrator } from '@/components/layout/ProfilHydrator'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')
  // Compte non validé (en attente, refusé, suspendu) : aucun accès aux pages de l'outil.
  if (user.statut !== 'approuve') redirect('/compte-en-attente')
  const estAdmin = user.role === 'admin'
  const demandesEnAttente = estAdmin ? await prisma.user.count({ where: { statut: 'en_attente' } }) : 0
  return (
    <>
      <ProfilHydrator
        profil={{
          nom: user.name,
          email: user.email,
          logoSociete: user.logoSociete,
          nomSociete: user.nomSociete,
          adresseSociete: user.adresseSociete,
          telSociete: user.telSociete,
          faxSociete: user.faxSociete,
          certifications: user.certifications,
        }}
      />
      <AppShell utilisateur={{ nom: user.name, email: user.email, estAdmin, demandesEnAttente }}>{children}</AppShell>
    </>
  )
}
