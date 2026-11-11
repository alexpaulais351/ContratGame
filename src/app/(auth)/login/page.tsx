import { LoginForm } from './LoginForm'

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-vinci-gris-clair p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-md border border-vinci-gris-bordure bg-white shadow-sm">
        <div className="bg-vinci-bleu px-6 py-5 text-white">
          <div className="text-2xl font-black tracking-wide">CONDUC RAIL</div>
          <div className="text-sm opacity-90">Gestion contractuelle &amp; financière</div>
        </div>
        <LoginForm callbackUrl={searchParams.callbackUrl ?? '/projets'} />
      </div>
    </main>
  )
}
