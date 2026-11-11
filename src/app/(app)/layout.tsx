import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'
import { ProfilHydrator } from '@/components/layout/ProfilHydrator'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')
  return (
    <div className="flex min-h-screen">
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
      <Sidebar nomUtilisateur={user.name} />
      <div className="min-w-0 flex-1 bg-white">{children}</div>
    </div>
  )
}
