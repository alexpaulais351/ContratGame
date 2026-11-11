'use client'
import { useState, useTransition } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ajouterMembre, changerRoleMembre, retirerMembre } from '@/actions/infos-projet'

type Membre = { id: string; userId: string; nom: string; email: string; role: string }

export function MembresProjet({
  projetId,
  membres,
  estOwner,
  moiId,
}: {
  projetId: string
  membres: Membre[]
  estOwner: boolean
  moiId: string
}) {
  const [email, setEmail] = useState('')
  const [pending, start] = useTransition()

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, ok: string, apres?: () => void) =>
    start(async () => {
      const res = await fn()
      if (!res.success) return void toast.error(res.error ?? 'Erreur')
      apres?.()
      toast.success(ok)
    })

  return (
    <section className="carte space-y-3">
      <h2 className="font-bold text-vinci-bleu">Membres</h2>
      <div className="overflow-x-auto">
        <table className="table-vinci w-full">
          <thead>
            <tr>
              <th className="text-left">Nom</th>
              <th className="text-left">Email</th>
              <th className="text-left">Rôle</th>
              {estOwner && <th className="w-12" />}
            </tr>
          </thead>
          <tbody>
            {membres.map((m) => (
              <tr key={m.id}>
                <td>
                  {m.nom}
                  {m.userId === moiId && <span className="ml-1 text-xs text-vinci-texte-secondaire">(vous)</span>}
                </td>
                <td>{m.email}</td>
                <td>
                  {estOwner ? (
                    <Select
                      value={m.role}
                      disabled={pending}
                      onValueChange={(v) => run(() => changerRoleMembre(projetId, m.id, v), 'Rôle modifié')}
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Propriétaire</SelectItem>
                        <SelectItem value="member">Membre</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{m.role === 'owner' ? 'Propriétaire' : 'Membre'}</Badge>
                  )}
                </td>
                {estOwner && (
                  <td>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Retirer ${m.nom}`}
                      disabled={pending}
                      onClick={() => run(() => retirerMembre(projetId, m.id), 'Membre retiré')}
                    >
                      <Trash2 className="text-vinci-rouge" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => ajouterMembre(projetId, email), 'Membre ajouté', () => setEmail(''))
        }}
      >
        <div className="min-w-[220px] flex-1 space-y-1">
          <Label>Ajouter un membre par email</Label>
          <Input type="email" placeholder="utilisateur@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" disabled={pending || !email.trim()}>
          <UserPlus /> Ajouter
        </Button>
      </form>
    </section>
  )
}
