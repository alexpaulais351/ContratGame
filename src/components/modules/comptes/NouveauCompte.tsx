'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { creerCompte } from '@/actions/comptes'
import type { ProjetChoixDTO } from './types'

const vide = { name: '', email: '', password: '', role: 'user' as 'user' | 'admin' }

export function NouveauCompte({ projets }: { projets: ProjetChoixDTO[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(vide)
  const [projetIds, setProjetIds] = useState<string[]>([])
  const [pending, start] = useTransition()

  const valide = form.name.trim() && form.email.trim() && form.password.length >= 8

  function basculer(id: string, coche: boolean) {
    setProjetIds((ids) => (coche ? [...ids, id] : ids.filter((x) => x !== id)))
  }

  function valider() {
    start(async () => {
      try {
        const res = await creerCompte({ ...form, projetIds })
        if (!res.success) return void toast.error(res.error)
        toast.success(`Compte créé pour ${form.name.trim()}`)
        setOpen(false)
        setForm(vide)
        setProjetIds([])
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><UserPlus className="mr-1 h-4 w-4" /> Nouveau compte</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau compte</DialogTitle>
          <DialogDescription>Communiquez le mot de passe initial à l’utilisateur ; il pourra le modifier depuis son profil.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="nc-nom">Nom</Label>
            <Input id="nc-nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-email">Email</Label>
            <Input id="nc-email" type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <div className="space-y-1">
              <Label htmlFor="nc-mdp">Mot de passe initial</Label>
              <Input id="nc-mdp" type="text" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              {form.password && form.password.length < 8 && <p className="text-xs text-vinci-rouge">8 caractères minimum</p>}
            </div>
            <div className="space-y-1">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as 'user' | 'admin' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {projets.length > 0 && (
            <div className="space-y-1">
              <Label>Ajouter comme membre des projets</Label>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-vinci-gris-bordure p-2">
                {projets.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-vinci-bleu-tres-clair">
                    <Checkbox checked={projetIds.includes(p.id)} onCheckedChange={(c) => basculer(p.id, c === true)} />
                    {p.nom}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" className="btn-secondaire" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={valider} disabled={pending || !valide}>{pending ? 'Création…' : 'Créer le compte'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
