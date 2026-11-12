'use client'
// Intégration de la liste de diffusion dans les courriers : choix du destinataire et des copies.
import Link from 'next/link'
import { ListPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  basculerCopie, blocDestinataire, estDestinataire, estEnCopie, grouperParRole, nomComplet, type ContactDiffusionDTO,
} from '@/components/modules/diffusion/contacts'

const SELECT = 'h-8 w-full rounded-md border border-vinci-gris-bordure bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-vinci-bleu'

function LienCreerListe({ projetId }: { projetId: string }) {
  return (
    <Link href={`/projets/${projetId}/diffusion`} className="inline-flex items-center gap-1 text-xs font-semibold text-vinci-bleu hover:underline">
      <ListPlus className="h-3.5 w-3.5" />Créer la liste de diffusion
    </Link>
  )
}

/** Sélecteur « Choisir dans la liste de diffusion » : remplit le bloc destinataire (texte toujours éditable). */
export function ChoixDestinataire({ projetId, contacts, onChoisir }: {
  projetId: string; contacts: ContactDiffusionDTO[]; onChoisir: (texte: string) => void
}) {
  if (contacts.length === 0) return <LienCreerListe projetId={projetId} />
  return (
    <select
      aria-label="Choisir dans la liste de diffusion"
      className={SELECT}
      value=""
      onChange={(e) => {
        const c = contacts.find((x) => x.id === e.target.value)
        if (c) onChoisir(blocDestinataire(c))
      }}
    >
      <option value="">Choisir dans la liste de diffusion…</option>
      {grouperParRole(contacts).map((g) => (
        <optgroup key={g.role} label={g.label}>
          {g.contacts.map((c) => (
            <option key={c.id} value={c.id}>{[c.organisation, nomComplet(c)].filter(Boolean).join(' — ')}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

/** Cases à cocher des contacts (hors destinataire) qui alimentent le champ « Copies ». */
export function ChoixCopies({ projetId, contacts, destinataire, copies, onChange }: {
  projetId: string; contacts: ContactDiffusionDTO[]; destinataire: string; copies: string; onChange: (texte: string) => void
}) {
  if (contacts.length === 0) return <LienCreerListe projetId={projetId} />
  const candidats = contacts.filter((c) => !estDestinataire(destinataire, c))
  const nbCoches = candidats.filter((c) => estEnCopie(copies, c)).length
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="btn-toolbar h-8 w-full justify-start text-xs">
          <Users className="mr-1 h-3.5 w-3.5" />Copies depuis la liste de diffusion{nbCoches ? ` (${nbCoches})` : ''}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[60vh] w-[min(420px,90vw)] overflow-y-auto p-2">
        {candidats.length === 0 ? (
          <p className="p-2 text-sm text-vinci-texte-secondaire">Aucun autre contact dans la liste.</p>
        ) : (
          grouperParRole(candidats).map((g) => (
            <div key={g.role} className="mb-1">
              <div className="px-2 pt-1 text-[11px] font-bold uppercase text-vinci-texte-secondaire">{g.label}</div>
              {g.contacts.map((c) => {
                const coche = estEnCopie(copies, c)
                return (
                  <label key={c.id} className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-vinci-bleu-tres-clair">
                    <Checkbox className="mt-0.5" checked={coche} onCheckedChange={(v) => onChange(basculerCopie(copies, c, v === true))} />
                    <span>
                      <span className="font-semibold">{c.organisation}</span>
                      {nomComplet(c) && <span className="text-vinci-texte-secondaire"> — {nomComplet(c)}</span>}
                    </span>
                  </label>
                )
              })}
            </div>
          ))
        )}
      </PopoverContent>
    </Popover>
  )
}
