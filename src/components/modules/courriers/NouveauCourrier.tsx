'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { creerCourrier } from '@/actions/courriers'
import { MODELES_COURRIERS, appliquerVariables, type ModeleCourrier } from '@/lib/courriers-templates'
import { formatDateFR } from '@/lib/utils'
import { useProfilStore } from '@/stores/profil'
import { cn } from '@/lib/utils'
import type { ContexteProjetDTO } from './types'

export function NouveauCourrier({ projetId, referenceSuggeree, contexte }: { projetId: string; referenceSuggeree: string; contexte: ContexteProjetDTO }) {
  const router = useRouter()
  const profil = useProfilStore((s) => s.profil)
  const [modele, setModele] = useState<ModeleCourrier | null>(null)
  const [pending, start] = useTransition()
  const [form, setForm] = useState({ reference: referenceSuggeree, objet: '', destinataire: '', corps: '' })

  const choisir = (m: ModeleCourrier) => {
    const ctx = { ...contexte, date: formatDateFR(new Date()), societe: profil?.nomSociete ?? '', signataire: profil?.nom ?? '' }
    setModele(m)
    setForm((f) => ({
      ...f,
      objet: appliquerVariables(m.objet, ctx).replace(/…+/g, '').replace(/\s+–\s*$/, ' – ').trimStart(),
      destinataire: [contexte.moa, contexte.moaAdresse].filter(Boolean).join('\n'),
      corps: appliquerVariables(m.corps, ctx),
    }))
  }

  const creer = () => {
    if (!modele) return
    start(async () => {
      const res = await creerCourrier(projetId, {
        type: modele.type,
        modeEnvoi: modele.modeEnvoi,
        reference: form.reference,
        objet: form.objet,
        destinataire: form.destinataire,
        corps: form.corps,
        expediteur: profil?.nomSociete ?? '',
        signataireNom: profil?.nom ?? '',
      })
      if (!res.success) return void toast.error(res.error)
      toast.success('Courrier créé')
      router.push(`/projets/${projetId}/courriers/${res.data.id}`)
    })
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" className="btn-toolbar"><Link href={`/projets/${projetId}/courriers`}><ArrowLeft className="mr-1 h-4 w-4" />Courriers</Link></Button>
        <h1 className="page-titre">Nouveau courrier</h1>
      </div>

      <h2 className="mb-2 text-sm font-bold uppercase text-vinci-texte-secondaire">1. Choisir un modèle</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MODELES_COURRIERS.map((m) => (
          <button
            key={m.type}
            type="button"
            onClick={() => choisir(m)}
            className={cn(
              'carte text-left transition hover:bg-vinci-bleu-tres-clair',
              modele?.type === m.type && 'border-vinci-bleu bg-vinci-bleu-tres-clair ring-2 ring-vinci-bleu'
            )}
          >
            <FileText className="mb-2 h-5 w-5 text-vinci-bleu" />
            <div className="font-bold text-vinci-bleu">{m.label}</div>
            <div className="mt-1 text-xs text-vinci-texte-secondaire">{m.description}</div>
          </button>
        ))}
      </div>

      {modele && (
        <>
          <h2 className="mb-2 text-sm font-bold uppercase text-vinci-texte-secondaire">2. Compléter</h2>
          <div className="carte space-y-4">
            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
              <div>
                <Label htmlFor="ref">Référence</Label>
                <Input id="ref" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="objet">Objet</Label>
                <Input id="objet" value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="dest">Destinataire (adresse)</Label>
              <Textarea id="dest" rows={3} value={form.destinataire} onChange={(e) => setForm({ ...form, destinataire: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="corps">Corps du courrier</Label>
              <Textarea id="corps" rows={16} value={form.corps} onChange={(e) => setForm({ ...form, corps: e.target.value })} className="font-mono text-[13px]" />
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild variant="outline" className="btn-secondaire"><Link href={`/projets/${projetId}/courriers`}>Annuler</Link></Button>
              <Button onClick={creer} disabled={pending}>{pending ? 'Création…' : 'Créer le courrier'}</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
