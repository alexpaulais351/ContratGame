import type { PrismaClient } from '@prisma/client'
import { deflateSync } from 'node:zlib'

// ---------------------------------------------------------------------------
// Pièces jointes de démo générées à la volée (aucun fichier binaire versionné)
// ---------------------------------------------------------------------------

const TABLE_CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf: Buffer) {
  let c = 0xffffffff
  for (const b of buf) c = TABLE_CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

/** PNG RGB : bandes horizontales aux couleurs données (ex. ciel / terre / réseaux). */
function pngBandes(largeur: number, hauteur: number, bandes: [number, number, number][]) {
  const ligne = 1 + largeur * 3
  const brut = Buffer.alloc(ligne * hauteur)
  for (let y = 0; y < hauteur; y++) {
    const [r, g, b] = bandes[Math.min(bandes.length - 1, Math.floor((y / hauteur) * bandes.length))]
    brut[y * ligne] = 0
    for (let x = 0; x < largeur; x++) {
      // stries verticales sombres dans la bande centrale
      const strie = y > hauteur * 0.4 && y < hauteur * 0.7 && x % 40 < 8
      const o = y * ligne + 1 + x * 3
      brut[o] = strie ? 90 : r
      brut[o + 1] = strie ? 90 : g
      brut[o + 2] = strie ? 90 : b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largeur, 0)
  ihdr.writeUInt32BE(hauteur, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(brut)),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return png
}

/** PDF minimal d'une page avec quelques lignes de texte (Helvetica). */
function pdfTexte(lignes: string[]) {
  const contenu = ['BT', '/F1 14 Tf', '60 780 Td', '18 TL', ...lignes.map((l) => `(${l.replace(/[()\\]/g, '')}) '`), 'ET'].join('\n')
  const objets = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(contenu, 'latin1')} >>\nstream\n${contenu}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ]
  let sortie = '%PDF-1.4\n'
  const offsets: number[] = []
  objets.forEach((o, i) => {
    offsets.push(Buffer.byteLength(sortie, 'latin1'))
    sortie += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = Buffer.byteLength(sortie, 'latin1')
  sortie += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`
  sortie += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  sortie += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(sortie, 'latin1')
}

function fichier(nom: string, type: string, buf: Buffer) {
  return { nom, type, taille: buf.length, contenu: `data:${type};base64,${buf.toString('base64')}` }
}

// ---------------------------------------------------------------------------

type Ev = {
  date: string
  titre: string
  description?: string
  categorie: string
  afficherFrise?: boolean
  fichiers?: ReturnType<typeof fichier>[]
}

const jour = (s: string) => new Date(`${s}T12:00:00.000Z`)

/**
 * Données de démo du Journal : ~12 événements (janvier → juin 2026) sur plusieurs
 * catégories système, dont des groupes rapprochés (anti-chevauchement de la frise),
 * + une fiche écart (1 chapitre + lignes, dont une importée d'un événement).
 */
export async function seedJournal(prisma: PrismaClient, projetId: string) {
  const categories = await prisma.categorieEvenement.findMany({ where: { projetId } })
  const cat = (nom: string) => categories.find((c) => c.nom === nom)

  const photoReseaux = fichier(
    'photo-reseaux-enterres.png',
    'image/png',
    pngBandes(480, 300, [
      [128, 180, 255], // ciel (bleu ciel VINCI)
      [181, 171, 161], // terre (gris chaud)
      [194, 106, 50], // réseaux enterrés (orange brun)
      [181, 171, 161],
    ]),
  )
  const photoBeton = fichier('livraison-beton.png', 'image/png', pngBandes(400, 260, [[229, 239, 248], [181, 171, 161], [122, 165, 54]]))
  const pvReunion = fichier(
    'CR-reunion-lancement.pdf',
    'application/pdf',
    pdfTexte([
      'Compte rendu - Reunion de lancement',
      'Groupe scolaire Les Tilleuls - construction neuve',
      '',
      'Presents : MOA, MOE, groupement',
      '- Planning general valide',
      '- Phasage des travaux de terrassement et de gros oeuvre',
      '- Prochaine reunion : 02/02/2026',
    ]),
  )

  const evenements: Ev[] = [
    {
      date: '2026-01-08',
      titre: 'Réunion de lancement du chantier',
      description: 'Réunion avec la MOA et la MOE : validation du planning général et du phasage des travaux.',
      categorie: 'Contrat',
      fichiers: [pvReunion],
    },
    {
      date: '2026-01-12',
      titre: 'Constitution du groupement validée',
      description: 'Convention de groupement signée, mandataire désigné.',
      categorie: 'Groupement',
    },
    {
      date: '2026-01-14',
      titre: 'Diffusion des plans EXE structure indice A',
      categorie: 'Étude diffusion',
    },
    {
      date: '2026-02-03',
      titre: 'VISA refusé : note de calcul des fondations',
      description: 'Observations de la MOE sur la note de calcul des fondations, reprise demandée sous 15 jours.',
      categorie: 'VISA étude',
    },
    {
      date: '2026-02-24',
      titre: 'Découverte de réseaux enterrés non répertoriés',
      description: 'Canalisations et fourreaux non reportés au DCE en limite nord du terrain. Arrêt partiel de la zone et demande de dévoiement.',
      categorie: 'SOS terrain',
      fichiers: [photoReseaux],
    },
    {
      date: '2026-02-25',
      titre: 'Arrêt partiel de la zone nord',
      categorie: 'Alerte',
    },
    {
      date: '2026-02-26',
      titre: 'Demande de dévoiement adressée à la MOA',
      categorie: 'Suivi / impact',
    },
    {
      date: '2026-03-18',
      titre: 'Point EBGC mensuel',
      description: 'Revue des indicateurs environnement et bilan carbone du mois.',
      categorie: 'EBGC',
    },
    {
      date: '2026-04-07',
      titre: 'Intempéries : arrêt de chantier de 5 jours',
      description: 'Fortes pluies : terrassements et coulages impossibles. Impact sur la phase de gros œuvre.',
      categorie: 'Alerte',
      fichiers: [photoBeton],
    },
    {
      date: '2026-04-09',
      titre: 'Livraison béton retardée de 10 jours',
      description: 'Centrale à béton en arrêt technique. Replanification des coulages de mai.',
      categorie: 'Suivi / impact',
    },
    {
      date: '2026-05-21',
      titre: 'VISA favorable : plans EXE structure indice B',
      categorie: 'VISA étude',
    },
    {
      date: '2026-06-15',
      titre: 'Réception partielle du gros œuvre',
      description: 'Réception avec réserves mineures (reprises de bétons apparents).',
      categorie: 'Contrat',
    },
    {
      date: '2026-06-16',
      titre: 'Note interne : retour d’expérience phase 1',
      categorie: 'Autre',
      afficherFrise: false,
    },
  ]

  await prisma.ligneFicheEcart.deleteMany({ where: { projetId } })
  await prisma.evenementChantier.deleteMany({ where: { projetId, titre: { in: evenements.map((e) => e.titre) } } })

  const ids: Record<string, string> = {}
  for (const e of evenements) {
    const c = cat(e.categorie)
    const cree = await prisma.evenementChantier.create({
      data: {
        projetId,
        date: jour(e.date),
        titre: e.titre,
        description: e.description ?? null,
        categorie: c?.nom ?? '',
        categorieId: c?.id ?? null,
        afficherFrise: e.afficherFrise ?? true,
        fichiers: e.fichiers ? { create: e.fichiers } : undefined,
      },
    })
    ids[e.titre] = cree.id
  }

  // Fiche écart : 1 chapitre + lignes (dont une importée depuis un événement)
  const evReseaux = evenements[4]
  await prisma.ligneFicheEcart.createMany({
    data: [
      { projetId, ordre: 0, estChapitre: true, etude: 'Terrassements et réseaux', chapitre: 'Terrassements et réseaux' },
      {
        projetId,
        ordre: 1,
        evenementId: ids[evReseaux.titre],
        etude: `${evReseaux.titre} (${evReseaux.date.split('-').reverse().join('/')})`,
        prevuDCE: 'Aucun réseau enterré recensé en limite nord du terrain.',
        phaseTransitoire: 'Protection provisoire des réseaux et balisage de la zone.',
        exe: 'Dévoiement définitif des réseaux sous fourreaux.',
        impacts: 'Arrêt partiel de la zone, reprise du phasage des terrassements.',
        delaisImpactes: '+ 8 jours',
        coutImpactes: '18 500 € HT (estimation)',
      },
      {
        projetId,
        ordre: 2,
        etude: 'Profondeur des fondations zone B',
        prevuDCE: 'Semelles filantes ancrées à 1,20 m',
        phaseTransitoire: 'Terrassement provisoire à 1,50 m',
        exe: 'Ancrage à 2,00 m demandé par la MOE (VISA indice B)',
        impacts: 'Surconsommation de béton, purge de sol supplémentaire.',
        delaisImpactes: '+ 3 jours',
        coutImpactes: '42 000 € HT',
      },
    ],
  })
}
