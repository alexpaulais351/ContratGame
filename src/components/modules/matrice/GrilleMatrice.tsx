'use client'
import { Fragment, memo } from 'react'
import { ArrowLeft, ArrowRight, MoreHorizontal, Plus, Trash2, Wand2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DECISIONS, INCOTERMS, TYPES_CRITERE, type DecisionFournisseur } from '@/lib/matrice-bidcomp'
import { cn, formatNombreFR } from '@/lib/utils'
import { CelluleNotation, type PatchNotation } from './CelluleNotation'
import { ChampNombre } from './ChampNombre'
import { cleNotation, formatMontantDevise, grouperParSection, symboleDevise, type AnalyseMatrice } from './grille'
import type { CritereVue, FournisseurVue, NotationVue } from './types'

export type PatchFournisseur = Partial<Omit<FournisseurVue, 'id'>>
export type PatchCritere = Partial<Pick<CritereVue, 'libelle' | 'coefficient'>>

type Props = {
  fournisseurs: FournisseurVue[]
  criteres: CritereVue[]
  notations: Record<string, NotationVue>
  analyse: AnalyseMatrice
  devise: string
  seuilGo: number
  onFournisseur: (id: string, patch: PatchFournisseur) => void
  onCritere: (id: string, patch: PatchCritere) => void
  onNotation: (critereId: string, fournisseurId: string, patch: PatchNotation) => void
  onCommentaire: (critereId: string, fournisseurId: string) => void
  onAjouterCritere: (famille: string) => void
  onSupprimerCritere: (c: CritereVue) => void
  onSupprimerFournisseur: (f: FournisseurVue) => void
  onDeplacerFournisseur: (id: string, sens: -1 | 1) => void
}

const TD = 'border-b border-r border-vinci-gris-bordure px-1.5 py-1'
const COL_CRITERE = 'sticky left-0 z-[5] min-w-[260px] max-w-[340px] border-r-2 border-r-vinci-gris-bordure'
const LIBELLE_TYPE: Record<string, string> = Object.fromEntries(TYPES_CRITERE.map((t) => [t.value, t.label]))

function LigneInfo({
  label,
  fournisseurs,
  pair,
  rendu,
}: {
  label: string
  fournisseurs: FournisseurVue[]
  pair: boolean
  rendu: (f: FournisseurVue) => React.ReactNode
}) {
  const fond = pair ? 'bg-vinci-gris-clair' : 'bg-white'
  return (
    <tr className={fond}>
      <td className={cn(TD, COL_CRITERE, fond, 'font-medium')}>{label}</td>
      <td className={cn(TD, 'text-center text-vinci-gris')}>—</td>
      {fournisseurs.map((f) => (
        <td key={f.id} className={cn(TD, 'p-0.5')}>
          {rendu(f)}
        </td>
      ))}
    </tr>
  )
}

function GrilleMatriceBase(p: Props) {
  const { fournisseurs, criteres, notations, analyse, devise } = p
  const sections = grouperParSection(criteres)
  const nbCols = fournisseurs.length + 2
  let ligne = 0

  return (
    <div className="max-h-[calc(100vh-220px)] overflow-auto rounded-md border border-vinci-gris-bordure bg-white">
      <table className="w-max min-w-full border-separate border-spacing-0 text-[14px]">
        <thead>
          <tr>
            <th className={cn(TD, COL_CRITERE, 'sticky top-0 z-30 bg-vinci-bleu text-left font-bold text-white')}>Critère</th>
            <th className={cn(TD, 'sticky top-0 z-20 w-16 bg-vinci-bleu text-center font-bold text-white')}>Coef.</th>
            {fournisseurs.map((f, i) => (
              <th key={f.id} className={cn(TD, 'sticky top-0 z-20 min-w-[190px] bg-vinci-bleu text-left font-bold text-white')}>
                <div className="flex items-center gap-1">
                  <span className="shrink-0 rounded-sm bg-vinci-bleu-fonce px-1 text-[12px] tabular-nums" title="Rang (ordre des colonnes)">
                    {i + 1}
                  </span>
                  <input
                    aria-label="Nom du fournisseur"
                    className="min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-1 py-0.5 font-bold text-white outline-none placeholder:text-vinci-bleu-tres-clair focus:border-white focus:bg-vinci-bleu-fonce"
                    value={f.nom}
                    placeholder="Nom du fournisseur"
                    onChange={(e) => p.onFournisseur(f.id, { nom: e.target.value })}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label="Actions fournisseur" className="rounded-sm p-0.5 hover:bg-vinci-bleu-fonce">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled={i === 0} onSelect={() => p.onDeplacerFournisseur(f.id, -1)}>
                        <ArrowLeft /> Déplacer à gauche
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={i === fournisseurs.length - 1} onSelect={() => p.onDeplacerFournisseur(f.id, 1)}>
                        <ArrowRight /> Déplacer à droite
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-vinci-rouge focus:text-vinci-rouge" onSelect={() => p.onSupprimerFournisseur(f)}>
                        <Trash2 /> Supprimer le fournisseur
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => {
            return (
              <Fragment key={s.cle}>
                <tr>
                  <td className={cn(TD, COL_CRITERE, 'bg-vinci-bleu-clair py-1.5 font-bold uppercase tracking-wide text-white')}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{s.libelle}</span>
                      <button
                        type="button"
                        onClick={() => p.onAjouterCritere(s.cle)}
                        className="flex items-center gap-1 rounded-sm px-1 py-0.5 text-[12px] font-medium normal-case tracking-normal text-white/90 hover:bg-vinci-bleu-fonce"
                        title="Ajouter un critère personnalisé dans cette section"
                      >
                        <Plus className="size-3.5" /> Critère
                      </button>
                    </div>
                  </td>
                  <td colSpan={nbCols - 1} className={cn(TD, 'bg-vinci-bleu-clair')} />
                </tr>

                {s.cle === 'offre' && (
                  <>
                    <LigneInfo label="Réf. offre" pair={ligne++ % 2 === 1} fournisseurs={fournisseurs} rendu={(f) => (
                      <input className="cell-input h-7" aria-label="Référence de l'offre" value={f.refOffre ?? ''} onChange={(e) => p.onFournisseur(f.id, { refOffre: e.target.value || null })} />
                    )} />
                    <LigneInfo label="Date de l'offre" pair={ligne++ % 2 === 1} fournisseurs={fournisseurs} rendu={(f) => (
                      <input type="date" className="cell-input h-7" aria-label="Date de l'offre" value={f.dateOffre ?? ''} onChange={(e) => p.onFournisseur(f.id, { dateOffre: e.target.value || null })} />
                    )} />
                    <LigneInfo label="Pays de fabrication" pair={ligne++ % 2 === 1} fournisseurs={fournisseurs} rendu={(f) => (
                      <input className="cell-input h-7" aria-label="Pays de fabrication" value={f.paysFabrication ?? ''} onChange={(e) => p.onFournisseur(f.id, { paysFabrication: e.target.value || null })} />
                    )} />
                    <LigneInfo label="Incoterm" pair={ligne++ % 2 === 1} fournisseurs={fournisseurs} rendu={(f) => (
                      <select className="cell-input h-7 cursor-pointer" aria-label="Incoterm" value={f.incoterm ?? ''} onChange={(e) => p.onFournisseur(f.id, { incoterm: e.target.value || null })}>
                        <option value="">—</option>
                        {f.incoterm && !(INCOTERMS as readonly string[]).includes(f.incoterm) && <option value={f.incoterm}>{f.incoterm}</option>}
                        {INCOTERMS.map((i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    )} />
                    <LigneInfo label={`Montant de l'offre (${symboleDevise(devise)} HT)`} pair={ligne++ % 2 === 1} fournisseurs={fournisseurs} rendu={(f) => (
                      <ChampNombre ariaLabel="Montant de l'offre" className="h-7 font-bold" valeur={f.montantOffre} suffixe={symboleDevise(devise)} onChange={(v) => p.onFournisseur(f.id, { montantOffre: v })} />
                    )} />
                    <LigneInfo label="Décision" pair={ligne++ % 2 === 1} fournisseurs={fournisseurs} rendu={(f) => {
                      const d = DECISIONS[f.decision]
                      const sugg = analyse.scores.get(f.id)?.decisionSuggeree
                      return (
                        <div className="flex items-center gap-1">
                          <select
                            aria-label="Décision"
                            className="h-7 min-w-0 flex-1 cursor-pointer rounded-sm border-2 px-1 text-xs font-bold uppercase outline-none focus:border-vinci-bleu"
                            style={{ backgroundColor: d.fond, borderColor: d.couleur, color: f.decision === 'en_attente' ? '#000000' : d.couleur }}
                            value={f.decision}
                            onChange={(e) => p.onFournisseur(f.id, { decision: e.target.value as DecisionFournisseur })}
                          >
                            {(Object.keys(DECISIONS) as DecisionFournisseur[]).map((k) => (
                              <option key={k} value={k}>{DECISIONS[k].label}</option>
                            ))}
                          </select>
                          {sugg && sugg !== f.decision && (
                            <button
                              type="button"
                              className="flex h-7 shrink-0 items-center gap-0.5 rounded-sm border border-vinci-gris-bordure bg-white px-1 text-[11px] text-vinci-texte-secondaire hover:border-vinci-bleu hover:text-vinci-bleu"
                              title={`Décision suggérée : ${DECISIONS[sugg].label} — cliquer pour l'appliquer`}
                              onClick={() => p.onFournisseur(f.id, { decision: sugg })}
                            >
                              <Wand2 className="size-3" /> {DECISIONS[sugg].label}
                            </button>
                          )}
                        </div>
                      )
                    }} />
                  </>
                )}

                {s.criteres.map((c) => {
                  const pair = ligne++ % 2 === 1
                  const fond = pair ? 'bg-vinci-gris-clair' : 'bg-white'
                  return (
                    <tr key={c.id} className={cn('group', fond)}>
                      <td className={cn(TD, COL_CRITERE, fond, 'p-0.5')}>
                        <div className="flex items-center gap-1">
                          <input
                            aria-label="Libellé du critère"
                            className="cell-input h-7 min-w-0 flex-1"
                            value={c.libelle}
                            onChange={(e) => p.onCritere(c.id, { libelle: e.target.value })}
                          />
                          <span className="shrink-0 text-[11px] text-vinci-gris" title="Type de critère">
                            {LIBELLE_TYPE[c.type]}
                          </span>
                          <button
                            type="button"
                            aria-label="Supprimer le critère"
                            className="shrink-0 rounded-sm p-1 text-vinci-texte-secondaire opacity-0 hover:bg-vinci-rouge-tres-clair hover:text-vinci-rouge focus:opacity-100 group-hover:opacity-100"
                            onClick={() => p.onSupprimerCritere(c)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className={cn(TD, 'p-0.5')}>
                        {c.type === 'note_1_3' ? (
                          <ChampNombre
                            ariaLabel="Coefficient"
                            decimales={c.coefficient % 1 === 0 ? 0 : 1}
                            className="h-7 text-center"
                            valeur={c.coefficient}
                            onChange={(v) => p.onCritere(c.id, { coefficient: Math.max(0, Math.min(100, v ?? 0)) })}
                          />
                        ) : (
                          <div className="text-center text-vinci-gris">—</div>
                        )}
                      </td>
                      {fournisseurs.map((f) => (
                        <CelluleNotation
                          key={f.id}
                          critere={c}
                          fournisseurId={f.id}
                          notation={notations[cleNotation(c.id, f.id)]}
                          devise={devise}
                          onChange={p.onNotation}
                          onCommentaire={p.onCommentaire}
                        />
                      ))}
                    </tr>
                  )
                })}

                {s.criteres.length === 0 && s.cle !== 'offre' && (
                  <tr>
                    <td className={cn(TD, COL_CRITERE, 'bg-white italic text-vinci-gris')}>Aucun critère</td>
                    <td colSpan={nbCols - 1} className={cn(TD, 'bg-white')} />
                  </tr>
                )}

                {s.avecSousTotal && s.criteres.length > 0 && (
                  <tr>
                    <td className={cn(TD, COL_CRITERE, 'bg-vinci-bleu-tres-clair font-bold text-vinci-bleu-fonce')}>Sous-total {s.libelle.toLowerCase()}</td>
                    <td className={cn(TD, 'bg-vinci-bleu-tres-clair')} />
                    {fournisseurs.map((f) => (
                      <td key={f.id} className={cn(TD, 'num bg-vinci-bleu-tres-clair font-bold text-vinci-bleu-fonce')}>
                        {formatMontantDevise(analyse.sousTotaux.get(s.cle)?.get(f.id) ?? null, devise) || '—'}
                      </td>
                    ))}
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className={cn(TD, COL_CRITERE, 'bg-vinci-bleu-fonce font-bold text-white')}>Score total pondéré</td>
            <td className={cn(TD, 'bg-vinci-bleu-fonce text-center text-xs text-white/80')} title="Score maximal atteignable">
              /{formatNombreFR(analyse.maximum, 0)}
            </td>
            {fournisseurs.map((f) => {
              const total = analyse.scores.get(f.id)?.total ?? 0
              return (
                <td key={f.id} className={cn(TD, 'num bg-vinci-bleu-fonce font-bold text-white')}>
                  {formatNombreFR(total, Number.isInteger(total) ? 0 : 1)}
                </td>
              )
            })}
          </tr>
          <tr>
            <td className={cn(TD, COL_CRITERE, 'bg-vinci-bleu-fonce font-bold text-white')}>Score normalisé</td>
            <td className={cn(TD, 'bg-vinci-bleu-fonce text-center text-xs text-white/80')} title="Seuil GO">
              ≥{formatNombreFR(p.seuilGo, 0)}
            </td>
            {fournisseurs.map((f) => {
              const s = analyse.scores.get(f.id)
              const pct = s?.pourcentage ?? 0
              return (
                <td key={f.id} className={cn(TD, 'bg-vinci-bleu-fonce text-white')}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-vinci-bleu">
                      <div
                        className={cn('h-full', s?.nbNcMajeures ? 'bg-vinci-rouge' : pct >= p.seuilGo ? 'bg-vinci-vert' : 'bg-vinci-jaune')}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="num w-14 font-bold">{formatNombreFR(pct, 1)} %</span>
                  </div>
                </td>
              )
            })}
          </tr>
          <tr>
            <td className={cn(TD, COL_CRITERE, 'bg-vinci-bleu-fonce font-bold text-white')}>Classement</td>
            <td className={cn(TD, 'bg-vinci-bleu-fonce')} />
            {fournisseurs.map((f) => {
              const s = analyse.scores.get(f.id)
              const best = analyse.meilleurId === f.id
              return (
                <td key={f.id} className={cn(TD, 'bg-vinci-bleu-fonce text-center font-bold text-white')}>
                  <span className={cn('inline-block min-w-8 rounded-sm px-1.5', best && 'bg-white text-vinci-bleu-fonce')}>
                    {s ? `${s.classement}${s.classement === 1 ? 'er' : 'e'}` : '—'}
                  </span>
                  {s && (s.nbNcMajeures > 0 || s.nbNcNegociables > 0) && (
                    <div className="mt-0.5 text-[11px] font-normal text-white/80">
                      {s.nbNcMajeures > 0 && `${s.nbNcMajeures} NC majeure${s.nbNcMajeures > 1 ? 's' : ''}`}
                      {s.nbNcMajeures > 0 && s.nbNcNegociables > 0 && ' · '}
                      {s.nbNcNegociables > 0 && `${s.nbNcNegociables} négociable${s.nbNcNegociables > 1 ? 's' : ''}`}
                    </div>
                  )}
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export const GrilleMatrice = memo(GrilleMatriceBase)
