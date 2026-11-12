// Suivi de fréquentation (onglet Analyse) — fonctions pures, testables sans base.
import { moduleDepuisChemin } from '@/lib/modules-projet'

export const FUSEAU = 'Europe/Paris'

/** Identifiant dynamique (cuid v1/v2 ou uuid) dans un segment d'URL. */
const RE_ID = /^(c[a-z0-9]{20,31}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
const RE_CHEMIN = /^\/[a-z0-9/\-_[\]]*$/

export type CheminNormalise = { chemin: string; projetId: string }

/**
 * Normalise un chemin pour l'agrégation : sans query/hash, en minuscules, sans « / » final,
 * identifiants remplacés par « [id] » (ex. /projets/[id]/suivi/journal). L'id du projet est conservé à part.
 * Renvoie null pour un chemin invalide (ignoré).
 */
export function normaliserChemin(brut: unknown): CheminNormalise | null {
  if (typeof brut !== 'string' || !brut.startsWith('/') || brut.startsWith('//') || brut.length > 300) return null
  const sansQuery = brut.split(/[?#]/)[0]
  const segments = sansQuery.split('/').filter(Boolean)
  let projetId = ''
  const normalises = segments.map((seg, i) => {
    if (RE_ID.test(seg)) {
      if (i === 1 && segments[0].toLowerCase() === 'projets') projetId = seg
      return '[id]'
    }
    return seg.toLowerCase()
  })
  const chemin = ('/' + normalises.join('/')).slice(0, 120)
  if (!RE_CHEMIN.test(chemin)) return null
  return { chemin, projetId }
}

/** Jour calendaire Europe/Paris d'un instant, au format AAAA-MM-JJ. */
export function jourParis(d: Date = new Date()): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  )
  return `${p.year}-${p.month}-${p.day}`
}

/** Jour AAAA-MM-JJ → Date à minuit UTC (valeur d'une colonne @db.Date). */
export function dateDuJour(jour: string): Date {
  return new Date(`${jour}T00:00:00.000Z`)
}

/** Ajoute n jours à un jour AAAA-MM-JJ. */
export function decalerJour(jour: string, n: number): string {
  const d = dateDuJour(jour)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Instant (UTC) du minuit Europe/Paris d'un jour AAAA-MM-JJ. */
export function debutJourParis(jour: string): Date {
  const minuitUtc = dateDuJour(jour).getTime()
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    })
      .formatToParts(new Date(minuitUtc))
      .map((x) => [x.type, x.value]),
  )
  const murale = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute)
  return new Date(minuitUtc - (murale - minuitUtc))
}

/** « 12/11/2026 à 14:05 » (heure de Paris). */
export function dateHeureParis(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ''
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: FUSEAU, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  )
  return `${p.day}/${p.month}/${p.year} à ${p.hour}:${p.minute}`
}

const PAGES_FIXES: Record<string, string> = {
  '/': 'Accueil du site',
  '/accueil': 'Accueil',
  '/projets': 'Projets',
  '/profil': 'Profil',
  '/comptes': 'Comptes',
  '/analyse': 'Analyse',
  '/modeles-courriers': 'Modèles de courriers (ancienne URL)',
  '/boite-a-outils': 'Boîte à outils',
  '/boite-a-outils/modeles-courriers': 'Boîte à outils · Modèles de courriers',
  '/boite-a-outils/procedure-dgd': 'Boîte à outils · Procédure DGD',
  '/boite-a-outils/delais-cles': 'Boîte à outils · Délais clés',
  '/boite-a-outils/calculateurs': 'Boîte à outils · Calculateurs',
  '/boite-a-outils/assurances': 'Boîte à outils · Assurances',
  '/boite-a-outils/lexique': 'Boîte à outils · Lexique',
}

const SOUS_PAGES: Record<string, string> = {
  nouveau: 'nouveau',
  cotraitance: 'Co-traitance',
  'fiche-ecart': 'Fiche écart',
  '[id]': 'détail',
}

/** Libellé lisible d'un chemin normalisé (modules projet via ONGLETS_PROJET). */
export function libellePage(chemin: string): { libelle: string; rubrique: string } {
  if (PAGES_FIXES[chemin]) return { libelle: PAGES_FIXES[chemin], rubrique: 'Général' }
  const m = /^\/projets\/\[id\](?:\/(.*))?$/.exec(chemin)
  if (m) {
    const sous = m[1] ?? ''
    if (!sous) return { libelle: 'Projet (accueil)', rubrique: 'Projet' }
    const trouve = moduleDepuisChemin(sous)
    if (!trouve) return { libelle: sous, rubrique: 'Projet' }
    const reste = sous.slice(trouve.module.href.length).split('/').filter(Boolean)
    const suffixe = reste.map((s) => SOUS_PAGES[s] ?? s).join(' · ')
    return {
      libelle: suffixe ? `${trouve.module.label} — ${suffixe}` : trouve.module.label,
      rubrique: trouve.onglet.label,
    }
  }
  return { libelle: chemin, rubrique: 'Autre' }
}

export const PERIODES = [
  { cle: '7j', libelle: '7 jours', jours: 7 },
  { cle: '30j', libelle: '30 jours', jours: 30 },
  { cle: '90j', libelle: '90 jours', jours: 90 },
  { cle: '12m', libelle: '12 mois', jours: 365 },
] as const

export type Periode = (typeof PERIODES)[number]

export function periodeDepuis(param: unknown): Periode {
  return PERIODES.find((p) => p.cle === param) ?? PERIODES[1]
}
