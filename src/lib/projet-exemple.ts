import { prisma } from '@/lib/prisma'
import { assurerProjetExemple } from '../../prisma/exemple'

/**
 * Donne à un utilisateur sa propre copie du projet d'exemple (s'il n'en a pas).
 * Appelé quand un compte est validé ou créé par un administrateur. N'échoue jamais : en cas
 * d'erreur, le compte reste valide et l'erreur est journalisée.
 */
export async function donnerProjetExemple(userId: string) {
  try {
    await assurerProjetExemple(prisma, userId)
  } catch (e) {
    console.error('Création du projet d’exemple impossible', e)
  }
}
