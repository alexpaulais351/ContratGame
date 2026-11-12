'use client'
import { useMemo, useState } from 'react'
import { CalendarDays, ExternalLink, Percent, Scale, ShieldCheck, Timer } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn, formatDateFR, formatMontant, formatNombreFR, parseNombreFR } from '@/lib/utils'
import {
  echeancePaiement, interetsMoratoires, penalitesRetard, retenueGarantie, revisionPrix,
} from '@/lib/boite-a-outils/calculs'
import {
  JOURS_SEMAINE, echeance, ecartJours, estDateValide, isoVersDateLocale, jourSemaine, joursOuvres, libelleFerie,
} from '@/lib/boite-a-outils/dates'
import { SRC } from '@/lib/boite-a-outils/sources'
import { AlerteJaune } from './AlerteJaune'

const SELECT = 'h-10 w-full rounded-md border border-vinci-gris-bordure bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vinci-bleu'
const fr = (iso: string) => formatDateFR(isoVersDateLocale(iso))
const jour = (iso: string) => JOURS_SEMAINE[jourSemaine(iso)]

function Carte({ titre, icone: Icone, reference, children }: { titre: string; icone: typeof Timer; reference: string; children: React.ReactNode }) {
  return (
    <section className="carte flex flex-col gap-4">
      <header className="border-b border-vinci-gris-bordure pb-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-vinci-bleu">
          <Icone className="h-5 w-5" aria-hidden /> {titre}
        </h3>
        <p className="text-xs text-vinci-texte-secondaire">{reference}</p>
      </header>
      {children}
    </section>
  )
}

function Champ({ id, label, children, aide }: { id: string; label: string; children: React.ReactNode; aide?: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {aide && <p className="mt-1 text-xs text-vinci-texte-secondaire">{aide}</p>}
    </div>
  )
}

function NombreInput({ id, value, onChange, suffixe }: { id: string; value: string; onChange: (v: string) => void; suffixe?: string }) {
  return (
    <div className="relative">
      <Input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className={cn('text-right tabular-nums', suffixe && 'pr-9')} />
      {suffixe && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-vinci-texte-secondaire">{suffixe}</span>}
    </div>
  )
}

function Resultat({ lignes, total }: { lignes: [string, string][]; total?: [string, string] }) {
  return (
    <table className="table-vinci">
      <tbody>
        {lignes.map(([k, v]) => (
          <tr key={k}>
            <td>{k}</td>
            <td className="num font-semibold">{v}</td>
          </tr>
        ))}
      </tbody>
      {total && (
        <tfoot>
          <tr>
            <td>{total[0]}</td>
            <td className="num">{total[1]}</td>
          </tr>
        </tfoot>
      )}
    </table>
  )
}

/* ───────── Intérêts moratoires ───────── */
function CalculInterets() {
  const [montant, setMontant] = useState('100 000')
  const [mode, setMode] = useState<'echeance' | 'demande'>('demande')
  const [dateDemande, setDateDemande] = useState('')
  const [delai, setDelai] = useState('30')
  const [dateEcheance, setDateEcheance] = useState('')
  const [datePaiement, setDatePaiement] = useState('')
  const [taux, setTaux] = useState('2,40')

  const ech = mode === 'demande' ? (estDateValide(dateDemande) ? echeancePaiement(dateDemande, Number(delai)) : '') : dateEcheance
  const r = useMemo(() => {
    if (!estDateValide(ech) || !estDateValide(datePaiement)) return null
    return interetsMoratoires({ montant: parseNombreFR(montant), echeance: ech, paiement: datePaiement, tauxBCE: parseNombreFR(taux) })
  }, [ech, datePaiement, montant, taux])

  return (
    <Carte titre="Intérêts moratoires" icone={Timer} reference="CCP art. R2192-10, R2192-11, R2192-31 à R2192-36, D2192-35">
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ id="im-montant" label="Montant payé en retard (TTC)">
          <NombreInput id="im-montant" value={montant} onChange={setMontant} suffixe="€" />
        </Champ>
        <Champ
          id="im-taux"
          label="Taux BCE au 1er jour du semestre"
          aide={
            <>
              Exemple : 2,40 % au 1er juillet 2026 (à vérifier).{' '}
              <a href={SRC.bce.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-vinci-bleu underline">
                Banque de France <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </>
          }
        >
          <NombreInput id="im-taux" value={taux} onChange={setTaux} suffixe="%" />
        </Champ>
        <Champ id="im-mode" label="Échéance de paiement">
          <select id="im-mode" className={SELECT} value={mode} onChange={(e) => setMode(e.target.value as 'echeance' | 'demande')}>
            <option value="demande">Calculée depuis la réception de la demande</option>
            <option value="echeance">Saisie directement</option>
          </select>
        </Champ>
        {mode === 'demande' ? (
          <>
            <Champ id="im-demande" label="Réception de la demande de paiement">
              <Input id="im-demande" type="date" value={dateDemande} onChange={(e) => setDateDemande(e.target.value)} />
            </Champ>
            <Champ id="im-delai" label="Délai de paiement">
              <select id="im-delai" className={SELECT} value={delai} onChange={(e) => setDelai(e.target.value)}>
                <option value="30">30 jours — État, collectivités</option>
                <option value="50">50 jours — établissements publics de santé</option>
                <option value="60">60 jours — entreprises publiques</option>
              </select>
            </Champ>
          </>
        ) : (
          <Champ id="im-echeance" label="Date d’échéance (dernier jour du délai)">
            <Input id="im-echeance" type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
          </Champ>
        )}
        <Champ id="im-paiement" label="Date de mise en paiement">
          <Input id="im-paiement" type="date" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} />
        </Champ>
      </div>
      {r ? (
        <Resultat
          lignes={[
            ['Échéance', fr(ech)],
            ['Jours de retard', formatNombreFR(r.joursRetard, 0)],
            ['Taux appliqué (BCE + 8 points)', `${formatNombreFR(r.tauxApplique)} %`],
            ['Intérêts (montant × taux × jours / 365)', formatMontant(r.interets)],
            ['Indemnité forfaitaire de recouvrement', formatMontant(r.indemniteForfaitaire)],
          ]}
          total={['Total dû', formatMontant(r.total)]}
        />
      ) : (
        <p className="text-sm text-vinci-texte-secondaire">Renseignez l’échéance et la date de paiement.</p>
      )}
      <p className="text-xs text-vinci-texte-secondaire">
        Les intérêts courent du lendemain de l’échéance jusqu’à la date de mise en paiement incluse ; ils sont payés dans les 45 jours suivant le paiement du principal.
      </p>
    </Carte>
  )
}

/* ───────── Révision de prix ───────── */
function CalculRevision() {
  const [p0, setP0] = useState('10 000')
  const [i0, setI0] = useState('')
  const [im, setIm] = useState('')
  const [partFixe, setPartFixe] = useState('0')
  const [arrondi, setArrondi] = useState('aucun')

  const r = useMemo(() => {
    const a = parseNombreFR(partFixe)
    const base = parseNombreFR(i0)
    if (!(base > 0) || !(parseNombreFR(im) > 0) || a < 0 || a >= 1) return null
    const [mode, dec] = arrondi === 'aucun' ? ['proche', null] : arrondi.split('-')
    return revisionPrix({
      p0: parseNombreFR(p0), indexBase: base, indexMois: parseNombreFR(im), partFixe: a,
      decimalesCoefficient: dec === null ? null : Number(dec), modeArrondi: mode as 'proche' | 'superieur',
    })
  }, [p0, i0, im, partFixe, arrondi])

  return (
    <Carte titre="Révision de prix" icone={Percent} reference="Formule paramétrique C = a + (1 − a) × Im / I0 — modalités fixées par le CCAP (CCP art. R2112-13 et s.)">
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ id="rv-p0" label="Montant P0 (conditions du mois zéro)">
          <NombreInput id="rv-p0" value={p0} onChange={setP0} suffixe="€" />
        </Champ>
        <Champ id="rv-a" label="Part fixe « a » (0 à 0,99)" aide="0 si le CCAP ne prévoit pas de part fixe (ex. 0,125 dans certains marchés).">
          <NombreInput id="rv-a" value={partFixe} onChange={setPartFixe} />
        </Champ>
        <Champ id="rv-i0" label="Index du mois zéro (I0)" aide="Ex. index BT ou TP publié (INSEE).">
          <NombreInput id="rv-i0" value={i0} onChange={setI0} />
        </Champ>
        <Champ id="rv-im" label="Index du mois de réalisation (Im)">
          <NombreInput id="rv-im" value={im} onChange={setIm} />
        </Champ>
        <Champ id="rv-arr" label="Arrondi du coefficient (selon CCAP)">
          <select id="rv-arr" className={SELECT} value={arrondi} onChange={(e) => setArrondi(e.target.value)}>
            <option value="aucun">Aucun</option>
            <option value="proche-3">Au millième le plus proche</option>
            <option value="superieur-3">Au millième supérieur</option>
            <option value="proche-4">À 4 décimales</option>
          </select>
        </Champ>
      </div>
      {r ? (
        <Resultat
          lignes={[
            ['Coefficient de révision C', formatNombreFR(r.coefficient, 4)],
            ['Part variable (1 − a)', formatNombreFR(r.partVariable, 3)],
            ['Variation', formatMontant(r.variation)],
          ]}
          total={['Montant révisé P = P0 × C', formatMontant(r.montantRevise)]}
        />
      ) : (
        <p className="text-sm text-vinci-texte-secondaire">Renseignez les index (I0 &gt; 0) et une part fixe comprise entre 0 et 0,99.</p>
      )}
    </Carte>
  )
}

/* ───────── Pénalités de retard ───────── */
function CalculPenalites() {
  const [montant, setMontant] = useState('500 000')
  const [jours, setJours] = useState('15')
  const [denom, setDenom] = useState('3000')
  const [plafond, setPlafond] = useState('10')
  const [avecPlafond, setAvecPlafond] = useState(true)
  const [seuil, setSeuil] = useState('1 000')

  const r = penalitesRetard({
    montantHT: parseNombreFR(montant), joursRetard: parseNombreFR(jours), denominateur: Math.max(1, parseNombreFR(denom)),
    plafondPct: avecPlafond ? parseNombreFR(plafond) : null, seuilExoneration: parseNombreFR(seuil),
  })

  return (
    <Carte titre="Pénalités de retard" icone={Scale} reference="CCAG Travaux 2021 art. 19.2.1 à 19.2.4 (sauf dérogation du CCAP)">
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ id="pn-m" label="Montant HT du marché (ou tranche / BC)">
          <NombreInput id="pn-m" value={montant} onChange={setMontant} suffixe="€" />
        </Champ>
        <Champ id="pn-j" label="Jours calendaires de retard">
          <NombreInput id="pn-j" value={jours} onChange={setJours} suffixe="j" />
        </Champ>
        <Champ id="pn-d" label="Pénalité journalière : 1 / …" aide="CCAG 2021 : 1/3 000 du montant HT.">
          <NombreInput id="pn-d" value={denom} onChange={setDenom} />
        </Champ>
        <Champ id="pn-s" label="Seuil d’exonération" aide="CCAG 2021 : 1 000 € pour l’ensemble du marché.">
          <NombreInput id="pn-s" value={seuil} onChange={setSeuil} suffixe="€" />
        </Champ>
        <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={avecPlafond} onCheckedChange={(c) => setAvecPlafond(c === true)} /> Plafonner les pénalités
          </label>
          {avecPlafond && (
            <Champ id="pn-p" label="Plafond (% du montant HT)" aide="CCAG 2021 : 10 %.">
              <NombreInput id="pn-p" value={plafond} onChange={setPlafond} suffixe="%" />
            </Champ>
          )}
        </div>
      </div>
      <Resultat
        lignes={[
          ['Pénalité journalière', formatMontant(r.penaliteJournaliere)],
          ['Pénalités brutes', formatMontant(r.brut)],
          ['Plafond', r.plafond === null ? 'Aucun' : `${formatMontant(r.plafond)}${r.plafonne ? ' (atteint)' : ''}`],
          ['Exonération (≤ seuil)', r.exonere ? 'Oui' : 'Non'],
        ]}
        total={['Pénalités applicables', formatMontant(r.du)]}
      />
      <p className="text-xs text-vinci-texte-secondaire">
        Avant application, le maître d’ouvrage doit inviter le titulaire à présenter ses observations sous 15 jours au moins (art. 19.2.4).
      </p>
    </Carte>
  )
}

/* ───────── Retenue de garantie ───────── */
function CalculRetenue() {
  const [montant, setMontant] = useState('250 000')
  const [modifs, setModifs] = useState('0')
  const [taux, setTaux] = useState('5')
  const [reception, setReception] = useState('')
  const [caution, setCaution] = useState(false)
  const r = retenueGarantie({
    montantInitialHT: parseNombreFR(montant), modificationsHT: parseNombreFR(modifs), taux: parseNombreFR(taux),
    dateReception: estDateValide(reception) ? reception : null,
  })
  return (
    <Carte titre="Retenue de garantie" icone={ShieldCheck} reference="CCP art. R2191-32 à R2191-35 ; CCAG Travaux 2021 art. 44.1">
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ id="rg-m" label="Montant initial du marché">
          <NombreInput id="rg-m" value={montant} onChange={setMontant} suffixe="€" />
        </Champ>
        <Champ id="rg-mod" label="Modifications en cours d’exécution (avenants)">
          <NombreInput id="rg-mod" value={modifs} onChange={setModifs} suffixe="€" />
        </Champ>
        <Champ id="rg-t" label="Taux (selon CCAP)">
          <select id="rg-t" className={SELECT} value={taux} onChange={(e) => setTaux(e.target.value)}>
            <option value="5">5 % (maximum)</option>
            <option value="3">3 % (PME, État et certains acheteurs — à vérifier)</option>
            <option value="0">Aucune retenue</option>
          </select>
        </Champ>
        <Champ id="rg-r" label="Date d’effet de la réception (facultatif)">
          <Input id="rg-r" type="date" value={reception} onChange={(e) => setReception(e.target.value)} />
        </Champ>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Checkbox checked={caution} onCheckedChange={(c) => setCaution(c === true)} />
          Remplacée par une garantie à première demande (ou caution personnelle et solidaire si le MOA l’accepte)
        </label>
      </div>
      <Resultat
        lignes={[
          ['Base (montant initial + modifications)', formatMontant(r.base)],
          ...(r.finGarantie ? ([['Fin du délai de garantie (1 an)', fr(r.finGarantie)]] as [string, string][]) : []),
          ...(r.remboursementAuPlusTard
            ? ([[caution ? 'Libération de la garantie au plus tard (1 mois)' : 'Remboursement au plus tard (30 j)', fr(r.remboursementAuPlusTard)]] as [string, string][])
            : []),
        ]}
        total={[caution ? 'Montant de la garantie à première demande' : 'Retenue de garantie', formatMontant(r.retenue)]}
      />
      <p className="text-xs text-vinci-texte-secondaire">
        Retenue prélevée sur chaque acompte. Si des réserves notifiées pendant le délai de garantie ne sont pas levées, le remboursement intervient dans les 30 jours suivant leur levée.
      </p>
    </Carte>
  )
}

/* ───────── Calcul de dates ───────── */
function CalculDates() {
  const [depart, setDepart] = useState('')
  const [n, setN] = useState('30')
  const [unite, setUnite] = useState<'jours' | 'mois'>('jours')
  const [report, setReport] = useState(true)
  const [d1, setD1] = useState('')
  const [d2, setD2] = useState('')

  const nb = Math.max(0, Math.floor(parseNombreFR(n)))
  const e = estDateValide(depart) ? echeance(depart, unite === 'jours' ? { jours: nb } : { mois: nb }, report) : null
  const ecart = estDateValide(d1) && estDateValide(d2) ? { cal: ecartJours(d1, d2), ouv: joursOuvres(d1, d2) } : null

  return (
    <Carte titre="Calcul de dates" icone={CalendarDays} reference="CCAG Travaux 2021 art. 3.2 : jour de départ non compté, mois de quantième à quantième, report au premier jour ouvrable">
      <div className="grid gap-3 sm:grid-cols-3">
        <Champ id="dt-d" label="Date de départ (acte ou fait)">
          <Input id="dt-d" type="date" value={depart} onChange={(ev) => setDepart(ev.target.value)} />
        </Champ>
        <Champ id="dt-n" label="Délai">
          <NombreInput id="dt-n" value={n} onChange={setN} />
        </Champ>
        <Champ id="dt-u" label="Unité">
          <select id="dt-u" className={SELECT} value={unite} onChange={(ev) => setUnite(ev.target.value as 'jours' | 'mois')}>
            <option value="jours">jours calendaires</option>
            <option value="mois">mois</option>
          </select>
        </Champ>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={report} onCheckedChange={(c) => setReport(c === true)} />
        Reporter au premier jour ouvrable (samedi, dimanche, jour férié)
      </label>
      {e ? (
        <div className="rounded-md border border-vinci-bleu bg-vinci-bleu-tres-clair p-3 text-sm">
          Date limite : <strong className="text-vinci-bleu-fonce">{jour(e.date)} {fr(e.date)}</strong> à minuit
          {e.reportee && (
            <span className="block text-xs text-vinci-texte-secondaire">
              Échéance brute le {jour(e.brute)} {fr(e.brute)}{libelleFerie(e.brute) ? ` (${libelleFerie(e.brute)})` : ''}, reportée au premier jour ouvrable.
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-vinci-texte-secondaire">Saisissez une date de départ.</p>
      )}
      <div className="border-t border-vinci-gris-bordure pt-3">
        <p className="mb-2 text-sm font-semibold">Durée entre deux dates</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Champ id="dt-1" label="Du">
            <Input id="dt-1" type="date" value={d1} onChange={(ev) => setD1(ev.target.value)} />
          </Champ>
          <Champ id="dt-2" label="Au">
            <Input id="dt-2" type="date" value={d2} onChange={(ev) => setD2(ev.target.value)} />
          </Champ>
        </div>
        {ecart && (
          <p className="mt-2 text-sm">
            <strong>{formatNombreFR(ecart.cal, 0)}</strong> jours calendaires · <strong>{formatNombreFR(ecart.ouv, 0)}</strong> jours ouvrés (hors week-ends et jours fériés)
          </p>
        )}
      </div>
    </Carte>
  )
}

export function Calculateurs() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-titre">Calculateurs</h2>
        <p className="text-sm text-vinci-texte-secondaire">Calculs instantanés, rien n’est enregistré.</p>
      </div>
      <AlerteJaune>Valeurs par défaut du CCAG Travaux 2021 et du code de la commande publique : vérifiez les stipulations du CCAP de votre marché.</AlerteJaune>
      <div className="grid gap-4 xl:grid-cols-2">
        <CalculInterets />
        <CalculPenalites />
        <CalculRevision />
        <CalculRetenue />
        <CalculDates />
      </div>
    </div>
  )
}
