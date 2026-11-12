import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Logo } from '@/components/layout/Logo'
import { EbgcCouleur } from '@/components/layout/EbgcCouleur'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Connexion — Contrat Game' }

export default async function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string; onglet?: string } }) {
  const session = await auth()
  if (session?.user?.id) redirect('/accueil')
  const cible = searchParams.callbackUrl?.startsWith('/') && !searchParams.callbackUrl.startsWith('//') ? searchParams.callbackUrl : '/accueil'
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 pt-4">
      <div className="flex items-center gap-4">
        <Logo size={64} className="shrink-0 rounded-[14px]" />
        <div>
          <h1 className="text-2xl font-bold text-vinci-bleu">Contrat Game</h1>
          <p className="text-sm text-vinci-texte-secondaire">Gestion contractuelle et financière de chantier</p>
        </div>
      </div>
      <p className="text-sm text-black/80">
        Accès réservé : chaque nouveau compte est validé par l&apos;administrateur avant de donner accès à l&apos;outil.
      </p>
      <LoginForm callbackUrl={cible} ongletInitial={searchParams.onglet === 'inscription' ? 'inscription' : 'connexion'} />
      <div className="flex justify-center pt-2">
        <EbgcCouleur />
      </div>
    </div>
  )
}
