'use server'
import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signIn, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type EtatForm = { error?: string; message?: string }

/** Chemin interne uniquement (évite les redirections ouvertes). */
function cheminInterne(v: FormDataEntryValue | null): string {
  const s = typeof v === 'string' ? v : ''
  return s.startsWith('/') && !s.startsWith('//') ? s : '/accueil'
}

export async function connexion(_prev: EtatForm, formData: FormData): Promise<EtatForm> {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? '').trim().toLowerCase(),
      password: String(formData.get('password') ?? ''),
      redirectTo: cheminInterne(formData.get('callbackUrl')),
    })
    return {}
  } catch (e) {
    if (e instanceof AuthError) return { error: 'Adresse e-mail ou mot de passe incorrect.' }
    throw e
  }
}

const schemaInscription = z
  .object({
    nom: z.string().trim().min(2, 'Indiquez votre nom complet.').max(120),
    entreprise: z.string().trim().min(2, 'Indiquez votre entreprise.').max(120),
    email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(200),
    confirmation: z.string(),
  })
  .refine((d) => d.password === d.confirmation, { message: 'Les deux mots de passe ne correspondent pas.', path: ['confirmation'] })

/** Demande de création de compte : le compte est créé « en attente » et validé par un administrateur. */
export async function inscription(_prev: EtatForm, formData: FormData): Promise<EtatForm> {
  const parsed = schemaInscription.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { nom, entreprise, email, password } = parsed.data
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: 'Un compte existe déjà avec cette adresse e-mail. Utilisez l’onglet Connexion.' }
  }
  await prisma.user.create({
    data: { name: nom, nomSociete: entreprise, email, password: await bcrypt.hash(password, 10), role: 'user', statut: 'en_attente' },
  })
  try {
    await signIn('credentials', { email, password, redirectTo: '/compte-en-attente?nouveau=1' })
  } catch (e) {
    if (e instanceof AuthError) return { message: 'Demande envoyée. Vous pourrez vous connecter après validation.' }
    throw e
  }
  return {}
}

export async function deconnexion() {
  await signOut({ redirectTo: '/login' })
}
