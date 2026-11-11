'use client'
import { useState, useTransition } from 'react'
import { Check, Lock, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { couleursCategorie, type CleSecondaire } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'
import { creerCategorie, supprimerCategorie } from '@/actions/journal'
import { BadgeCategorie } from './BadgeCategorie'
import { TEINTES, type CategorieDTO, type EvenementDTO } from './types'

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  projetId: string
  categories: CategorieDTO[]
  evenements: EvenementDTO[]
}

/** Gestion des catégories : système (non supprimables) + personnalisées (teinte de la palette secondaire VINCI). */
export function CategoriesDialog({ open, onOpenChange, projetId, categories, evenements }: Props) {
  const [nom, setNom] = useState('')
  const [cle, setCle] = useState<CleSecondaire>('bleuMoyen')
  const [aConfirmer, setAConfirmer] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const nbParCategorie = (id: string) => evenements.filter((e) => e.categorieId === id).length

  function ajouter() {
    start(async () => {
      const r = await creerCategorie(projetId, { nom, cle })
      if (!r.success) return void toast.error(r.error)
      toast.success(`Catégorie « ${r.data.nom} » créée`)
      setNom('')
    })
  }

  function supprimer(id: string) {
    start(async () => {
      const r = await supprimerCategorie(projetId, id)
      if (!r.success) return void toast.error(r.error)
      setAConfirmer(null)
      toast.success('Catégorie supprimée')
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setAConfirmer(null)
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-vinci-bleu">Catégories d&apos;événements</DialogTitle>
          <DialogDescription>Les catégories système (créées avec le projet) ne peuvent pas être supprimées. Les catégories personnalisées utilisent une teinte de la palette secondaire VINCI.</DialogDescription>
        </DialogHeader>

        <ul className="divide-y divide-vinci-gris-bordure rounded-sm border border-vinci-gris-bordure">
          {categories.map((c) => {
            const nb = nbParCategorie(c.id)
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <BadgeCategorie nom={c.nom} couleurs={c} />
                  <span className="text-xs text-vinci-texte-secondaire">
                    {nb} événement{nb > 1 ? 's' : ''}
                  </span>
                </div>
                {c.estSysteme ? (
                  <span className="inline-flex items-center gap-1 text-xs text-vinci-gris">
                    <Lock className="h-3.5 w-3.5" /> Système
                  </span>
                ) : aConfirmer === c.id ? (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="btn-secondaire h-8" onClick={() => setAConfirmer(null)} disabled={pending}>
                      Annuler
                    </Button>
                    <Button size="sm" variant="destructive" className="h-8" onClick={() => supprimer(c.id)} disabled={pending}>
                      Confirmer
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-vinci-rouge hover:bg-vinci-rouge-tres-clair hover:text-vinci-rouge-fonce"
                    title={nb > 0 ? `Supprimer (les ${nb} événement(s) passeront sans catégorie)` : 'Supprimer'}
                    onClick={() => setAConfirmer(c.id)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>

        <div className="space-y-3 rounded-sm border border-vinci-gris-bordure bg-vinci-gris-clair p-3">
          <div className="text-sm font-bold text-vinci-bleu">Nouvelle catégorie personnalisée</div>
          <div className="space-y-1">
            <Label htmlFor="cat-nom">Nom</Label>
            <Input id="cat-nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Intempéries" className="bg-white" />
          </div>
          <div className="space-y-1">
            <Label>Teinte (palette secondaire VINCI)</Label>
            <div className="flex flex-wrap gap-2">
              {TEINTES.map((t) => {
                const c = couleursCategorie(t.cle)
                const actif = t.cle === cle
                return (
                  <button
                    key={t.cle}
                    type="button"
                    title={t.libelle}
                    onClick={() => setCle(t.cle)}
                    className={cn('flex h-9 w-9 items-center justify-center rounded-full border-2', actif ? 'ring-2 ring-vinci-bleu ring-offset-2' : '')}
                    style={{ background: c.couleurBg, borderColor: c.couleurBorder }}
                  >
                    {actif ? <Check className="h-4 w-4" style={{ color: c.couleurPoint }} /> : <span className="h-3 w-3 rounded-full" style={{ background: c.couleurPoint }} />}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <BadgeCategorie nom={nom.trim() || 'Aperçu'} couleurs={couleursCategorie(cle)} />
            <Button onClick={ajouter} disabled={pending || !nom.trim()}>
              <Plus /> Ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
