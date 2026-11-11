import type { PrismaClient } from '@prisma/client'
import { seedInfos } from './seed/infos'
import { seedDetailEstimatif } from './seed/detail-estimatif'
import { seedSousTraitants } from './seed/sous-traitants'
import { seedSituations } from './seed/situations'
import { seedPrixNouveaux } from './seed/prix-nouveaux'
import { seedCourriers } from './seed/courriers'
import { seedMatrice } from './seed/matrice'

/** Données de démo par module (ordre important : DE avant Situations). */
export async function seedModules(prisma: PrismaClient, projetId: string) {
  const etapes: [string, (p: PrismaClient, id: string) => Promise<unknown>][] = [
    ['Infos', seedInfos],
    ['Détail Estimatif', seedDetailEstimatif],
    ['Sous-traitants', seedSousTraitants],
    ['Situations', seedSituations],
    ['Prix Nouveaux', seedPrixNouveaux],
    ['Courriers', seedCourriers],
    ['Matrice', seedMatrice],
  ]
  for (const [nom, fn] of etapes) {
    await fn(prisma, projetId)
    console.log(`  ✓ ${nom}`)
  }
}
