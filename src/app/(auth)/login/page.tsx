import { Logo } from '@/components/layout/Logo'
import { ByEbgc } from '@/components/layout/ByEbgc'
import { LoginForm } from './LoginForm'

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-vinci-gris-clair p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-md border border-vinci-gris-bordure bg-white shadow-sm">
        <div className="flex items-center gap-4 bg-vinci-bleu px-6 py-5 text-white">
          <Logo size={56} className="shrink-0 rounded-[14px] ring-2 ring-white" />
          <div>
            <div className="text-2xl font-black tracking-wide">CONTRAT GAME</div>
            <div className="text-sm opacity-90">Gestion contractuelle &amp; financière de chantier</div>
          </div>
        </div>
        <LoginForm callbackUrl={searchParams.callbackUrl ?? '/accueil'} />
        <div className="flex justify-center border-t border-vinci-gris-bordure py-3">
          <ByEbgc variante="sombre" />
        </div>
      </div>
    </main>
  )
}
