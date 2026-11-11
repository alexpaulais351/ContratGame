'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sauvegarderInfosProjet } from '@/actions/infos-projet'

export type InfosProjet = {
  name: string
  description: string
  moaNom: string
  moaPrenom: string
  moaAdresse: string
  numeroAffaire: string
  numeroCommande: string
  numeroOTP: string
  adresseChantier: string
  dateDebut: string
  dateFin: string
}

export function InfosProjetForm({ projetId, initial }: { projetId: string; initial: InfosProjet }) {
  const [f, setF] = useState(initial)
  const [pending, start] = useTransition()
  const set = (k: keyof InfosProjet) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }))

  function enregistrer() {
    start(async () => {
      const res = await sauvegarderInfosProjet(projetId, f)
      if (!res.success) return void toast.error(res.error)
      toast.success('Informations enregistrées')
    })
  }

  const champ = (k: keyof InfosProjet, label: string, type = 'text', cls = '') => (
    <div className={`space-y-1 ${cls}`}>
      <Label>{label}</Label>
      <Input type={type} value={f[k]} onChange={set(k)} />
    </div>
  )

  return (
    <section className="carte space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {champ('name', 'Nom du projet', 'text', 'sm:col-span-2')}
        <div className="space-y-1 sm:col-span-2">
          <Label>Description</Label>
          <Textarea rows={3} value={f.description} onChange={set('description')} />
        </div>
      </div>
      <h2 className="font-bold text-vinci-bleu">Maître d&apos;ouvrage</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {champ('moaNom', 'Nom')}
        {champ('moaPrenom', 'Prénom')}
        <div className="space-y-1 sm:col-span-2">
          <Label>Adresse</Label>
          <Textarea rows={2} value={f.moaAdresse} onChange={set('moaAdresse')} />
        </div>
      </div>
      <h2 className="font-bold text-vinci-bleu">Références et chantier</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {champ('numeroAffaire', 'N° d’affaire')}
        {champ('numeroCommande', 'N° de commande')}
        {champ('numeroOTP', 'N° OTP')}
        <div className="space-y-1 sm:col-span-3">
          <Label>Adresse du chantier</Label>
          <Textarea rows={2} value={f.adresseChantier} onChange={set('adresseChantier')} />
        </div>
        {champ('dateDebut', 'Date de début', 'date')}
        {champ('dateFin', 'Date de fin', 'date')}
      </div>
      <div className="flex justify-end">
        <Button onClick={enregistrer} disabled={pending || !f.name.trim()}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </section>
  )
}
