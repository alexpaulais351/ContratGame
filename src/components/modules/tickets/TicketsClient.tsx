'use client'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Inbox, MessageSquareReply, Plus, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import { cn, formatDateFR } from '@/lib/utils'
import { creerTicket, supprimerTicket, traiterTicket } from '@/actions/tickets'
import { CATEGORIES_TICKET, PRIORITES_TICKET, STATUTS_TICKET, optionDe, type TicketDTO } from './types'

const SELECT = 'h-10 w-full rounded-md border border-vinci-gris-bordure bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vinci-bleu'

function couleurs(c: string) {
  if (c === 'rouge') return { bg: VINCI.rougeTresClair, bd: VINCI.rouge }
  const s = VINCI_SECONDAIRE[c as keyof typeof VINCI_SECONDAIRE]
  return { bg: s.clair, bd: s.base }
}

function Pastille({ couleur, children }: { couleur: string; children: React.ReactNode }) {
  const c = couleurs(couleur)
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: c.bg, borderColor: c.bd, color: VINCI.noir }}>
      {children}
    </span>
  )
}

function NouveauTicket({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [f, setF] = useState({ titre: '', description: '', categorie: 'amelioration', priorite: 'normale', page: '' })
  const maj = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const envoyer = () =>
    start(async () => {
      const res = await creerTicket(f)
      if (!res.success) return void toast.error(res.error)
      toast.success(`Ticket n°${res.data.numero} envoyé à l’administrateur`)
      setF({ titre: '', description: '', categorie: 'amelioration', priorite: 'normale', page: '' })
      onOpenChange(false)
      router.refresh()
    })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouvelle demande</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="t-titre">Titre</Label>
            <Input id="t-titre" value={f.titre} onChange={maj('titre')} placeholder="Ex. : ajouter le n° de marché dans l’en-tête du PDF de situation" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="t-cat">Type de demande</Label>
              <select id="t-cat" className={SELECT} value={f.categorie} onChange={maj('categorie')}>
                {CATEGORIES_TICKET.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-prio">Priorité</Label>
              <select id="t-prio" className={SELECT} value={f.priorite} onChange={maj('priorite')}>
                {PRIORITES_TICKET.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="t-page">Page ou module concerné (facultatif)</Label>
            <Input id="t-page" value={f.page} onChange={maj('page')} placeholder="Ex. : Situations, export PDF" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea id="t-desc" rows={6} value={f.description} onChange={maj('description')} placeholder="Ce que vous voulez obtenir, ce qui ne va pas, comment le reproduire…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={envoyer} disabled={pending || f.titre.trim().length < 3 || f.description.trim().length < 5}>
            <Send /> {pending ? 'Envoi…' : 'Envoyer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Traitement({ t }: { t: TicketDTO }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [statut, setStatut] = useState(t.statut)
  const [priorite, setPriorite] = useState(t.priorite)
  const [reponse, setReponse] = useState(t.reponse ?? '')
  const enregistrer = () =>
    start(async () => {
      const res = await traiterTicket(t.id, { statut, priorite, reponse })
      if (!res.success) return void toast.error(res.error)
      toast.success('Ticket mis à jour')
      router.refresh()
    })
  return (
    <div className="space-y-3 rounded-md border border-vinci-bleu/30 bg-vinci-bleu-tres-clair p-3">
      <p className="flex items-center gap-2 text-sm font-bold text-vinci-bleu-fonce">
        <MessageSquareReply className="h-4 w-4" aria-hidden /> Traitement (administrateur)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`st-${t.id}`}>Statut</Label>
          <select id={`st-${t.id}`} className={SELECT} value={statut} onChange={(e) => setStatut(e.target.value)}>
            {STATUTS_TICKET.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`pr-${t.id}`}>Priorité</Label>
          <select id={`pr-${t.id}`} className={SELECT} value={priorite} onChange={(e) => setPriorite(e.target.value)}>
            {PRIORITES_TICKET.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`rep-${t.id}`}>Réponse à l’auteur</Label>
        <Textarea id={`rep-${t.id}`} rows={3} value={reponse} onChange={(e) => setReponse(e.target.value)} placeholder="Visible par l’auteur du ticket" />
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={enregistrer} disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}

export function TicketsClient({ tickets, estAdmin }: { tickets: TicketDTO[]; estAdmin: boolean }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [filtre, setFiltre] = useState<string>(estAdmin ? 'a_traiter' : 'tous')
  const [deplie, setDeplie] = useState<string | null>(null)
  const [, start] = useTransition()

  const compte = useMemo(() => {
    const c: Record<string, number> = { tous: tickets.length, a_traiter: 0 }
    for (const t of tickets) {
      c[t.statut] = (c[t.statut] ?? 0) + 1
      if (t.statut === 'nouveau' || t.statut === 'en_cours') c.a_traiter++
    }
    return c
  }, [tickets])

  const visibles = tickets.filter((t) =>
    filtre === 'tous' ? true : filtre === 'a_traiter' ? t.statut === 'nouveau' || t.statut === 'en_cours' : t.statut === filtre,
  )

  const filtres = [
    { v: 'a_traiter', l: 'À traiter' },
    ...STATUTS_TICKET.map((s) => ({ v: s.value as string, l: s.label as string })),
    { v: 'tous', l: 'Tous' },
  ]

  const supprimer = (t: TicketDTO) => {
    if (!confirm(`Supprimer le ticket n°${t.numero} ?`)) return
    start(async () => {
      const res = await supprimerTicket(t.id)
      if (!res.success) return void toast.error(res.error)
      toast.success('Ticket supprimé')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-titre">{estAdmin ? 'Tickets' : 'Mes demandes'}</h1>
          <p className="text-sm text-vinci-texte-secondaire">
            {estAdmin
              ? 'Demandes remontées par les utilisateurs : améliorations, exports, affichage, anomalies…'
              : 'Faites remonter vos demandes à l’administrateur : améliorations, exports, affichage, anomalies… Vous suivez ici leur traitement.'}
          </p>
        </div>
        <Button onClick={() => setOuvert(true)}>
          <Plus /> Nouvelle demande
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les tickets">
        {filtres.map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => setFiltre(f.v)}
            aria-pressed={filtre === f.v}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-semibold transition-colors',
              filtre === f.v ? 'border-vinci-bleu bg-vinci-bleu text-white' : 'border-vinci-gris-bordure bg-white text-vinci-bleu-fonce hover:border-vinci-bleu',
            )}
          >
            {f.l} <span className="ml-1 opacity-75">{compte[f.v] ?? 0}</span>
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="carte flex flex-col items-center gap-2 py-10 text-center text-vinci-texte-secondaire">
          <Inbox className="h-8 w-8" aria-hidden />
          <p>Aucun ticket dans cette catégorie.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visibles.map((t) => {
            const ouvertT = deplie === t.id
            const st = optionDe(STATUTS_TICKET, t.statut)
            return (
              <li key={t.id} className="carte p-0" style={{ borderLeft: `4px solid ${couleurs(st.couleur).bd}` }}>
                <button type="button" className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left" onClick={() => setDeplie(ouvertT ? null : t.id)} aria-expanded={ouvertT}>
                  <span className="text-sm font-bold text-vinci-texte-secondaire">n°{t.numero}</span>
                  <span className="min-w-0 flex-1 font-semibold text-vinci-bleu-fonce">{t.titre}</span>
                  <Pastille couleur={optionDe(CATEGORIES_TICKET, t.categorie).couleur}>{optionDe(CATEGORIES_TICKET, t.categorie).label}</Pastille>
                  {t.priorite === 'haute' && <Pastille couleur="rouge">Priorité haute</Pastille>}
                  <Pastille couleur={st.couleur}>{st.label}</Pastille>
                  <span className="text-xs text-vinci-texte-secondaire">
                    {estAdmin ? `${t.auteurNom} · ` : ''}
                    {formatDateFR(new Date(t.creeLe))}
                  </span>
                  {ouvertT ? <ChevronUp className="h-4 w-4 text-vinci-bleu" aria-hidden /> : <ChevronDown className="h-4 w-4 text-vinci-bleu" aria-hidden />}
                </button>
                {ouvertT && (
                  <div className="space-y-3 border-t border-vinci-gris-bordure px-4 py-3">
                    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="inline font-semibold">Auteur : </dt>
                        <dd className="inline">
                          {t.auteurNom} ({t.auteurEmail})
                        </dd>
                      </div>
                      {t.page && (
                        <div>
                          <dt className="inline font-semibold">Page / module : </dt>
                          <dd className="inline">{t.page}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="inline font-semibold">Priorité : </dt>
                        <dd className="inline">{optionDe(PRIORITES_TICKET, t.priorite).label}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Mis à jour : </dt>
                        <dd className="inline">{formatDateFR(new Date(t.majLe))}</dd>
                      </div>
                    </dl>
                    <p className="whitespace-pre-wrap rounded-md bg-vinci-gris-clair p-3 text-sm">{t.description}</p>
                    {t.reponse && !estAdmin && (
                      <div className="rounded-md border-l-4 border-vinci-bleu bg-vinci-bleu-tres-clair p-3 text-sm">
                        <p className="mb-1 font-bold text-vinci-bleu-fonce">Réponse de l’administrateur</p>
                        <p className="whitespace-pre-wrap">{t.reponse}</p>
                      </div>
                    )}
                    {estAdmin && <Traitement t={t} />}
                    {(estAdmin || (t.estAuteur && t.statut === 'nouveau')) && (
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="text-vinci-rouge" onClick={() => supprimer(t)}>
                          <Trash2 /> Supprimer
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <NouveauTicket open={ouvert} onOpenChange={setOuvert} />
    </div>
  )
}
