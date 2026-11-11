'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ONGLETS_PROJET } from '@/lib/modules-projet'
import { sauvegarderModulesMasques } from '@/actions/infos-projet'

export function ModulesVisibles({ projetId, masquesInitial }: { projetId: string; masquesInitial: string[] }) {
  const [masques, setMasques] = useState<string[]>(masquesInitial)
  const [pending, start] = useTransition()

  const basculer = (key: string, visible: boolean) =>
    setMasques((m) => (visible ? m.filter((k) => k !== key) : [...m, key]))

  function enregistrer() {
    start(async () => {
      const res = await sauvegarderModulesMasques(projetId, masques)
      if (!res.success) return void toast.error(res.error)
      toast.success('Modules mis à jour')
    })
  }

  return (
    <section className="carte space-y-3">
      <h2 className="font-bold text-vinci-bleu">Modules visibles</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {ONGLETS_PROJET.map((onglet) => (
          <div key={onglet.key} className="space-y-2">
            <p className="text-sm font-bold uppercase text-vinci-texte-secondaire">{onglet.label}</p>
            {onglet.modules.map((m) => {
              const id = `mod-${m.key}`
              return (
                <div key={m.key} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={!m.toggleable || !masques.includes(m.key)}
                    disabled={!m.toggleable}
                    onCheckedChange={(v) => basculer(m.key, v === true)}
                  />
                  <Label htmlFor={id} className={m.toggleable ? '' : 'text-vinci-texte-secondaire'}>
                    {m.label}
                    {!m.toggleable && ' (toujours visible)'}
                  </Label>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="outline" className="btn-secondaire" onClick={enregistrer} disabled={pending}>
          Appliquer
        </Button>
      </div>
    </section>
  )
}
