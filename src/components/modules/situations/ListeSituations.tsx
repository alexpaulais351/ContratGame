'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatMontant } from '@/lib/utils'
import { libelleMois, MOIS_FR } from '@/lib/mois'
import { creerSituation, supprimerSituation } from '@/actions/situations'
import { StatutBadge } from './StatutBadge'
import type { SituationListeItem } from './types'

type Props = { projetId: string; situations: SituationListeItem[]; anneeDefaut: number; moisDefaut: number }

export function ListeSituations({ projetId, situations, anneeDefaut, moisDefaut }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [creation, setCreation] = useState(false)
  const [libelle, setLibelle] = useState('')
  const [annee, setAnnee] = useState(String(anneeDefaut))
  const [mois, setMois] = useState(String(moisDefaut))
  const [aSupprimer, setASupprimer] = useState<SituationListeItem | null>(null)

  const creer = () => {
    startTransition(async () => {
      const r = await creerSituation(projetId, { libelle, annee: Number(annee), mois: Number(mois) })
      if (!r.success) return void toast.error(r.error)
      setCreation(false)
      setLibelle('')
      toast.success('Situation créée')
      router.push(`/projets/${projetId}/suivi/situations/${r.data.id}`)
    })
  }

  const supprimer = () => {
    if (!aSupprimer) return
    const id = aSupprimer.id
    startTransition(async () => {
      const r = await supprimerSituation(projetId, id)
      if (!r.success) return void toast.error(r.error)
      setASupprimer(null)
      toast.success('Situation supprimée')
    })
  }

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="page-titre">Situations de travaux</h1>
        <Button onClick={() => setCreation(true)}>
          <Plus className="mr-1 h-4 w-4" /> Nouvelle situation
        </Button>
      </div>

      {situations.length === 0 ? (
        <p className="text-vinci-texte-secondaire">Aucune situation. Créez la première situation de travaux.</p>
      ) : (
        <div className="carte overflow-x-auto p-0">
          <table className="table-vinci">
            <thead>
              <tr>
                <th className="w-16">N°</th>
                <th>Libellé</th>
                <th>Période</th>
                <th>Statut</th>
                <th className="text-right">Montant du mois</th>
                <th className="text-right">Montant cumulé</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {situations.map((s) => (
                <tr key={s.id}>
                  <td className="font-bold text-vinci-bleu">{s.numero}</td>
                  <td>
                    <Link href={`/projets/${projetId}/suivi/situations/${s.id}`} className="font-medium text-vinci-bleu hover:underline">
                      {s.libelle || `Situation n°${s.numero}`}
                    </Link>
                  </td>
                  <td>{libelleMois(s.mois, s.annee)}</td>
                  <td><StatutBadge statut={s.statut} /></td>
                  <td className="num">{formatMontant(s.montantMois)}</td>
                  <td className="num font-semibold">{formatMontant(s.montantCumule)}</td>
                  <td>
                    <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => setASupprimer(s)}>
                      <Trash2 className="h-4 w-4 text-vinci-rouge" />
                    </Button>
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
            <DialogTitle>Nouvelle situation</DialogTitle>
            <DialogDescription>
              Le numéro est attribué automatiquement (n°{(situations.reduce((m, s) => Math.max(m, s.numero), 0)) + 1}).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="sit-libelle">Libellé</Label>
              <Input id="sit-libelle" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Situation de travaux" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sit-mois">Mois</Label>
                <select
                  id="sit-mois"
                  value={mois}
                  onChange={(e) => setMois(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus:border-vinci-bleu focus:outline-none"
                >
                  {MOIS_FR.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="sit-annee">Année</Label>
                <Input id="sit-annee" type="number" value={annee} onChange={(e) => setAnnee(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setCreation(false)}>Annuler</Button>
            <Button onClick={creer} disabled={pending}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la situation n°{aSupprimer?.numero} ?</DialogTitle>
            <DialogDescription>
              Les quantités saisies seront perdues. Si aucune autre situation ne porte sur {aSupprimer ? libelleMois(aSupprimer.mois, aSupprimer.annee) : ''},
              les facturations des sous-traitants de ce mois seront également supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setASupprimer(null)}>Annuler</Button>
            <Button variant="destructive" onClick={supprimer} disabled={pending}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
