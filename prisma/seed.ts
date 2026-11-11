import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { couleursCategorie } from '../src/lib/design-tokens'
import { CATEGORIES_SYSTEME_SEED } from './seed-data'

const prisma = new PrismaClient()

async function main() {
  // Mode build (Vercel) : ne seed que si la base est vide — ne touche jamais aux données existantes.
  if (process.env.SEED_SI_VIDE === '1' && (await prisma.user.count()) > 0) {
    console.log('Base déjà initialisée : seed ignoré')
    return
  }
  const hash = await bcrypt.hash('demo1234', 10)
  await prisma.projet.deleteMany({ where: { name: 'Chantier LGV Sud' } })
  const admin = await prisma.user.upsert({
    where: { email: 'admin@conducrail.fr' },
    update: { password: hash },
    create: { email: 'admin@conducrail.fr', name: 'Admin Conducteur', password: hash, role: 'admin', nomSociete: 'VINCI Construction' },
  })
  const user = await prisma.user.upsert({
    where: { email: 'user@conducrail.fr' },
    update: { password: hash },
    create: { email: 'user@conducrail.fr', name: 'Utilisateur Démo', password: hash, role: 'user' },
  })
  const projet = await prisma.projet.create({
    data: {
      name: 'Chantier LGV Sud',
      description: 'Renouvellement voie et ballast — lot 2',
      moaNom: 'SNCF Réseau', moaPrenom: '', moaAdresse: '15-17 rue Jean-Philippe Rameau, 93200 Saint-Denis',
      numeroAffaire: 'AF-2026-014', numeroCommande: 'CMD-778451', numeroOTP: 'OTP-55120',
      adresseChantier: 'PK 112+300 à PK 128+900, Nîmes', dateDebut: new Date('2026-01-05'), dateFin: new Date('2026-12-18'),
      members: { create: [{ userId: admin.id, role: 'owner' }, { userId: user.id, role: 'member' }] },
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
