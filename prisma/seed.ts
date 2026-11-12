import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NOM_PROJET_EXEMPLE, assurerProjetExemple, completerProjetsExemple, creerProjetExemple } from './exemple'

const prisma = new PrismaClient()

async function main() {
  // Mode build (Vercel, SEED_SI_VIDE=1) : AUCUN compte de démo n'est créé (site public).
  //  - les projets d'exemple existants sont complétés (nouvelles données de démo, sans rien supprimer) ;
  //  - chaque administrateur actif sans projet d'exemple en reçoit un.
  if (process.env.SEED_SI_VIDE === '1') {
    const r = await completerProjetsExemple(prisma)
    console.log(`Projets d'exemple : ${r.projets}, événements ajoutés : ${r.evenementsAjoutes}`)
    const admins = await prisma.user.findMany({ where: { role: 'admin', statut: 'approuve' }, select: { id: true } })
    for (const a of admins) if (await assurerProjetExemple(prisma, a.id)) console.log('Projet d’exemple créé pour un administrateur')
    return
  }

  // Développement local : comptes de démo (mot de passe demo1234) + projet d'exemple partagé
  const hash = await bcrypt.hash('demo1234', 10)
  await prisma.projet.deleteMany({ where: { name: { in: [NOM_PROJET_EXEMPLE, 'Chantier LGV Sud'] } } })
  const admin = await prisma.user.upsert({
    where: { email: 'admin@contratgame.fr' },
    update: { password: hash, statut: 'approuve' },
    create: { email: 'admin@contratgame.fr', name: 'Admin Conducteur', password: hash, role: 'admin', nomSociete: 'VINCI Construction' },
  })
  const user = await prisma.user.upsert({
    where: { email: 'user@contratgame.fr' },
    update: { password: hash, statut: 'approuve' },
    create: { email: 'user@contratgame.fr', name: 'Utilisateur Démo', password: hash, role: 'user' },
  })
  const id = await creerProjetExemple(prisma, [
    { userId: admin.id, role: 'owner' },
    { userId: user.id, role: 'member' },
  ])
  console.log('Seed OK', id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
