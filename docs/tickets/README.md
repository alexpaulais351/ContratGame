# Module « Tickets » — demandes des utilisateurs à l'administrateur

Module de **Contrat Game** permettant aux utilisateurs de faire remonter leurs demandes à
l'administrateur (améliorations, exports, affichage, anomalies, données, **intégration d'abaque**…)
et à l'administrateur de les traiter et d'y répondre. Ce document sert de **guide d'utilisation** et
de **kit de réutilisation** pour un autre outil (Next.js App Router + Prisma + Tailwind + shadcn/ui).

---

## 1. Guide d'utilisation

### Utilisateur — onglet « Mes demandes »

1. Cliquer sur **Nouvelle demande**.
2. Renseigner : **titre**, **type de demande**, **priorité** (basse / normale / haute),
   **page ou module concerné** (facultatif) et **description** (ce que vous voulez obtenir, ce qui
   ne va pas, comment le reproduire).
3. **Envoyer** : le ticket reçoit un numéro (n°1, n°2…) et apparaît avec le statut « Nouveau ».
4. Suivre son traitement dans la liste (filtres : À traiter, Nouveau, En cours, Résolu, Refusé, Tous) ;
   la **réponse de l'administrateur** s'affiche en dépliant le ticket.
5. Un ticket peut être supprimé par son auteur tant qu'il n'a pas été pris en charge (statut « Nouveau »).

Types de demande :

| Type | Exemples |
|---|---|
| Amélioration | nouvelle fonction, nouveau champ, nouveau calcul |
| Anomalie / bug | erreur, valeur fausse, bouton qui ne répond pas |
| Export (PDF, Excel, Word) | mise en page d'un export, colonne manquante |
| Affichage / ergonomie | lisibilité, ordre des colonnes, couleurs |
| Données / projet | correction ou reprise de données d'un projet |
| **Intégration d'abaque** | ajout d'un abaque, d'une table de calcul ou d'un barème |
| Autre | toute autre demande |

### ⚠️ Intégration d'abaque

> **Pour toute demande d'intégration d'abaque, envoyez le fichier de l'abaque (Excel, PDF, tableau…)
> par e-mail à [alexandre.paulais@vinci-construction.com](mailto:alexandre.paulais@vinci-construction.com?subject=Contrat%20Game%20%E2%80%93%20int%C3%A9gration%20d%E2%80%99abaque)
> ET ouvrez quand même le ticket** (type « Intégration d'abaque ») pour suivre la demande.
>
> Indiquez dans le ticket le nom du fichier envoyé et la date de l'e-mail.

Dans l'application, cet encart est affiché en permanence en haut de l'onglet « Mes demandes » et dans
le formulaire dès que le type « Intégration d'abaque » est choisi (lien `mailto:` avec objet pré-rempli).

### Administrateur — onglet « Tickets »

- Toutes les demandes de tous les utilisateurs, triées par priorité (haute en premier), filtre par défaut « À traiter ».
- En dépliant un ticket : auteur, page concernée, description, puis bloc **Traitement** :
  statut (Nouveau → En cours → Résolu / Refusé), priorité et **réponse à l'auteur**.
- Suppression possible de tout ticket.
- **Pastille** rouge animée « N nouveau(x) » sur l'onglet tant qu'il reste des tickets au statut
  « Nouveau » (rafraîchie à chaque navigation et toutes les 60 s) ; point rouge sur le bouton menu
  en affichage tablette.
- Pour une demande d'abaque : vérifier la réception du fichier par e-mail avant de passer le ticket « En cours ».

---

## 2. Kit de réutilisation

### Fichiers

| Fichier | Rôle |
|---|---|
| `prisma/schema.prisma` | modèle `Ticket` + relation `tickets Ticket[]` sur `User` |
| `prisma/migrations/6_tickets/migration.sql` | création de la table (+ RLS Supabase) |
| `src/components/modules/tickets/types.ts` | catégories, priorités, statuts, e-mail abaques, type DTO |
| `src/actions/tickets.ts` | Server Actions : créer, traiter (admin), supprimer |
| `src/actions/compteurs.ts` | compteurs des pastilles de la barre latérale |
| `src/app/(app)/tickets/page.tsx` | page serveur (admin : tous les tickets ; sinon : les siens) |
| `src/components/modules/tickets/TicketsClient.tsx` | interface (liste, filtres, formulaire, traitement, encart abaque) |
| `src/components/layout/Sidebar.tsx` / `AppShell.tsx` | onglet + pastille |

Dépendances : `zod`, `sonner` (toasts), `lucide-react`, composants shadcn/ui `button`, `dialog`,
`input`, `label`, `textarea`. Helpers du projet à adapter : `requireUser()` (utilisateur connecté et
validé), `estAdmin(userId)` (rôle relu en base), `formatDateFR`, `cn`, jetons de couleurs VINCI
(`VINCI`, `VINCI_SECONDAIRE`, classes Tailwind `vinci-*`).

Pour changer l'adresse de réception des abaques : constante `EMAIL_ABAQUES` dans `types.ts`.

### Modèle Prisma

```prisma
/// Demande remontée par un utilisateur à l'administrateur (amélioration, export, affichage, anomalie…)
model Ticket {
  id          String   @id @default(cuid())
  numero      Int      @default(autoincrement())
  auteurId    String
  titre       String
  description String   @db.Text
  /// 'amelioration' | 'anomalie' | 'export' | 'affichage' | 'donnees' | 'abaque' | 'autre'
  categorie   String   @default("amelioration")
  /// 'basse' | 'normale' | 'haute'
  priorite    String   @default("normale")
  /// 'nouveau' | 'en_cours' | 'resolu' | 'refuse'
  statut      String   @default("nouveau")
  page        String?
  reponse     String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  auteur      User     @relation(fields: [auteurId], references: [id], onDelete: Cascade)

  @@index([statut, createdAt])
}

// + sur le modèle User :
//   tickets        Ticket[]
```

### Migration SQL

```sql
-- Tickets : demandes des utilisateurs à l'administrateur.
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "auteurId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categorie" TEXT NOT NULL DEFAULT 'amelioration',
    "priorite" TEXT NOT NULL DEFAULT 'normale',
    "statut" TEXT NOT NULL DEFAULT 'nouveau',
    "page" TEXT,
    "reponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Ticket_statut_createdAt_idx" ON "Ticket"("statut", "createdAt");
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sécurité Supabase : accès uniquement via Prisma, jamais via l'API PostgREST.
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "Ticket" FROM anon, authenticated;
  END IF;
END $$;
```

### `src/components/modules/tickets/types.ts`

```ts
import type { CleSecondaire } from '@/lib/design-tokens'

type Option = { value: string; label: string; couleur: CleSecondaire | 'rouge' }

export const CATEGORIES_TICKET = [
  { value: 'amelioration', label: 'Amélioration', couleur: 'bleuMoyen' },
  { value: 'anomalie', label: 'Anomalie / bug', couleur: 'orange' },
  { value: 'export', label: 'Export (PDF, Excel, Word)', couleur: 'violet' },
  { value: 'affichage', label: 'Affichage / ergonomie', couleur: 'bleuCiel' },
  { value: 'donnees', label: 'Données / projet', couleur: 'vert' },
  { value: 'abaque', label: 'Intégration d’abaque', couleur: 'jaune' },
  { value: 'autre', label: 'Autre', couleur: 'grisChaud' },
] as const satisfies readonly Option[]

export const PRIORITES_TICKET = [
  { value: 'basse', label: 'Basse', couleur: 'grisChaud' },
  { value: 'normale', label: 'Normale', couleur: 'bleuMoyen' },
  { value: 'haute', label: 'Haute', couleur: 'rouge' },
] as const satisfies readonly Option[]

export const STATUTS_TICKET = [
  { value: 'nouveau', label: 'Nouveau', couleur: 'jaune' },
  { value: 'en_cours', label: 'En cours', couleur: 'bleuMoyen' },
  { value: 'resolu', label: 'Résolu', couleur: 'vert' },
  { value: 'refuse', label: 'Refusé', couleur: 'grisChaud' },
] as const satisfies readonly Option[]

/** Adresse à laquelle envoyer les fichiers d'abaques (le ticket reste à ouvrir). */
export const EMAIL_ABAQUES = 'alexandre.paulais@vinci-construction.com'

export type TicketDTO = {
  id: string
  numero: number
  titre: string
  description: string
  categorie: string
  priorite: string
  statut: string
  page: string | null
  reponse: string | null
  creeLe: string // ISO
  majLe: string // ISO
  auteurNom: string
  auteurEmail: string
  estAuteur: boolean
}

export const optionDe = (liste: readonly Option[], v: string) => liste.find((o) => o.value === v) ?? liste[liste.length - 1]
```

### `src/actions/tickets.ts`

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth-helpers'
import { estAdmin } from '@/lib/est-admin'
import type { ActionResult } from '@/types'
import { CATEGORIES_TICKET, PRIORITES_TICKET, STATUTS_TICKET } from '@/components/modules/tickets/types'

const cles = <T extends { value: string }>(l: readonly T[]) => l.map((x) => x.value) as [string, ...string[]]

function revalider() {
  revalidatePath('/tickets')
  revalidatePath('/', 'layout') // pastille de la barre latérale
}

function erreur(e: unknown): { success: false; error: string } {
  if (e instanceof z.ZodError) return { success: false, error: e.issues[0]?.message ?? 'Données invalides' }
  return { success: false, error: e instanceof Error ? e.message : 'Erreur inattendue' }
}

const creationSchema = z.object({
  titre: z.string().trim().min(3, 'Titre trop court').max(160),
  description: z.string().trim().min(5, 'Décrivez votre demande').max(10000),
  categorie: z.enum(cles(CATEGORIES_TICKET)),
  priorite: z.enum(cles(PRIORITES_TICKET)),
  page: z.string().trim().max(300).optional(),
})

/** Tout utilisateur validé peut ouvrir un ticket. */
export async function creerTicket(data: unknown): Promise<ActionResult<{ numero: number }>> {
  try {
    const user = await requireUser()
    const d = creationSchema.parse(data)
    const t = await prisma.ticket.create({
      data: { auteurId: user.id, titre: d.titre, description: d.description, categorie: d.categorie, priorite: d.priorite, page: d.page || null },
      select: { numero: true },
    })
    revalider()
    return { success: true, data: t }
  } catch (e) {
    return erreur(e)
  }
}

const traitementSchema = z.object({
  statut: z.enum(cles(STATUTS_TICKET)),
  priorite: z.enum(cles(PRIORITES_TICKET)),
  reponse: z.string().trim().max(10000).optional(),
})

/** Administrateur : statut, priorité et réponse à l'auteur. */
export async function traiterTicket(ticketId: string, data: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser()
    if (!(await estAdmin(user.id))) return { success: false, error: 'Réservé aux administrateurs' }
    const d = traitementSchema.parse(data)
    await prisma.ticket.update({ where: { id: ticketId }, data: { statut: d.statut, priorite: d.priorite, reponse: d.reponse || null } })
    revalider()
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}

/** Suppression : l'administrateur, ou l'auteur tant que le ticket n'est pas pris en charge. */
export async function supprimerTicket(ticketId: string): Promise<ActionResult> {
  try {
    const user = await requireUser()
    const t = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { auteurId: true, statut: true } })
    if (!t) return { success: false, error: 'Ticket introuvable' }
    const admin = await estAdmin(user.id)
    if (!admin && !(t.auteurId === user.id && t.statut === 'nouveau')) {
      return { success: false, error: 'Seul un ticket non encore pris en charge peut être supprimé par son auteur' }
    }
    await prisma.ticket.delete({ where: { id: ticketId } })
    revalider()
    return { success: true, data: undefined }
  } catch (e) {
    return erreur(e)
  }
}
```

### `src/actions/compteurs.ts`

```ts
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Compteurs des pastilles de la barre latérale (administrateur) : comptes à valider, nouveaux tickets. */
export async function compteursBarreLaterale(): Promise<{ demandesEnAttente: number; ticketsNouveaux: number }> {
  const session = await auth()
  if (!session?.user?.id) return { demandesEnAttente: 0, ticketsNouveaux: 0 }
  const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, statut: true } })
  if (u?.role !== 'admin' || u.statut !== 'approuve') return { demandesEnAttente: 0, ticketsNouveaux: 0 }
  const [demandesEnAttente, ticketsNouveaux] = await Promise.all([
    prisma.user.count({ where: { statut: 'en_attente' } }),
    prisma.ticket.count({ where: { statut: 'nouveau' } }),
  ])
  return { demandesEnAttente, ticketsNouveaux }
}
```

### `src/app/(app)/tickets/page.tsx`

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { estAdmin as verifierAdmin } from '@/lib/est-admin'
import { TicketsClient } from '@/components/modules/tickets/TicketsClient'
import type { TicketDTO } from '@/components/modules/tickets/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tickets — Contrat Game' }

const ORDRE_PRIORITE: Record<string, number> = { haute: 0, normale: 1, basse: 2 }

export default async function TicketsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const moiId = session.user.id
  const admin = await verifierAdmin(moiId)
  // L'administrateur voit toutes les demandes ; un utilisateur ne voit que les siennes.
  const tickets = await prisma.ticket.findMany({
    where: admin ? {} : { auteurId: moiId },
    include: { auteur: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const dto: TicketDTO[] = tickets
    .map((t) => ({
      id: t.id,
      numero: t.numero,
      titre: t.titre,
      description: t.description,
      categorie: t.categorie,
      priorite: t.priorite,
      statut: t.statut,
      page: t.page,
      reponse: t.reponse,
      creeLe: t.createdAt.toISOString(),
      majLe: t.updatedAt.toISOString(),
      auteurNom: t.auteur.name,
      auteurEmail: t.auteur.email,
      estAuteur: t.auteurId === moiId,
    }))
    .sort((a, b) => (admin ? (ORDRE_PRIORITE[a.priorite] ?? 1) - (ORDRE_PRIORITE[b.priorite] ?? 1) : 0))
  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <TicketsClient tickets={dto} estAdmin={admin} />
      </div>
    </main>
  )
}
```

### `src/components/modules/tickets/TicketsClient.tsx`

```tsx
'use client'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronDown, Mail, ChevronUp, Inbox, MessageSquareReply, Plus, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { VINCI, VINCI_SECONDAIRE } from '@/lib/design-tokens'
import { cn, formatDateFR } from '@/lib/utils'
import { creerTicket, supprimerTicket, traiterTicket } from '@/actions/tickets'
import { CATEGORIES_TICKET, EMAIL_ABAQUES, PRIORITES_TICKET, STATUTS_TICKET, optionDe, type TicketDTO } from './types'

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

function EncartAbaque({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex gap-3 rounded-md border-l-4 border-vinci-jaune bg-vinci-jaune-clair p-3 text-sm" role="note">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-vinci-orange" aria-hidden />
      <div>
        <p className="font-bold">Intégration d’abaque : envoyez aussi le fichier par e-mail</p>
        <p className="mt-0.5">
          Envoyez l’abaque (Excel, PDF, tableau…) par e-mail à{' '}
          <a href={`mailto:${EMAIL_ABAQUES}?subject=${encodeURIComponent('Contrat Game – intégration d’abaque')}`} className="inline-flex items-center gap-1 font-semibold text-vinci-bleu underline">
            <Mail className="h-3.5 w-3.5" aria-hidden />
            {EMAIL_ABAQUES}
          </a>{' '}
          <strong>et ouvrez quand même le ticket</strong>{compact ? '.' : ' (catégorie « Intégration d’abaque ») pour suivre la demande.'}
        </p>
      </div>
    </div>
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
          {f.categorie === 'abaque' && <EncartAbaque />}
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

      {!estAdmin && <EncartAbaque />}

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
```

### Barre latérale et pastille

Dans `Sidebar.tsx`, ajouter l'onglet (libellé « Tickets » pour l'administrateur, « Mes demandes » sinon) :

```tsx
const liens: Lien[] = utilisateur.estAdmin
  ? [
      ...LIENS,
      { href: '/tickets', label: 'Tickets', icon: LifeBuoy, badge: utilisateur.ticketsNouveaux, badgeTexte: 'nouveau' },
      { href: '/comptes', label: 'Comptes', icon: UsersRound, badge: utilisateur.demandesEnAttente, badgeTexte: 'à valider' },
      { href: '/analyse', label: 'Analyse', icon: BarChart3 },
    ]
  : [...LIENS, { href: '/tickets', label: 'Mes demandes', icon: LifeBuoy }]
```

Rendu de la pastille dans le lien (point rouge animé sur l'icône + étiquette) :

```tsx
<span className="relative shrink-0">
  <Icon className="h-4 w-4" aria-hidden />
  {badge ? (
    <span className="absolute -right-1.5 -top-1.5 flex h-2.5 w-2.5" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vinci-rouge opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-vinci-rouge ring-2 ring-vinci-bleu" />
    </span>
  ) : null}
</span>
{label}
{badge ? (
  <span className="ml-auto rounded-full bg-vinci-rouge px-2 py-0.5 text-[11px] font-bold text-white shadow">
    {badge} {badgeTexte === 'nouveau' && badge > 1 ? 'nouveaux' : badgeTexte}
  </span>
) : null}
```

Dans `AppShell.tsx` (composant client) : le layout serveur n'étant pas re-rendu lors des navigations,
les compteurs sont rechargés via la Server Action à chaque changement de page et toutes les 60 s :

```tsx
const pathname = usePathname()
const [compteurs, setCompteurs] = useState({ demandesEnAttente: initial.demandesEnAttente, ticketsNouveaux: initial.ticketsNouveaux ?? 0 })
useEffect(() => {
  if (!initial.estAdmin) return
  let actif = true
  const charger = () => compteursBarreLaterale().then((c) => actif && setCompteurs(c)).catch(() => undefined)
  charger()
  const t = setInterval(charger, 60_000)
  return () => {
    actif = false
    clearInterval(t)
  }
}, [pathname, initial.estAdmin])
```

Et dans le layout serveur `(app)/layout.tsx` (valeur initiale) :

```ts
const ticketsNouveaux = estAdmin ? await prisma.ticket.count({ where: { statut: 'nouveau' } }) : 0
```

---

## 3. Règles de sécurité

- Toute action passe par `requireUser()` : compte connecté **et validé**.
- Traitement (statut, priorité, réponse) réservé aux administrateurs (`estAdmin`, rôle relu en base).
- Un utilisateur ne voit que ses propres tickets ; il ne peut supprimer que les siens au statut « Nouveau ».
- Validation des données par `zod` (longueurs, valeurs de catégories / priorités / statuts).
- Sur Supabase : RLS activée et droits retirés aux rôles `anon` / `authenticated` (accès uniquement via Prisma).
