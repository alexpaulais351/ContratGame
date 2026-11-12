'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Copy, FileText, Search, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MODELES_COURRIERS, libelleModeEnvoi, type ModeleCourrier } from '@/lib/courriers-templates'
import { cn } from '@/lib/utils'
import { TexteAvecVariables, libelleVariable, variablesDuModele } from './CorpsModele'

type ProjetChoix = { id: string; nom: string; numeroAffaire: string | null }

export function BibliothequeModeles({ projets }: { projets: ProjetChoix[] }) {
  const router = useRouter()
  const [selection, setSelection] = useState<ModeleCourrier>(MODELES_COURRIERS[0])
  const [recherche, setRecherche] = useState('')
  const [dialogOuvert, setDialogOuvert] = useState(false)
  const [projetChoisi, setProjetChoisi] = useState<string | null>(projets.length === 1 ? projets[0].id : null)

  const modeles = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return MODELES_COURRIERS
    return MODELES_COURRIERS.filter((m) => [m.label, m.description, m.objet, m.corps].some((t) => t.toLowerCase().includes(q)))
  }, [recherche])

  const variables = variablesDuModele(selection.objet, selection.corps)

  async function copier() {
    const texte = `Objet : ${selection.objet}\n\n${selection.corps}`
    try {
      await navigator.clipboard.writeText(texte)
      toast.success('Texte du modèle copié')
    } catch {
      toast.error('Copie impossible (presse-papiers non disponible)')
    }
  }

  function utiliser() {
    if (!projetChoisi) return
    setDialogOuvert(false)
    router.push(`/projets/${projetChoisi}/courriers/nouveau?modele=${encodeURIComponent(selection.type)}`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_1fr]">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-vinci-gris" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un modèle…" className="pl-8" />
        </div>
        {modeles.length === 0 && <p className="text-sm text-vinci-texte-secondaire">Aucun modèle ne correspond.</p>}
        <div className="space-y-2">
          {modeles.map((m) => (
            <button
              key={m.type}
              type="button"
              onClick={() => setSelection(m)}
              className={cn(
                'carte block w-full text-left transition hover:bg-vinci-bleu-tres-clair',
                selection.type === m.type && 'border-vinci-bleu bg-vinci-bleu-tres-clair ring-1 ring-vinci-bleu',
              )}
            >
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-vinci-bleu" />
                <div className="min-w-0">
                  <div className="font-bold text-vinci-bleu">{m.label}</div>
                  <div className="mt-0.5 text-xs text-vinci-texte-secondaire">{m.description}</div>
                  <div className="mt-1 truncate text-xs italic text-vinci-texte-secondaire">Objet : {m.objet}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <section className="carte min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-vinci-gris-bordure pb-3">
          <div>
            <h2 className="text-lg font-bold text-vinci-bleu">{selection.label}</h2>
            <p className="text-sm text-vinci-texte-secondaire">{selection.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-vinci-gris-bordure">Type : {selection.type}</Badge>
              <Badge variant="outline" className="border-vinci-gris-bordure">Envoi : {libelleModeEnvoi(selection.modeEnvoi)}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="btn-toolbar" onClick={copier}>
              <Copy className="mr-1 h-4 w-4" /> Copier le texte
            </Button>
            <Button onClick={() => setDialogOuvert(true)} disabled={projets.length === 0} title={projets.length === 0 ? 'Aucun projet disponible' : undefined}>
              <Send className="mr-1 h-4 w-4" /> Utiliser dans un projet
            </Button>
          </div>
        </div>

        <div className="mt-3 text-sm">
          <span className="font-bold">Objet : </span>
          <TexteAvecVariables texte={selection.objet} />
        </div>

        {variables.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1 text-xs text-vinci-texte-secondaire">
            Variables remplies automatiquement depuis le projet :
            {variables.map((v) => (
              <span key={v} className="rounded-sm border border-vinci-bleu-moyen bg-vinci-bleu-moyen-clair px-1 font-bold text-vinci-bleu">
                {libelleVariable(v)}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 whitespace-pre-wrap rounded-md border border-vinci-gris-bordure bg-vinci-gris-clair p-4 text-[13px] leading-relaxed">
          <TexteAvecVariables texte={selection.corps} />
        </div>
        <p className="mt-2 text-xs text-vinci-texte-secondaire">
          Les zones <span className="rounded-sm bg-vinci-jaune-clair px-0.5 text-vinci-orange">………</span> sont à compléter lors de la rédaction.
        </p>
      </section>

      <Dialog open={dialogOuvert} onOpenChange={setDialogOuvert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Utiliser « {selection.label} »</DialogTitle>
            <DialogDescription>Choisissez le projet dans lequel créer le courrier.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {projets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProjetChoisi(p.id)}
                onDoubleClick={() => { setProjetChoisi(p.id); router.push(`/projets/${p.id}/courriers/nouveau?modele=${encodeURIComponent(selection.type)}`) }}
                className={cn(
                  'block w-full rounded-md border border-vinci-gris-bordure px-3 py-2 text-left transition hover:bg-vinci-bleu-tres-clair',
                  projetChoisi === p.id && 'border-vinci-bleu bg-vinci-bleu-tres-clair text-vinci-bleu-fonce',
                )}
              >
                <div className="font-medium">{p.nom}</div>
                {p.numeroAffaire && <div className="text-xs text-vinci-texte-secondaire">Affaire {p.numeroAffaire}</div>}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setDialogOuvert(false)}>Annuler</Button>
            <Button onClick={utiliser} disabled={!projetChoisi}>Continuer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
