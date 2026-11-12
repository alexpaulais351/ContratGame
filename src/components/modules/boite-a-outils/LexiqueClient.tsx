'use client'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { LEXIQUE } from '@/lib/boite-a-outils/lexique'

const normaliser = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function LexiqueClient() {
  const [q, setQ] = useState('')
  const entrees = useMemo(() => {
    const n = normaliser(q.trim())
    const tri = [...LEXIQUE].sort((a, b) => (a.sigle === '—' ? a.terme : a.sigle).localeCompare(b.sigle === '—' ? b.terme : b.sigle, 'fr'))
    if (!n) return tri
    return tri.filter((e) => normaliser(`${e.sigle} ${e.terme} ${e.definition}`).includes(n))
  }, [q])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-titre">Lexique du contractuel BTP</h2>
        <p className="text-sm text-vinci-texte-secondaire">Sigles et notions courantes des marchés de travaux.</p>
      </div>
      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-vinci-gris" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un sigle ou un terme…" className="pl-8" aria-label="Rechercher dans le lexique" />
      </div>
      <p className="text-xs text-vinci-texte-secondaire" aria-live="polite">{entrees.length} entrée{entrees.length > 1 ? 's' : ''}</p>
      <dl className="grid gap-3 md:grid-cols-2">
        {entrees.map((e) => (
          <div key={e.sigle + e.terme} className="carte">
            <dt className="flex flex-wrap items-baseline gap-2">
              {e.sigle !== '—' && <span className="rounded-sm bg-vinci-bleu px-1.5 py-0.5 text-sm font-bold text-white">{e.sigle}</span>}
              <span className="font-bold text-vinci-bleu">{e.terme}</span>
            </dt>
            <dd className="mt-1 text-sm">
              {e.definition}
              {e.reference && <span className="mt-1 block text-xs text-vinci-texte-secondaire">Réf. : {e.reference}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {entrees.length === 0 && <p className="text-sm text-vinci-texte-secondaire">Aucun résultat.</p>}
    </div>
  )
}
