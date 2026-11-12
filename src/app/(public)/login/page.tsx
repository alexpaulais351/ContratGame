import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Ruban } from '@/components/layout/Ruban'
import { EbgcCouleur } from '@/components/layout/EbgcCouleur'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Connexion — Contrat Game' }

export default async function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string; onglet?: string } }) {
  const session = await auth()
  if (session?.user?.id) redirect('/accueil')
  const cible = searchParams.callbackUrl?.startsWith('/') && !searchParams.callbackUrl.startsWith('//') ? searchParams.callbackUrl : '/accueil'
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pt-2">
      <Ruban variante="hero" titre="Contrat Game" sousTitre="Gestion contractuelle et financière de chantier" />
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <p className="text-sm text-black/80">
          Accès réservé : chaque nouveau compte est validé par l&apos;administrateur avant de donner accès à l&apos;outil.
        </p>
        <LoginForm callbackUrl={cible} ongletInitial={searchParams.onglet === 'inscription' ? 'inscription' : 'connexion'} />
        <div className="flex justify-center pt-2">
          <EbgcCouleur />
        </div>
      </div>
    </div>
  )
}
