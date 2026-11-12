/**
 * Calcul de délais contractuels — fonctions PURES (testées dans dates.test.ts).
 *
 * Les dates sont manipulées au format ISO « AAAA-MM-JJ » (pas d'heure, pas de fuseau)
 * pour éviter tout décalage d'un jour lié au fuseau horaire.
 *
 * Règles de computation (CCAG Travaux 2021, art. 3.2) :
 *  - délai en jours = jours calendaires ; le jour de l'acte ou du fait qui sert de point
 *    de départ n'est pas compté ; le délai expire à minuit le dernier jour ;
 *  - délai en mois = de quantième à quantième ; à défaut de quantième identique dans le
 *    mois d'arrivée, le délai expire le dernier jour de ce mois ;
 *  - si le dernier jour est un samedi, un dimanche ou un jour férié ou chômé, le délai est
 *    prolongé jusqu'à la fin du premier jour ouvrable qui suit.
 */

export type DateISO = string

export const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const

const MS_JOUR = 86_400_000

/** "2026-04-01" → nombre de jours depuis l'époque (UTC), ou null si invalide. */
export function versJours(iso: DateISO): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  if (!m) return null
  const a = Number(m[1])
  const mo = Number(m[2])
  const j = Number(m[3])
  const t = Date.UTC(a, mo - 1, j)
  const d = new Date(t)
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== j) return null
  return Math.round(t / MS_JOUR)
}

export function depuisJours(n: number): DateISO {
  return new Date(n * MS_JOUR).toISOString().slice(0, 10)
}

export function estDateValide(iso: string | null | undefined): iso is DateISO {
  return !!iso && versJours(iso) !== null
}

/** Date locale (minuit local) pour l'affichage via formatDateFR. */
export function isoVersDateLocale(iso: DateISO): Date {
  const [a, m, j] = iso.split('-').map(Number)
  return new Date(a, m - 1, j)
}

export function jourSemaine(iso: DateISO): number {
  const n = versJours(iso)
  if (n === null) return -1
  // 1970-01-01 était un jeudi (4)
  return (((n + 4) % 7) + 7) % 7
}

export function ajouterJours(iso: DateISO, n: number): DateISO {
  const j = versJours(iso)
  if (j === null) throw new Error(`Date invalide : ${iso}`)
  return depuisJours(j + n)
}

/** Ajout de mois de quantième à quantième (fin de mois si le quantième n'existe pas). */
export function ajouterMois(iso: DateISO, n: number): DateISO {
  if (versJours(iso) === null) throw new Error(`Date invalide : ${iso}`)
  const [a, m, j] = iso.split('-').map(Number)
  const total = a * 12 + (m - 1) + n
  const na = Math.floor(total / 12)
  const nm = total - na * 12 // 0-11
  const dernierJour = new Date(Date.UTC(na, nm + 1, 0)).getUTCDate()
  const nj = Math.min(j, dernierJour)
  return `${String(na).padStart(4, '0')}-${String(nm + 1).padStart(2, '0')}-${String(nj).padStart(2, '0')}`
}

/** Nombre de jours calendaires de a à b (b − a). */
export function ecartJours(a: DateISO, b: DateISO): number {
  const ja = versJours(a)
  const jb = versJours(b)
  if (ja === null || jb === null) throw new Error('Date invalide')
  return jb - ja
}

/** Dimanche de Pâques (algorithme grégorien anonyme / Meeus-Jones-Butcher). */
export function paques(annee: number): DateISO {
  const a = annee % 19
  const b = Math.floor(annee / 100)
  const c = annee % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mois = Math.floor((h + l - 7 * m + 114) / 31)
  const jour = ((h + l - 7 * m + 114) % 31) + 1
  return `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`
}

/** Jours fériés légaux en France métropolitaine (hors Alsace-Moselle). */
export function joursFeries(annee: number): { date: DateISO; libelle: string }[] {
  const p = paques(annee)
  const fixe = (mm: number, jj: number) => `${annee}-${String(mm).padStart(2, '0')}-${String(jj).padStart(2, '0')}`
  return [
    { date: fixe(1, 1), libelle: 'Jour de l’an' },
    { date: ajouterJours(p, 1), libelle: 'Lundi de Pâques' },
    { date: fixe(5, 1), libelle: 'Fête du Travail' },
    { date: fixe(5, 8), libelle: 'Victoire 1945' },
    { date: ajouterJours(p, 39), libelle: 'Ascension' },
    { date: ajouterJours(p, 50), libelle: 'Lundi de Pentecôte' },
    { date: fixe(7, 14), libelle: 'Fête nationale' },
    { date: fixe(8, 15), libelle: 'Assomption' },
    { date: fixe(11, 1), libelle: 'Toussaint' },
    { date: fixe(11, 11), libelle: 'Armistice 1918' },
    { date: fixe(12, 25), libelle: 'Noël' },
  ].sort((x, y) => x.date.localeCompare(y.date))
}

export function libelleFerie(iso: DateISO): string | null {
  const annee = Number(iso.slice(0, 4))
  return joursFeries(annee).find((f) => f.date === iso)?.libelle ?? null
}

export function estJourOuvrable(iso: DateISO): boolean {
  const js = jourSemaine(iso)
  if (js === 0 || js === 6) return false
  return libelleFerie(iso) === null
}

/** Premier jour ouvrable à partir de `iso` inclus. */
export function reporterJourOuvrable(iso: DateISO): DateISO {
  let d = iso
  for (let i = 0; i < 15 && !estJourOuvrable(d); i++) d = ajouterJours(d, 1)
  return d
}

export type Delai = { jours?: number; mois?: number }

export type Echeance = {
  /** Date d'expiration brute (sans report). */
  brute: DateISO
  /** Date d'expiration effective (après report éventuel au premier jour ouvrable). */
  date: DateISO
  /** Vrai si la date brute tombait un samedi, dimanche ou jour férié. */
  reportee: boolean
}

/** Échéance d'un délai courant à partir de `depart` (jour de départ non compté). */
export function echeance(depart: DateISO, delai: Delai, report = true): Echeance {
  let brute = depart
  if (delai.mois) brute = ajouterMois(brute, delai.mois)
  if (delai.jours) brute = ajouterJours(brute, delai.jours)
  const date = report ? reporterJourOuvrable(brute) : brute
  return { brute, date, reportee: date !== brute }
}

/** Nombre de jours ouvrés (lundi-vendredi hors fériés) entre a exclu et b inclus. */
export function joursOuvres(a: DateISO, b: DateISO): number {
  const n = ecartJours(a, b)
  const signe = n < 0 ? -1 : 1
  let c = 0
  for (let i = 1; i <= Math.abs(n); i++) if (estJourOuvrable(ajouterJours(a, i * signe))) c++
  return c * signe
}

export function libelleDelai(d: Delai): string {
  const parts: string[] = []
  if (d.mois) parts.push(`${d.mois} mois`)
  if (d.jours) parts.push(`${d.jours} jour${d.jours > 1 ? 's' : ''}`)
  return parts.join(' + ') || '—'
}
