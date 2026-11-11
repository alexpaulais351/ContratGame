import type { Prisma, PrismaClient } from '@prisma/client'

type LigneSeed = [code: string, designation: string, unite: string, quantite: number, prixUnitaire: number]
type ChapitreSeed = { code: string; designation: string; lignes: LigneSeed[] }

/** DE de démo : renouvellement voie-ballast LGV (montants HT réalistes). */
const CHAPITRES: ChapitreSeed[] = [
  {
    code: '01',
    designation: 'Installations de chantier et travaux préparatoires',
    lignes: [
      ['01.01', 'Installation, entretien et repli de la base travaux', 'Ft', 1, 185000],
      ['01.02', 'Protection du personnel (annonceurs, sentinelles, ASP)', 'sem', 24, 6800],
      ['01.03', "Études d'exécution et plans de récolement", 'Ft', 1, 42000],
      ['01.04', 'Constat contradictoire des abords et accès chantier', 'u', 2, 1500],
    ],
  },
  {
    code: '02',
    designation: 'Dépose de la voie existante',
    lignes: [
      ['02.01', 'Dépose de voie existante (rails UIC 60 + traverses bois)', 'ml', 8200, 18.5],
      ['02.02', 'Évacuation et traitement des traverses bois créosotées', 't', 1650, 145],
      ['02.03', 'Dégarnissage du ballast sur 30 cm sous traverse', 'm3', 9800, 22.4],
      ['02.04', 'Évacuation du ballast pollué en ISDND', 't', 15600, 31.5],
    ],
  },
  {
    code: '03',
    designation: 'Pose de voie neuve',
    lignes: [
      ['03.01', 'Fourniture ballast 31,5/50 calibré', 't', 21400, 28.9],
      ['03.02', 'Mise en œuvre et réglage du ballast', 'm3', 12500, 9.8],
      ['03.03', 'Fourniture traverses béton monobloc M450', 'u', 13700, 68],
      ['03.04', 'Pose de traverses béton (travelage 60 cm)', 'u', 13700, 12.5],
      ['03.05', 'Fourniture rail 60E1 R260 en barres de 108 m', 'ml', 16400, 52.3],
      ['03.06', 'Pose de rail 60E1 et attaches Fastclip', 'ml', 16400, 14.6],
      ['03.07', 'Soudures aluminothermiques (procédé SkV)', 'u', 310, 420],
      ['03.08', 'Libération des contraintes des LRS', 'ml', 8200, 3.9],
      ['03.09', 'Bourrage-dressage mécanisé (3 passes)', 'ml', 8200, 6.2],
      ['03.10', 'Stabilisation dynamique de la voie', 'ml', 8200, 1.85],
      ['03.11', 'Meulage préventif des rails neufs', 'ml', 16400, 2.1],
    ],
  },
  {
    code: '04',
    designation: 'Appareils de voie',
    lignes: [
      ['04.01', 'Dépose des appareils de voie existants', 'u', 4, 9500],
      ['04.02', 'Fourniture et pose aiguillage 60E1 tg 0,034', 'u', 2, 285000],
      ['04.03', 'Fourniture et pose aiguillage 60E1 tg 0,11', 'u', 2, 168000],
      ['04.04', 'Réglage, soudures et contrôle des appareils', 'u', 4, 12500],
    ],
  },
  {
    code: '05',
    designation: 'Signalisation et équipements',
    lignes: [
      ['05.01', 'Dépose / repose crocodiles et balises KVB', 'u', 36, 1450],
      ['05.02', 'Câblage et raccordements signalisation', 'ml', 2400, 38],
      ['05.03', 'Essais et mise en service signalisation', 'Ft', 1, 35000],
      ['05.04', 'Repérage kilométrique (plaques PK)', 'u', 34, 210],
    ],
  },
]

/**
 * Données de démo du module Détail Estimatif + Co-traitance :
 * 5 chapitres, 27 lignes, 2 co-traitants (VINCI mandataire + un partenaire signalisation)
 * et une répartition du PU sur les chapitres 04-05 (les autres lignes restent à répartir).
 */
export async function seedDetailEstimatif(prisma: PrismaClient, projetId: string) {
  await prisma.ligneDE.deleteMany({ where: { projetId } })
  await prisma.coTraitant.deleteMany({ where: { projetId } })

  const vinci = await prisma.coTraitant.create({
    data: { projetId, nom: 'VINCI Construction Ferroviaire', estMandataire: true, ordre: 0 },
  })
  const partenaire = await prisma.coTraitant.create({
    data: { projetId, nom: 'Signalisation Rail Sud', estMandataire: false, ordre: 1 },
  })

  /** Part du partenaire par ligne (le reste du PU va au mandataire). */
  const partPartenaire: Record<string, number> = {
    '04.01': 0,
    '04.02': 85000,
    '04.03': 52000,
    '04.04': 4500,
    '05.01': 1450,
    '05.02': 38,
    '05.03': 17500,
    '05.04': 0,
    '03.07': 0,
  }

  const data: Prisma.LigneDECreateManyInput[] = []
  let ordre = 0
  for (const ch of CHAPITRES) {
    data.push({ projetId, code: ch.code, designation: ch.designation, estChapitre: true, ordre: ordre++ })
    for (const [code, designation, unite, quantite, prixUnitaire] of ch.lignes) {
      const part = partPartenaire[code]
      data.push({
        projetId,
        code,
        designation,
        unite,
        quantite,
        prixUnitaire,
        estChapitre: false,
        ordre: ordre++,
        repartition:
          part === undefined ? undefined : { [vinci.id]: Math.round((prixUnitaire - part) * 100) / 100, [partenaire.id]: part },
      })
    }
  }
  await prisma.ligneDE.createMany({ data })
  console.log(`  Détail Estimatif : ${data.length} lignes, 2 co-traitants`)
}
