'use server'
import { AuthError } from 'next-auth'
import { signIn, signOut } from '@/lib/auth'

export async function connexion(_prev: string | null, formData: FormData): Promise<string | null> {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? '').toLowerCase(),
      password: String(formData.get('password') ?? ''),
      redirectTo: String(formData.get('callbackUrl') || '/accueil'),
    })
    return null
  } catch (e) {
    if (e instanceof AuthError) return 'Email ou mot de passe incorrect'
    throw e
  }
}

export async function deconnexion() {
  await signOut({ redirectTo: '/login' })
}
