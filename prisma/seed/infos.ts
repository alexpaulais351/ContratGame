import type { PrismaClient } from '@prisma/client'

// Rien à ajouter : le seed de base crée déjà users + projet + membres.
export async function seedInfos(_prisma: PrismaClient, _projetId: string): Promise<void> {}
