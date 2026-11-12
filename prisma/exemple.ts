import type { PrismaClient } from '@prisma/client'
import { couleursCategorie } from '../src/lib/design-tokens'
import { CATEGORIES_SYSTEME } from '../src/lib/categories-systeme'
import { seedModules } from './seed-modules'
import { completerJournalExemple } from './seed/journal'

/** Nom du projet d'exemple (une copie personnelle par utilisateur). */
export const NOM_PROJET_EXEMPLE = '[EXEMPLE] Groupe scolaire Les Tilleuls – construction neuve'

/** Crée un projet d'exemple complet (toutes les données de démo des modules) pour les membres donnés. */
export async function creerProjetExemple(prisma: PrismaClient, membres: { userId: string; role: string }[]) {
  const projet = await prisma.projet.create({
    data: {
      name: NOM_PROJET_EXEMPLE,
      description:
        'Construction neuve d’un groupe scolaire (R+1, 12 classes, restaurant scolaire) et aménagements extérieurs — marché en entreprise générale',
      moaNom: 'Ville de Saint-Exemple',
      moaPrenom: '',
      moaAdresse: '1 place de la Mairie, 99000 Saint-Exemple',
      numeroAffaire: 'AF-2026-014',
      numeroCommande: 'CMD-778451',
      numeroOTP: 'OTP-55120',
      adresseChantier: '12 avenue des Tilleuls, 99000 Saint-Exemple',
      dateDebut: new Date('2026-01-05'),
      dateFin: new Date('2026-12-18'),
      members: { create: membres },
      categories: { create: CATEGORIES_SYSTEME.map((c) => ({ nom: c.nom, estSysteme: true, ...couleursCategorie(c.cle) })) },
    },
  })
  await seedModules(prisma, projet.id)
  return projet.id
}

/** Crée le projet d'exemple d'un utilisateur s'il n'en possède pas déjà un. Renvoie true si créé. */
export async function assurerProjetExemple(prisma: PrismaClient, userId: string) {
  const existe = await prisma.projetMember.findFirst({ where: { userId, projet: { name: NOM_PROJET_EXEMPLE } } })
  if (existe) return false
  await creerProjetExemple(prisma, [{ userId, role: 'owner' }])
  return true
}

/** Ajoute aux projets d'exemple existants les données de démo apparues depuis (sans rien supprimer). */
export async function completerProjetsExemple(prisma: PrismaClient) {
  const projets = await prisma.projet.findMany({ where: { name: NOM_PROJET_EXEMPLE }, select: { id: true } })
  let ajouts = 0
  for (const p of projets) ajouts += await completerJournalExemple(prisma, p.id)
  return { projets: projets.length, evenementsAjoutes: ajouts }
}
