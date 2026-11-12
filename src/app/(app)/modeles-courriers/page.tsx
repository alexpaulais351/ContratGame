import { redirect } from 'next/navigation'

/** Ancienne URL : la bibliothèque de modèles est désormais dans la Boîte à outils. */
export default function AncienneBibliothequeModeles({ searchParams }: { searchParams: { modele?: string | string[] } }) {
  const modele = typeof searchParams.modele === 'string' ? `?modele=${encodeURIComponent(searchParams.modele)}` : ''
  redirect(`/boite-a-outils/modeles-courriers${modele}`)
}
