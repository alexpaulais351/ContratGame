'use client'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { DELAIS_CLES, THEMES_DELAIS, type ThemeDelai } from '@/lib/boite-a-outils/delais-cles'
import { VERSION_CCAG_2021 } from '@/lib/boite-a-outils/sources'
import { AlerteJaune } from './AlerteJaune'

const normaliser = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function DelaisClesClient() {
  const [theme, setTheme] = useState<ThemeDelai | null>(null)
  const [q, setQ] = useState('')

  const lignes = useMemo(() => {
    const n = normaliser(q.trim())
    return DELAIS_CLES.filter(
      (d) =>
        (!theme || d.theme === theme) &&
        (!n || normaliser([d.regle, d.delai, d.depart, d.article, d.consequence, d.theme].join(' ')).includes(n)),
    )
  }, [theme, q])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-titre">Délais clés d’un marché public de travaux</h2>
        <p className="text-sm text-vinci-texte-secondaire">Référence : {VERSION_CCAG_2021} ; code de la commande publique en vigueur.</p>
      </div>
      <AlerteJaune>
        À vérifier au regard du CCAP du marché : les documents particuliers peuvent déroger au CCAG (dérogations récapitulées en fin de CCAP).
      </AlerteJaune>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-vinci-gris" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (ex. réserves, 30 jours, 12.4)…" className="pl-8" aria-label="Rechercher un délai" />
        </div>
        <button
          type="button"
          onClick={() => setTheme(null)}
          className={cn('min-h-9 rounded-full border px-3 text-sm', !theme ? 'border-vinci-bleu bg-vinci-bleu text-white' : 'border-vinci-gris-bordure bg-white hover:bg-vinci-bleu-tres-clair')}
        >
          Tous
        </button>
        {THEMES_DELAIS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(theme === t ? null : t)}
            aria-pressed={theme === t}
            className={cn('min-h-9 rounded-full border px-3 text-sm', theme === t ? 'border-vinci-bleu bg-vinci-bleu text-white' : 'border-vinci-gris-bordure bg-white hover:bg-vinci-bleu-tres-clair')}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="text-xs text-vinci-texte-secondaire" aria-live="polite">{lignes.length} règle{lignes.length > 1 ? 's' : ''}</p>
      <div className="overflow-x-auto rounded-md border border-vinci-gris-bordure">
        <table className="table-vinci min-w-[960px]">
          <thead>
            <tr>
              <th>Thème</th>
              <th>Règle</th>
              <th>Délai</th>
              <th>Point de départ</th>
              <th>Article</th>
              <th>Conséquence si dépassé</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((d, i) => (
              <tr key={i}>
                <td className="whitespace-nowrap text-xs font-semibold text-vinci-bleu">{d.theme}</td>
                <td className="max-w-[320px]">
                  {d.regle}
                  {d.aVerifier && <span className="ml-1 rounded-sm bg-vinci-jaune-clair px-1 text-xs font-semibold text-vinci-orange">à vérifier</span>}
                </td>
                <td className="font-bold">{d.delai}</td>
                <td>{d.depart}</td>
                <td className="whitespace-nowrap text-xs">{d.article}</td>
                <td>{d.consequence}</td>
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-vinci-texte-secondaire">Aucune règle ne correspond à la recherche.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
