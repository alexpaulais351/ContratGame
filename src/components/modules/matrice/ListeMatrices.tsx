'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, Plus, Scale, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { creerMatrice, dupliquerMatrice, supprimerMatrice } from '@/actions/matrice'
import { TYPOLOGIES_ACHAT } from '@/lib/matrice-bidcomp'
import { formatDateFR, formatNombreFR } from '@/lib/utils'
import { BadgeDecision, BadgeStatut } from './badges'

export type MatriceResume = {
  id: string
  titre: string
  familleAchats: string | null
  typologieAchat: string
  acheteur: string | null
  nbFournisseurs: number
  statut: string
  meilleur: { nom: string; pourcentage: number; decision: string } | null
  updatedAt: string
}

export function ListeMatrices({ projetId, matrices }: { projetId: string; matrices: MatriceResume[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [creation, setCreation] = useState(false)
  const [aSupprimer, setASupprimer] = useState<MatriceResume | null>(null)
  const [form, setForm] = useState({ titre: '', familleAchats: '', acheteur: '', site: '', typologieAchat: 'Fourniture', nbFournisseurs: 3 })

  function creer() {
    start(async () => {
      const res = await creerMatrice(projetId, form)
      if (!res.success) return void toast.error(res.error)
      setCreation(false)
      router.push(`/projets/${projetId}/matrice/${res.data.id}`)
    })
  }

  function dupliquer(id: string) {
    start(async () => {
      const res = await dupliquerMatrice(projetId, id)
      if (!res.success) return void toast.error(res.error)
      toast.success('Matrice dupliquée')
      router.refresh()
    })
  }

  function supprimer() {
    if (!aSupprimer) return
    const id = aSupprimer.id
    start(async () => {
      const res = await supprimerMatrice(projetId, id)
      if (!res.success) return void toast.error(res.error)
      setASupprimer(null)
      toast.success('Matrice supprimée')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-titre">Matrices décisionnelles d&apos;offres fournisseurs</h1>
          <p className="text-sm text-vinci-texte-secondaire">Bid Comp : comparaison pondérée des offres et aide à la décision GO / NO GO.</p>
        </div>
        <Button onClick={() => setCreation(true)}>
          <Plus /> Nouvelle matrice
        </Button>
      </div>

      {matrices.length === 0 ? (
        <div className="carte flex flex-col items-center gap-3 py-12 text-center">
          <Scale className="size-10 text-vinci-gris" />
          <p className="text-vinci-texte-secondaire">Aucune matrice pour ce projet.</p>
          <Button variant="outline" className="btn-secondaire" onClick={() => setCreation(true)}>
            <Plus /> Créer depuis le gabarit Bid Comp
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-vinci-gris-bordure">
          <table className="table-vinci">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Famille d&apos;achats</th>
                <th>Typologie</th>
                <th className="text-center">Fournisseurs</th>
                <th>Statut</th>
                <th>Meilleur fournisseur</th>
                <th>Mise à jour</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {matrices.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link href={`/projets/${projetId}/matrice/${m.id}`} className="font-bold text-vinci-bleu hover:underline">
                      {m.titre}
                    </Link>
                    {m.acheteur && <div className="text-xs text-vinci-texte-secondaire">Acheteur : {m.acheteur}</div>}
                  </td>
                  <td>{m.familleAchats ?? '—'}</td>
                  <td>{m.typologieAchat || '—'}</td>
                  <td className="text-center tabular-nums">{m.nbFournisseurs}</td>
                  <td>
                    <BadgeStatut statut={m.statut} />
                  </td>
                  <td>
                    {m.meilleur ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{m.meilleur.nom}</span>
                        <span className="tabular-nums text-vinci-texte-secondaire">{formatNombreFR(m.meilleur.pourcentage, 1)} %</span>
                        <BadgeDecision decision={m.meilleur.decision} />
                      </div>
                    ) : (
                      <span className="text-vinci-texte-secondaire">—</span>
                    )}
                  </td>
                  <td className="tabular-nums">{formatDateFR(m.updatedAt)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="icon" className="btn-toolbar size-8" title="Dupliquer" disabled={pending} onClick={() => dupliquer(m.id)}>
                        <Copy />
                      </Button>
                      <Button variant="destructive" size="icon" className="size-8" title="Supprimer" disabled={pending} onClick={() => setASupprimer(m)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={creation} onOpenChange={setCreation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle matrice décisionnelle</DialogTitle>
            <DialogDescription>Créée à partir du gabarit Bid Comp (sections et critères par défaut, modifiables ensuite).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Titre</Label>
              <Input autoFocus value={form.titre} placeholder="Ex. Fourniture de traverses béton" onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Famille d&apos;achats</Label>
              <Input value={form.familleAchats} onChange={(e) => setForm({ ...form, familleAchats: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Typologie d&apos;achat</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-vinci-bleu focus:outline-none"
                value={form.typologieAchat}
                onChange={(e) => setForm({ ...form, typologieAchat: e.target.value })}
              >
                {TYPOLOGIES_ACHAT.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Acheteur</Label>
              <Input value={form.acheteur} onChange={(e) => setForm({ ...form, acheteur: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Site</Label>
              <Input value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Nombre de fournisseurs</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={form.nbFournisseurs}
                onChange={(e) => setForm({ ...form, nbFournisseurs: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setCreation(false)}>
              Annuler
            </Button>
            <Button onClick={creer} disabled={pending || !form.titre.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la matrice ?</DialogTitle>
            <DialogDescription>
              « {aSupprimer?.titre} » et toutes ses notations seront définitivement supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setASupprimer(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={supprimer} disabled={pending}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
