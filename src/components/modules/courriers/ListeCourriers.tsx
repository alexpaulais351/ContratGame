'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateFR } from '@/lib/utils'
import { MODELES_COURRIERS, libelleTypeCourrier } from '@/lib/courriers-templates'
import { BadgeStatutCourrier } from './BadgeStatut'

type Ligne = {
  id: string; reference: string; objet: string; type: string; destinataire: string
  statut: 'brouillon' | 'envoye'; dateEnvoi: string | null; createdAt: string
}

const SELECT = 'h-10 rounded-md border border-vinci-gris-bordure bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vinci-bleu'

export function ListeCourriers({ projetId, courriers }: { projetId: string; courriers: Ligne[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [statut, setStatut] = useState('')

  const filtres = useMemo(() => {
    const n = q.trim().toLowerCase()
    return courriers.filter(
      (c) =>
        (!type || c.type === type) &&
        (!statut || c.statut === statut) &&
        (!n || [c.reference, c.objet, c.destinataire].some((v) => v.toLowerCase().includes(n)))
    )
  }, [courriers, q, type, statut])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-titre">Courriers</h1>
        <Button asChild>
          <Link href={`/projets/${projetId}/courriers/nouveau`}><Plus className="mr-1 h-4 w-4" />Nouveau courrier</Link>
        </Button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-vinci-gris" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (référence, objet, destinataire)" className="pl-9" />
        </div>
        <select className={SELECT} value={type} onChange={(e) => setType(e.target.value)} aria-label="Filtrer par type">
          <option value="">Tous les types</option>
          {MODELES_COURRIERS.map((m) => <option key={m.type} value={m.type}>{m.label}</option>)}
        </select>
        <select className={SELECT} value={statut} onChange={(e) => setStatut(e.target.value)} aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="envoye">Envoyé</option>
        </select>
      </div>
      {filtres.length === 0 ? (
        <p className="carte text-vinci-texte-secondaire">
          {courriers.length === 0 ? 'Aucun courrier. Créez votre premier courrier à partir d’un modèle.' : 'Aucun courrier ne correspond aux filtres.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-vinci-gris-bordure">
          <table className="table-vinci">
            <thead>
              <tr>
                <th>Référence</th><th>Date</th><th>Objet</th><th>Type</th><th>Destinataire</th><th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((c) => (
                <tr key={c.id} className="cursor-pointer hover:bg-vinci-bleu-tres-clair" onClick={() => router.push(`/projets/${projetId}/courriers/${c.id}`)}>
                  <td className="whitespace-nowrap font-semibold text-vinci-bleu">
                    <Link href={`/projets/${projetId}/courriers/${c.id}`}>{c.reference || '—'}</Link>
                  </td>
                  <td className="whitespace-nowrap">{formatDateFR(c.dateEnvoi ?? c.createdAt)}</td>
                  <td>{c.objet || <span className="text-vinci-gris">(sans objet)</span>}</td>
                  <td className="whitespace-nowrap">{libelleTypeCourrier(c.type)}</td>
                  <td className="max-w-[260px] truncate">{c.destinataire.split('\n')[0]}</td>
                  <td><BadgeStatutCourrier statut={c.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
