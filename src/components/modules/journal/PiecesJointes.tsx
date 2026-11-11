'use client'
import { useEffect, useState } from 'react'
import { FileText, ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { chargerFichier, ouvrirDansOnglet } from './fichiers'
import { formatTaille, type FichierMeta } from './types'

function ouvrir(projetId: string, f: FichierMeta) {
  ouvrirDansOnglet(projetId, f.id).catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Ouverture impossible'))
}

/** Vignette d'image chargée à la demande. */
export function Vignette({ projetId, fichier, taille = 48 }: { projetId: string; fichier: FichierMeta; taille?: number }) {
  const [src, setSrc] = useState<string | null>(null)
  const [erreur, setErreur] = useState(false)
  useEffect(() => {
    let actif = true
    chargerFichier(projetId, fichier.id)
      .then((c) => actif && setSrc(c))
      .catch(() => actif && setErreur(true))
    return () => {
      actif = false
    }
  }, [projetId, fichier.id])
  return (
    <button
      type="button"
      onClick={() => ouvrir(projetId, fichier)}
      title={`${fichier.nom} (${formatTaille(fichier.taille)}) — ouvrir dans un nouvel onglet`}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-vinci-gris-bordure bg-vinci-gris-clair hover:border-vinci-bleu"
      style={{ width: taille, height: taille }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={fichier.nom} className="h-full w-full object-cover" />
      ) : erreur ? (
        <ImageIcon className="h-4 w-4 text-vinci-gris" />
      ) : (
        <Loader2 className="h-4 w-4 animate-spin text-vinci-gris" />
      )}
    </button>
  )
}

export function PuceFichier({ projetId, fichier }: { projetId: string; fichier: FichierMeta }) {
  return (
    <button
      type="button"
      onClick={() => ouvrir(projetId, fichier)}
      title={`${fichier.nom} (${formatTaille(fichier.taille)}) — ouvrir dans un nouvel onglet`}
      className="inline-flex max-w-[180px] items-center gap-1 rounded-sm border border-vinci-gris-bordure bg-white px-2 py-1 text-xs text-vinci-bleu hover:border-vinci-bleu hover:bg-vinci-bleu-tres-clair"
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{fichier.nom}</span>
    </button>
  )
}

export function PiecesJointes({ projetId, fichiers }: { projetId: string; fichiers: FichierMeta[] }) {
  if (fichiers.length === 0) return <span className="text-xs text-vinci-gris">—</span>
  const images = fichiers.filter((f) => f.type.startsWith('image/'))
  const autres = fichiers.filter((f) => !f.type.startsWith('image/'))
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {images.map((f) => (
        <Vignette key={f.id} projetId={projetId} fichier={f} />
      ))}
      {autres.map((f) => (
        <PuceFichier key={f.id} projetId={projetId} fichier={f} />
      ))}
    </div>
  )
}
