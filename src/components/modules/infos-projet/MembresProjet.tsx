'use client'
import { useMemo, useState, useTransition } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ajouterMembre, changerRoleMembre, retirerMembre } from '@/actions/infos-projet'

type Membre = { id: string; userId: string; nom: string; email: string; role: string }
type Inscrit = { nom: string; email: string; societe: string }

const sansAccent = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function MembresProjet({
  projetId,
  membres,
  inscrits = [],
  estOwner,
  moiId,
}: {
  projetId: string
  membres: Membre[]
  inscrits?: Inscrit[]
  estOwner: boolean
  moiId: string
}) {
  const [email, setEmail] = useState('')
  const [pending, start] = useTransition()
  const [ouvert, setOuvert] = useState(false)
  const suggestions = useMemo(() => {
    const q = sansAccent(email.trim())
    const liste = q ? inscrits.filter((u) => sansAccent(`${u.nom} ${u.email} ${u.societe}`).includes(q)) : inscrits
    return liste.slice(0, 8)
  }, [email, inscrits])

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
          // nom saisi : si un seul inscrit correspond, on l'ajoute directement
          const cible = email.includes('@') ? email : suggestions.length === 1 ? suggestions[0].email : email
          run(() => ajouterMembre(projetId, cible), 'Membre ajouté', () => setEmail(''))
        }}
      >
        <div className="relative min-w-[220px] flex-1 space-y-1">
          <Label htmlFor="ajout-membre">Ajouter un membre (nom ou email)</Label>
          <Input
            id="ajout-membre"
            autoComplete="off"
            placeholder="Rechercher parmi les inscrits du site…"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setOuvert(true)
            }}
            onFocus={() => setOuvert(true)}
            onBlur={() => setTimeout(() => setOuvert(false), 150)}
            role="combobox"
            aria-expanded={ouvert && suggestions.length > 0}
            aria-controls="liste-inscrits"
          />
          {ouvert && suggestions.length > 0 && (
            <ul
              id="liste-inscrits"
              role="listbox"
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-vinci-gris-bordure bg-white py-1 shadow-lg"
            >
              {suggestions.map((u) => (
                <li key={u.email} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-vinci-bleu-tres-clair"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setOuvert(false)
                      run(() => ajouterMembre(projetId, u.email), `${u.nom} ajouté au projet`, () => setEmail(''))
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-vinci-bleu-fonce">{u.nom}</span>
                      <span className="block truncate text-xs text-vinci-texte-secondaire">
                        {u.email}
                        {u.societe ? ` · ${u.societe}` : ''}
                      </span>
                    </span>
                    <UserPlus className="h-4 w-4 shrink-0 text-vinci-bleu" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {ouvert && email.trim() && suggestions.length === 0 && (
            <p className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-vinci-gris-bordure bg-white px-3 py-2 text-xs text-vinci-texte-secondaire shadow-lg">
              Aucun inscrit trouvé — saisissez l’email complet d’un compte validé.
            </p>
          )}
        </div>
        <Button type="submit" disabled={pending || !email.trim()}>
          <UserPlus /> Ajouter
        </Button>
      </form>
    </section>
  )
}
