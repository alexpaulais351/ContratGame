/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/utils'
import { Logo } from '@/components/layout/Logo'

const IMAGE = '/ruban-chantier.jpg'
const BLEU = 'rgba(0,68,137,'

/**
 * Ruban illustré (chantier : pont, grue, piles, tunnel).
 * - « hero » : grand bandeau de l'accueil / de la connexion, titre en surimpression ;
 * - « bandeau » : bande en tête des pages de l'outil ; l'illustration est affichée en entier
 *   (hauteur de la bande, calée à droite) et se fond dans le bleu VINCI à gauche.
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
  if (variante === 'bandeau') {
    return (
      <div className={cn('relative isolate h-24 overflow-hidden bg-vinci-bleu sm:h-28', className)}>
        <div className="absolute inset-y-0 right-0 -z-10 h-full">
          <img src={IMAGE} alt="" aria-hidden className="h-full w-auto max-w-none" />
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-1/2"
            style={{ background: `linear-gradient(90deg, ${BLEU}1) 0%, ${BLEU}0.75) 35%, ${BLEU}0) 100%)` }}
          />
        </div>
        <div className="flex h-full items-center px-5 sm:px-6">
          <span className="text-white">
            <span className="block text-base font-bold tracking-wide sm:text-lg">CONTRAT GAME</span>
            <span className="block text-xs text-white/85 sm:text-sm">Gestion contractuelle et financière de chantier</span>
          </span>
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-vinci-rouge" />
      </div>
    )
  }

  return (
    <div className={cn('relative isolate min-h-[180px] overflow-hidden rounded-xl bg-vinci-bleu shadow-sm sm:min-h-[210px]', className)}>
      <img src={IMAGE} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover object-[85%_50%]" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: `linear-gradient(90deg, ${BLEU}0.96) 0%, ${BLEU}0.88) 34%, ${BLEU}0.35) 52%, ${BLEU}0) 66%)` }}
      />
      <div className="flex h-full min-h-[inherit] items-center gap-4 px-5 py-5 sm:gap-6 sm:px-8">
        <Logo size={96} className="h-16 w-16 shrink-0 rounded-[16px] ring-2 ring-white/80 sm:h-24 sm:w-24 sm:rounded-[22px]" />
        <div className="max-w-xl text-white">
          {titre && <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{titre}</h1>}
          {sousTitre && <p className="mt-1 text-sm text-white/90 sm:text-base">{sousTitre}</p>}
          {complement && <div className="mt-2 text-sm text-white/80">{complement}</div>}
        </div>
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-vinci-rouge" />
    </div>
  )
}
