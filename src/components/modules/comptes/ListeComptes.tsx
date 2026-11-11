'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { KeyRound, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { changerRole, reinitialiserMotDePasse, supprimerCompte } from '@/actions/comptes'
import { formatDateFR } from '@/lib/utils'
import type { CompteDTO } from './types'

type DialogEtat = { mode: 'mdp' | 'suppr'; compte: CompteDTO } | null

export function ListeComptes({ comptes, moiId }: { comptes: CompteDTO[]; moiId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [dialog, setDialog] = useState<DialogEtat>(null)
  const [mdp, setMdp] = useState('')
  const nbAdmins = comptes.filter((c) => c.role === 'admin').length

  function executer(fn: () => Promise<{ success: boolean; error?: string }>, ok: string, apres?: () => void) {
    start(async () => {
      try {
        const res = await fn()
        if (!res.success) return void toast.error(res.error ?? 'Erreur')
        toast.success(ok)
        apres?.()
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-vinci-gris-bordure">
        <table className="table-vinci">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th className="w-44">Rôle</th>
              <th className="text-center">Projets</th>
              <th>Créé le</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {comptes.map((c) => {
              const estMoi = c.id === moiId
              const dernierAdmin = c.role === 'admin' && nbAdmins <= 1
              const roleBloque = estMoi || dernierAdmin
              return (
                <tr key={c.id} data-selected={estMoi || undefined}>
                  <td className="font-medium">
                    {c.name}
                    {estMoi && <span className="ml-2 text-xs text-vinci-texte-secondaire">(vous)</span>}
                  </td>
                  <td>{c.email}</td>
                  <td>
                    <Select
                      value={c.role}
                      disabled={pending || roleBloque}
                      onValueChange={(v) => executer(() => changerRole(c.id, v), `Rôle de ${c.name} mis à jour`)}
                    >
                      <SelectTrigger className="h-8 bg-white" title={roleBloque ? (estMoi ? 'Vous ne pouvez pas modifier votre propre rôle' : 'Dernier administrateur') : undefined}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Utilisateur</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="text-center tabular-nums">{c.nbProjets}</td>
                  <td>{formatDateFR(c.createdAt)}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="btn-toolbar" onClick={() => { setMdp(''); setDialog({ mode: 'mdp', compte: c }) }}>
                        <KeyRound className="mr-1 h-4 w-4" /> Mot de passe
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={estMoi || dernierAdmin}
                        title={estMoi ? 'Vous ne pouvez pas supprimer votre propre compte' : dernierAdmin ? 'Dernier administrateur' : undefined}
                        onClick={() => setDialog({ mode: 'suppr', compte: c })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={dialog?.mode === 'mdp'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>Nouveau mot de passe pour {dialog?.compte.name} ({dialog?.compte.email}).</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="rz-mdp">Nouveau mot de passe</Label>
            <Input id="rz-mdp" type="text" autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} autoFocus />
            {mdp && mdp.length < 8 && <p className="text-xs text-vinci-rouge">8 caractères minimum</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setDialog(null)}>Annuler</Button>
            <Button
              disabled={pending || mdp.length < 8}
              onClick={() => dialog && executer(() => reinitialiserMotDePasse(dialog.compte.id, { password: mdp }), 'Mot de passe réinitialisé', () => setDialog(null))}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog?.mode === 'suppr'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le compte</DialogTitle>
            <DialogDescription>
              Supprimer définitivement le compte de <strong>{dialog?.compte.name}</strong> ({dialog?.compte.email}) ?
              Les projets dont il est le seul propriétaire vous seront transférés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="btn-secondaire" onClick={() => setDialog(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                dialog &&
                start(async () => {
                  try {
                    const res = await supprimerCompte(dialog.compte.id)
                    if (!res.success) return void toast.error(res.error)
                    const n = res.data.projetsTransferes
                    toast.success(n > 0 ? `Compte supprimé — ${n} projet${n > 1 ? 's' : ''} transféré${n > 1 ? 's' : ''}` : 'Compte supprimé')
                    setDialog(null)
                    router.refresh()
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Erreur')
                  }
                })
              }
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
