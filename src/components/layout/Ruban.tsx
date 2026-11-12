/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/utils'
import { Logo } from '@/components/layout/Logo'

const IMAGE = '/ruban-chantier.jpg'

/**
 * Ruban illustré (chantier : pont, grue, pile, tunnel).
 * - variante « hero » : grand bandeau de l'accueil / de la connexion, titre en surimpression ;
 * - variante « bandeau » : bande fine en tête des pages de l'outil.
 */
export function Ruban({
  variante = 'bandeau',
  titre,
  sousTitre,
  complement,
  className,
}: {
  variante?: 'hero' | 'bandeau'
  titre?: string
  sousTitre?: string
  complement?: React.ReactNode
  className?: string
}) {
  const hero = variante === 'hero'
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden bg-vinci-bleu',
        hero ? 'min-h-[176px] rounded-xl shadow-sm sm:min-h-[200px]' : 'h-16 sm:h-20',
        className,
      )}
    >
      <img
        src={IMAGE}
        alt=""
        aria-hidden
        className={cn('absolute inset-0 -z-10 h-full w-full object-cover', hero ? 'object-[85%_50%]' : 'object-[62%_58%]')}
      />
      {/* voile bleu VINCI pour la lisibilité du texte, l'illustration reste visible à droite */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: hero
            ? 'linear-gradient(90deg, rgba(0,68,137,0.96) 0%, rgba(0,68,137,0.88) 34%, rgba(0,68,137,0.35) 52%, rgba(0,68,137,0) 66%)'
            : 'linear-gradient(90deg, rgba(0,68,137,0.97) 0%, rgba(0,68,137,0.9) 22%, rgba(0,68,137,0.25) 38%, rgba(0,68,137,0) 50%)',
        }}
      />
      {hero ? (
        <div className="flex h-full min-h-[inherit] items-center gap-4 px-5 py-5 sm:gap-6 sm:px-8">
          <Logo size={96} className="h-16 w-16 shrink-0 rounded-[16px] ring-2 ring-white/80 sm:h-24 sm:w-24 sm:rounded-[22px]" />
          <div className="max-w-xl text-white">
            {titre && <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{titre}</h1>}
            {sousTitre && <p className="mt-1 text-sm text-white/90 sm:text-base">{sousTitre}</p>}
            {complement && <div className="mt-2 text-sm text-white/80">{complement}</div>}
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center px-4 sm:px-6">
          <span className="text-white">
            <span className="block text-sm font-bold tracking-wide sm:text-base">CONTRAT GAME</span>
            <span className="block text-[11px] text-white/80 sm:text-xs">Gestion contractuelle et financière de chantier</span>
          </span>
        </div>
      )}
      {/* filet rouge VINCI */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-vinci-rouge" />
    </div>
  )
}
