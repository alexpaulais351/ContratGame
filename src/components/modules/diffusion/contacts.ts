// Liste de diffusion du chantier — types et fonctions pures (partagés module Diffusion / Courriers / exports).

export const ROLES_DIFFUSION = [
  { value: 'moa', label: "Maître d'ouvrage" },
  { value: 'moe', label: "Maître d'œuvre" },
  { value: 'amo', label: 'AMO' },
  { value: 'opc', label: 'OPC' },
  { value: 'csps', label: 'Coordonnateur SPS' },
  { value: 'controle', label: 'Bureau de contrôle' },
  { value: 'bet', label: "Bureau d'études" },
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'sous_traitant', label: 'Sous-traitant' },
  { value: 'cotraitant', label: 'Co-traitant' },
  { value: 'concessionnaire', label: 'Concessionnaire' },
  { value: 'administration', label: 'Administration' },
  { value: 'interne', label: 'Interne (équipe travaux)' },
  { value: 'autre', label: 'Autre' },
] as const

export type RoleDiffusion = (typeof ROLES_DIFFUSION)[number]['value']
export const VALEURS_ROLES = ROLES_DIFFUSION.map((r) => r.value) as [RoleDiffusion, ...RoleDiffusion[]]

export const CIVILITES = ['Madame', 'Monsieur'] as const

export type ContactDiffusionDTO = {
  id: string
  organisation: string
  civilite: string | null
  prenom: string | null
  nom: string | null
  fonction: string | null
  role: string
  email: string | null
  telephone: string | null
  adresse: string | null
  destinataireParDefaut: boolean
  copieParDefaut: boolean
  diffusionCR: boolean
  commentaire: string | null
  ordre: number
}

export function libelleRole(role: string): string {
  return ROLES_DIFFUSION.find((r) => r.value === role)?.label ?? 'Autre'
}

function rangRole(role: string): number {
  const i = ROLES_DIFFUSION.findIndex((r) => r.value === role)
  return i === -1 ? ROLES_DIFFUSION.length : i
}

/** Trie par rôle (ordre des catégories) puis par ordre manuel. */
export function trierContacts<T extends Pick<ContactDiffusionDTO, 'role' | 'ordre' | 'organisation'>>(contacts: T[]): T[] {
  return [...contacts].sort(
    (a, b) => rangRole(a.role) - rangRole(b.role) || a.ordre - b.ordre || a.organisation.localeCompare(b.organisation, 'fr'),
  )
}

/** Groupes [rôle, contacts] dans l'ordre des catégories (groupes vides omis). */
export function grouperParRole<T extends Pick<ContactDiffusionDTO, 'role' | 'ordre' | 'organisation'>>(
  contacts: T[],
): { role: string; label: string; contacts: T[] }[] {
  const groupes: { role: string; label: string; contacts: T[] }[] = []
  for (const c of trierContacts(contacts)) {
    const role = rangRole(c.role) < ROLES_DIFFUSION.length ? c.role : 'autre'
    let g = groupes.find((x) => x.role === role)
    if (!g) groupes.push((g = { role, label: libelleRole(role), contacts: [] }))
    g.contacts.push(c)
  }
  return groupes
}

type Personne = Pick<ContactDiffusionDTO, 'civilite' | 'prenom' | 'nom'>

/** « Prénom Nom » (vide si aucun). */
export function nomPersonne(c: Personne): string {
  return [c.prenom, c.nom].map((s) => s?.trim()).filter(Boolean).join(' ')
}

/** « Civilité Prénom Nom ». */
export function nomComplet(c: Personne): string {
  return [c.civilite?.trim(), nomPersonne(c)].filter(Boolean).join(' ')
}

/** Bloc destinataire d'un courrier : Organisation / À l'attention de … , Fonction / Adresse. */
export function blocDestinataire(c: Pick<ContactDiffusionDTO, 'organisation' | 'civilite' | 'prenom' | 'nom' | 'fonction' | 'adresse'>): string {
  const lignes = [c.organisation.trim()]
  const personne = nomComplet(c)
  const fonction = c.fonction?.trim()
  if (personne) lignes.push(`À l’attention de ${personne}${fonction ? `, ${fonction}` : ''}`)
  else if (fonction) lignes.push(`À l’attention du ${fonction}`)
  if (c.adresse?.trim()) lignes.push(...c.adresse.split('\n').map((l) => l.trim()).filter(Boolean))
  return lignes.join('\n')
}

/** Mention de copie : « Organisation (Prénom Nom) ». */
export function mentionCopie(c: Pick<ContactDiffusionDTO, 'organisation' | 'prenom' | 'nom'>): string {
  const p = nomPersonne({ civilite: null, prenom: c.prenom, nom: c.nom })
  return p ? `${c.organisation.trim()} (${p})` : c.organisation.trim()
}

/** Champ « Copies » d'un courrier à partir d'une sélection de contacts. */
export function texteCopies(contacts: Pick<ContactDiffusionDTO, 'organisation' | 'prenom' | 'nom'>[]): string {
  return contacts.map(mentionCopie).join(' ; ')
}

const RE_EMAIL = /^[^\s@;,?&]+@[^\s@;,?&]+\.[^\s@;,?&]+$/

/** E-mails valides, sans doublon (casse ignorée), dans l'ordre. */
export function emailsUniques(contacts: Pick<ContactDiffusionDTO, 'email'>[]): string[] {
  const vus = new Set<string>()
  const res: string[] = []
  for (const c of contacts) {
    const e = c.email?.trim()
    if (!e || !RE_EMAIL.test(e) || vus.has(e.toLowerCase())) continue
    vus.add(e.toLowerCase())
    res.push(e)
  }
  return res
}

/**
 * Lien mailto « Écrire à la liste » : to = destinataires par défaut (ayant un e-mail),
 * cc = le reste de la liste de diffusion (diffusionCR). Sans destinataire par défaut, tout passe en « to ».
 */
export function lienMailto(contacts: ContactDiffusionDTO[], objet: string): string | null {
  const to = emailsUniques(contacts.filter((c) => c.destinataireParDefaut))
  const dejaTo = new Set(to.map((e) => e.toLowerCase()))
  const cc = emailsUniques(contacts.filter((c) => c.diffusionCR && !c.destinataireParDefaut)).filter((e) => !dejaTo.has(e.toLowerCase()))
  const a = to.length ? to : cc
  const copie = to.length ? cc : []
  if (a.length === 0) return null
  const params = [`subject=${encodeURIComponent(objet)}`]
  if (copie.length) params.push(`cc=${copie.join(',')}`)
  return `mailto:${a.join(',')}?${params.join('&')}`
}

/** Clé d'unicité d'un contact (organisation + nom), insensible à la casse et aux accents. */
export function cleContact(organisation: string, nom?: string | null): string {
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
  return `${n(organisation)}|${n(nom ?? '')}`
}

const normaliser = (s: string) => s.normalize('NFC').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()

/** Morceaux du champ « Copies » (séparateurs « ; » ou retours à la ligne). */
export function morceauxCopies(copies: string): string[] {
  return copies.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)
}

/** Le contact figure-t-il dans le champ « Copies » (mention exacte, casse ignorée) ? */
export function estEnCopie(copies: string, c: Pick<ContactDiffusionDTO, 'organisation' | 'prenom' | 'nom'>): boolean {
  const m = normaliser(mentionCopie(c))
  return morceauxCopies(copies).some((x) => normaliser(x) === m)
}

/** Ajoute / retire la mention d'un contact dans le champ « Copies » en conservant le texte saisi à la main. */
export function basculerCopie(copies: string, c: Pick<ContactDiffusionDTO, 'organisation' | 'prenom' | 'nom'>, coche: boolean): string {
  const m = mentionCopie(c)
  const morceaux = morceauxCopies(copies).filter((x) => normaliser(x) !== normaliser(m))
  if (coche) morceaux.push(m)
  return morceaux.join(' ; ')
}

/** Le contact est-il le destinataire du courrier (1re ligne = organisation, et nom présent le cas échéant) ? */
export function estDestinataire(destinataire: string, c: Pick<ContactDiffusionDTO, 'organisation' | 'prenom' | 'nom'>): boolean {
  const premiere = normaliser(destinataire.split('\n')[0] ?? '')
  if (!premiere || premiere !== normaliser(c.organisation)) return false
  const nom = c.nom?.trim()
  return !nom || normaliser(destinataire).includes(normaliser(nom))
}
