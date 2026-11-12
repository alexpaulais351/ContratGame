import { ByEbgc } from '@/components/layout/ByEbgc'
import { Logo } from '@/components/layout/Logo'

/** Coquille hors connexion (connexion, compte en attente) : en-tête bleu. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between bg-vinci-bleu px-4 text-white">
        <span className="flex items-center gap-3">
          <Logo size={30} className="rounded-[7px] ring-1 ring-white/60" />
          <span className="text-base font-bold tracking-wide">CONTRAT GAME</span>
        </span>
        <ByEbgc hauteur="h-6" />
      </header>
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  )
}
