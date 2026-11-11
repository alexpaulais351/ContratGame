import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfilForm } from '@/components/modules/profil/ProfilForm'

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const u = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!u) redirect('/login')
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
      <h1 className="page-titre">Mon profil</h1>
      <ProfilForm
        initial={{
          nom: u.name,
          email: u.email,
          logoSociete: u.logoSociete,
          nomSociete: u.nomSociete,
          adresseSociete: u.adresseSociete,
          telSociete: u.telSociete,
          faxSociete: u.faxSociete,
          certifications: u.certifications,
        }}
      />
    </div>
  )
}
