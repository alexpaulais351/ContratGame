import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { couleursCategorie } from '../src/lib/design-tokens'
import { CATEGORIES_SYSTEME_SEED } from './seed-data'

const prisma = new PrismaClient()

const NOM_DEMO = '[EXEMPLE] Groupe scolaire Les Tilleuls – construction neuve'

async function main() {
  // Mode build (Vercel, SEED_SI_VIDE=1) : AUCUN compte de démo n'est créé (site public).
  // On ajoute seulement le projet d'exemple s'il n'existe pas, rattaché aux administrateurs existants.
  const modeProduction = process.env.SEED_SI_VIDE === '1'
  let membres: { userId: string; role: string }[]

  if (modeProduction) {
    if (await prisma.projet.findFirst({ where: { name: NOM_DEMO } })) {
      console.log('Projet d’exemple déjà présent : seed ignoré')
      return
    }
    const admins = await prisma.user.findMany({ where: { role: 'admin' } })
    if (admins.length === 0) {
      console.log('Aucun administrateur : créez un compte admin avant de charger le projet d’exemple')
      return
    }
    membres = admins.map((a) => ({ userId: a.id, role: 'owner' }))
  } else {
    // Développement local : comptes de démo (mot de passe demo1234)
    const hash = await bcrypt.hash('demo1234', 10)
    await prisma.projet.deleteMany({ where: { name: { in: [NOM_DEMO, 'Chantier LGV Sud'] } } })
    const admin = await prisma.user.upsert({
      where: { email: 'admin@contratgame.fr' },
      update: { password: hash },
      create: { email: 'admin@contratgame.fr', name: 'Admin Conducteur', password: hash, role: 'admin', nomSociete: 'VINCI Construction' },
    })
    const user = await prisma.user.upsert({
      where: { email: 'user@contratgame.fr' },
      update: { password: hash },
      create: { email: 'user@contratgame.fr', name: 'Utilisateur Démo', password: hash, role: 'user' },
    })
    membres = [{ userId: admin.id, role: 'owner' }, { userId: user.id, role: 'member' }]
  }

  const projet = await prisma.projet.create({
    data: {
      name: NOM_DEMO,
      description: 'Construction neuve d’un groupe scolaire (R+1, 12 classes, restaurant scolaire) et aménagements extérieurs — marché en entreprise générale',
      moaNom: 'Ville de Saint-Exemple', moaPrenom: '', moaAdresse: '1 place de la Mairie, 99000 Saint-Exemple',
      numeroAffaire: 'AF-2026-014', numeroCommande: 'CMD-778451', numeroOTP: 'OTP-55120',
      adresseChantier: '12 avenue des Tilleuls, 99000 Saint-Exemple', dateDebut: new Date('2026-01-05'), dateFin: new Date('2026-12-18'),
      members: { create: membres },
      categories: { create: CATEGORIES_SYSTEME_SEED.map((c) => ({ nom: c.nom, estSysteme: true, ...couleursCategorie(c.cle) })) },
    },
  })
  console.log('Seed de base OK', projet.id)
  // (les données de démo par module sont ajoutées dans seedModules)
  const { seedModules } = await import('./seed-modules')
  await seedModules(prisma, projet.id)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
