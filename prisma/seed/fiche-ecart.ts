import type { PrismaClient } from '@prisma/client'

/**
 * Fiche écart du projet d'exemple : écarts entre le DCE, la phase transitoire et l'EXE,
 * avec impacts délais / coûts. Les lignes « evenement » sont rattachées à un événement du Journal (par titre).
 */
type LigneModele = {
  chapitre: string
  etude: string
  evenement?: string
  prevuDCE: string
  phaseTransitoire: string
  exe: string
  impacts: string
  delaisImpactes: string
  coutImpactes: string
}

const L = (chapitre: string, l: Omit<LigneModele, 'chapitre'>): LigneModele => ({ chapitre, ...l })

export function ficheEcartExemple(): LigneModele[] {
  const TR = 'Terrassements et réseaux'
  const FO = 'Fondations et gros œuvre'
  const ET = 'Études, VISA et plans EXE'
  const PH = 'Phasage, planning et aléas'
  const CS = 'Clos-couvert et second œuvre'
  const AP = 'Approvisionnements et sous-traitance'
  return [
    L(TR, {
      etude: 'Découverte de réseaux enterrés non répertoriés', evenement: 'Découverte de réseaux enterrés non répertoriés',
      prevuDCE: 'Aucun réseau enterré recensé en limite nord du terrain (DICT et plans concessionnaires).',
      phaseTransitoire: 'Protection provisoire des réseaux, balisage et arrêt partiel de la zone nord.',
      exe: 'Dévoiement définitif des réseaux sous fourreaux par le concessionnaire.',
      impacts: 'Arrêt partiel de la zone, reprise du phasage des terrassements, mobilisation de l’équipe en zone sud.',
      delaisImpactes: '+ 8 jours', coutImpactes: '18 500 € HT (estimation)',
    }),
    L(TR, {
      etude: 'Nature du sol en zone B (poches d’argile)',
      prevuDCE: 'Sol homogène de limons (étude G2 AVP), réemploi des déblais en remblai.',
      phaseTransitoire: 'Stockage séparé des argiles, essais complémentaires (G3).',
      exe: 'Évacuation des argiles en ISDI et apport de matériaux d’emprunt 0/31,5.',
      impacts: 'Volume d’évacuation + 650 m³, rotations de camions supplémentaires.',
      delaisImpactes: '+ 4 jours', coutImpactes: '24 700 € HT',
    }),
    L(TR, {
      etude: 'Niveau de la nappe phréatique',
      prevuDCE: 'Nappe à – 4,50 m (relevé de mars 2024).',
      phaseTransitoire: 'Pompage provisoire en fond de fouille sur 3 semaines.',
      exe: 'Rabattement de nappe par pointes filtrantes en zone C.',
      impacts: 'Matériel de pompage, autorisation de rejet au réseau pluvial.',
      delaisImpactes: '+ 5 jours', coutImpactes: '15 200 € HT',
    }),
    L(FO, {
      etude: 'Profondeur des fondations zone B',
      prevuDCE: 'Semelles filantes ancrées à 1,20 m',
      phaseTransitoire: 'Terrassement provisoire à 1,50 m',
      exe: 'Ancrage à 2,00 m demandé par la MOE (VISA indice B)',
      impacts: 'Surconsommation de béton, purge de sol supplémentaire.',
      delaisImpactes: '+ 3 jours', coutImpactes: '42 000 € HT',
    }),
    L(FO, {
      etude: 'Note de calcul des fondations refusée', evenement: 'VISA refusé : note de calcul des fondations',
      prevuDCE: 'Fondations superficielles conformes au rapport géotechnique G2 PRO.',
      phaseTransitoire: 'Attente de la note indice B, démarrage décalé de la zone B.',
      exe: 'Semelles redimensionnées (+ 15 % d’acier) après reprise de la note de calcul.',
      impacts: 'Report du coulage des fondations zone B, surcoût aciers.',
      delaisImpactes: '+ 6 jours', coutImpactes: '9 800 € HT',
    }),
    L(FO, {
      etude: 'Réservations pour fluides dans les voiles',
      prevuDCE: 'Réservations définies sur les plans de synthèse DCE.',
      phaseTransitoire: 'Carottages ponctuels pour les réservations oubliées.',
      exe: '32 carottages Ø 100 à 250 mm après synthèse avec les lots CVC et plomberie.',
      impacts: 'Intervention d’une entreprise de sciage, contrôle des armatures.',
      delaisImpactes: 'Sans impact (hors chemin critique)', coutImpactes: '6 400 € HT',
    }),
    L(FO, {
      etude: 'Classe d’exposition des bétons extérieurs',
      prevuDCE: 'Béton C25/30 XC1 pour l’ensemble des ouvrages.',
      phaseTransitoire: '—',
      exe: 'Béton C30/37 XF1 pour les ouvrages extérieurs exposés au gel (demande du bureau de contrôle).',
      impacts: 'Plus-value fournisseur béton sur 180 m³.',
      delaisImpactes: 'Aucun', coutImpactes: '3 600 € HT',
    }),
    L(ET, {
      etude: 'Retard de diffusion des plans EXE structure', evenement: 'Diffusion des plans EXE structure indice A',
      prevuDCE: 'Plans EXE diffusés 4 semaines avant le démarrage des fondations.',
      phaseTransitoire: 'Démarrage sur plans indice A non visés, aux risques de l’entreprise refusé par la MOE.',
      exe: 'VISA favorable indice B obtenu le 21/05 après 2 cycles d’observations.',
      impacts: 'Glissement de la phase gros œuvre, immobilisation des banches.',
      delaisImpactes: '+ 10 jours', coutImpactes: '12 300 € HT (immobilisation matériel)',
    }),
    L(ET, {
      etude: 'Observations sur les plans réseaux', evenement: 'VISA avec observations : plans réseaux',
      prevuDCE: 'Réseaux EU/EP gravitaires sans relevage.',
      phaseTransitoire: 'Réseaux posés hors zone de conflit, attente de la mise à jour.',
      exe: 'Poste de relevage EU ajouté pour le bâtiment B (cote du collecteur public).',
      impacts: 'Fourniture et pose d’un poste de relevage, alimentation électrique dédiée.',
      delaisImpactes: '+ 2 jours', coutImpactes: '21 900 € HT (prix nouveau à présenter)',
    }),
    L(PH, {
      etude: 'Modification du phasage par la MOA', evenement: 'Ordre de service n°2 : modification du phasage',
      prevuDCE: 'Bâtiment A puis bâtiment B (planning DCE).',
      phaseTransitoire: 'Travaux simultanés A et B pendant 6 semaines.',
      exe: 'Bâtiment B prioritaire (livraison anticipée de la cantine).',
      impacts: 'Second jeu de banches, grue déplacée, équipe renforcée.',
      delaisImpactes: 'Neutre sur la date de fin', coutImpactes: '28 000 € HT',
    }),
    L(PH, {
      etude: 'Intempéries au-delà du seuil contractuel', evenement: 'Intempéries : arrêt de chantier de 5 jours',
      prevuDCE: '10 jours d’intempéries prévus au CCAP sur la durée du chantier.',
      phaseTransitoire: 'Arrêt de 5 jours, mise en sécurité du chantier.',
      exe: 'Prolongation de délai demandée (jours au-delà du seuil, relevés Météo-France).',
      impacts: 'Glissement des corps d’état suivants.',
      delaisImpactes: '+ 5 jours', coutImpactes: 'Frais de mise en sécurité : 2 100 € HT',
    }),
    L(PH, {
      etude: 'Canicule : adaptation des horaires', evenement: 'Canicule : adaptation des horaires',
      prevuDCE: 'Horaires 7h30 – 17h00.',
      phaseTransitoire: 'Horaires 6h – 13h pendant 2 semaines.',
      exe: 'Retour aux horaires normaux, production ajustée.',
      impacts: 'Perte de productivité estimée à 15 % sur la période.',
      delaisImpactes: '+ 2 jours', coutImpactes: 'Non chiffré',
    }),
    L(CS, {
      etude: 'Menuiseries extérieures : performance acoustique',
      prevuDCE: 'Menuiseries alu Rw + Ctr = 30 dB.',
      phaseTransitoire: 'Commande suspendue dans l’attente de l’étude acoustique.',
      exe: 'Vitrages feuilletés acoustiques Rw + Ctr = 35 dB en façade sur rue.',
      impacts: 'Plus-value vitrages, décalage de la mise hors d’air.',
      delaisImpactes: '+ 7 jours', coutImpactes: '31 500 € HT',
    }),
    L(CS, {
      etude: 'Étanchéité de la toiture-terrasse',
      prevuDCE: 'Toiture-terrasse inaccessible, étanchéité bicouche autoprotégée.',
      phaseTransitoire: '—',
      exe: 'Toiture végétalisée extensive (demande de la MOA en cours de chantier).',
      impacts: 'Vérification des charges, complexe végétalisé, entretien à prévoir.',
      delaisImpactes: '+ 4 jours', coutImpactes: '38 200 € HT (PN-002)',
    }),
    L(CS, {
      etude: 'Revêtements de sol des salles de classe',
      prevuDCE: 'Sol PVC U2S P3 en lés.',
      phaseTransitoire: '—',
      exe: 'Sol PVC acoustique U3 P3 (variante acceptée par la MOE).',
      impacts: 'Moins-value acceptée en contrepartie d’un délai fournisseur réduit.',
      delaisImpactes: '– 3 jours', coutImpactes: '– 4 800 € HT (moins-value)',
    }),
    L(AP, {
      etude: 'Pénurie d’aciers', evenement: 'Pénurie d’aciers : retard fournisseur',
      prevuDCE: 'Armatures façonnées livrées sous 10 jours.',
      phaseTransitoire: 'Fournisseur de secours, livraisons fractionnées.',
      exe: 'Retour au fournisseur principal à partir de juin.',
      impacts: 'Plus-value de transport, réorganisation des coulages.',
      delaisImpactes: '+ 9 jours', coutImpactes: '7 900 € HT',
    }),
    L(AP, {
      etude: 'Livraison béton retardée', evenement: 'Livraison béton retardée de 10 jours',
      prevuDCE: 'Centrale BPE à 12 km, livraisons à la demande.',
      phaseTransitoire: 'Coulages reportés, équipe réaffectée au coffrage.',
      exe: 'Contrat cadre avec une seconde centrale.',
      impacts: 'Immobilisation partielle de l’équipe gros œuvre.',
      delaisImpactes: '+ 3 jours', coutImpactes: '4 200 € HT',
    }),
    L(AP, {
      etude: 'Défaillance du sous-traitant terrassement', evenement: 'Mise en demeure du sous-traitant terrassement',
      prevuDCE: 'Terrassements sous-traités (marché ST du 12/01/2026).',
      phaseTransitoire: 'Mise en demeure, renfort par les moyens propres de l’entreprise.',
      exe: 'Reprise partielle des travaux en régie, réfaction sur la facturation du ST.',
      impacts: 'Encadrement supplémentaire, pénalités appliquées au sous-traitant.',
      delaisImpactes: '+ 4 jours', coutImpactes: '11 600 € HT (dont 6 000 € récupérables sur le ST)',
    }),
  ]
}

const etudeLigne = (l: LigneModele, dates: Map<string, Date>) => {
  if (!l.evenement) return l.etude
  const d = dates.get(l.evenement)
  if (!d) return l.etude
  const dd = d.toISOString().slice(0, 10).split('-').reverse().join('/')
  return `${l.etude} (${dd})`
}

async function evenementsParTitre(prisma: PrismaClient, projetId: string) {
  const evs = await prisma.evenementChantier.findMany({ where: { projetId }, select: { id: true, titre: true, date: true } })
  return { ids: new Map(evs.map((e) => [e.titre, e.id])), dates: new Map(evs.map((e) => [e.titre, e.date])) }
}

/** Ligne de modèle → données Prisma. */
function versDonnees(projetId: string, l: LigneModele, ordre: number, ev: { ids: Map<string, string>; dates: Map<string, Date> }) {
  return {
    projetId,
    ordre,
    chapitre: l.chapitre,
    estChapitre: false,
    evenementId: l.evenement ? ev.ids.get(l.evenement) ?? null : null,
    etude: etudeLigne(l, ev.dates),
    prevuDCE: l.prevuDCE,
    phaseTransitoire: l.phaseTransitoire,
    exe: l.exe,
    impacts: l.impacts,
    delaisImpactes: l.delaisImpactes,
    coutImpactes: l.coutImpactes,
  }
}

/** Fiche écart complète pour un projet neuf (après création des événements du Journal). */
export async function seedFicheEcart(prisma: PrismaClient, projetId: string) {
  await prisma.ligneFicheEcart.deleteMany({ where: { projetId } })
  const ev = await evenementsParTitre(prisma, projetId)
  const data: ReturnType<typeof versDonnees>[] = []
  const chapitres: { projetId: string; ordre: number; estChapitre: true; etude: string; chapitre: string }[] = []
  let ordre = 0
  let courant = ''
  for (const l of ficheEcartExemple()) {
    if (l.chapitre !== courant) {
      courant = l.chapitre
      chapitres.push({ projetId, ordre: ordre++, estChapitre: true, etude: l.chapitre, chapitre: l.chapitre })
    }
    data.push(versDonnees(projetId, l, ordre++, ev))
  }
  await prisma.ligneFicheEcart.createMany({ data: [...chapitres, ...data] })
}

/** Clé de rapprochement : intitulé sans la date entre parenthèses finale. */
const cle = (etude: string) => etude.replace(/\s*\(\d{2}\/\d{2}\/\d{4}\)\s*$/, '').trim().toLowerCase()

/**
 * Complète la fiche écart d'un projet d'exemple existant, sans rien supprimer ni modifier le contenu des lignes :
 * - si la fiche ne contient que des lignes de démo, les lignes manquantes sont insérées à leur place (ordre recalculé) ;
 * - sinon (lignes ajoutées par l'utilisateur), les lignes manquantes sont ajoutées à la fin, par chapitre.
 * Retourne le nombre de lignes ajoutées (chapitres compris).
 */
export async function completerFicheEcartExemple(prisma: PrismaClient, projetId: string) {
  const modele = ficheEcartExemple()
  const existantes = await prisma.ligneFicheEcart.findMany({ where: { projetId }, orderBy: { ordre: 'asc' } })
  // anciens libellés de démo rattachés aux nouveaux (la 1re version importait l'événement sous son titre)
  const clesModele = new Set([...modele.map((l) => cle(l.etude)), ...modele.flatMap((l) => (l.evenement ? [cle(l.evenement)] : [])), ...new Set(modele.map((l) => cle(l.chapitre)))])
  const parCle = new Map(existantes.map((e) => [cle(e.etude), e]))
  const trouve = (l: LigneModele) => parCle.get(cle(l.etude)) ?? (l.evenement ? parCle.get(cle(l.evenement)) : undefined)
  const manquantes = modele.filter((l) => !trouve(l))
  const chapitresExistants = new Set(existantes.filter((e) => e.estChapitre).map((e) => cle(e.etude)))
  if (manquantes.length === 0) return 0

  const ev = await evenementsParTitre(prisma, projetId)
  const uniquementDemo = existantes.every((e) => clesModele.has(cle(e.etude)))
  let ajoutes = 0

  if (uniquementDemo) {
    // Reconstruit l'ordre complet selon le modèle, en conservant les lignes existantes telles quelles.
    let ordre = 0
    let courant = ''
    await prisma.$transaction(async (tx) => {
      for (const l of modele) {
        if (l.chapitre !== courant) {
          courant = l.chapitre
          const ch = parCle.get(cle(l.chapitre))
          if (ch && ch.estChapitre) await tx.ligneFicheEcart.update({ where: { id: ch.id }, data: { ordre: ordre++ } })
          else {
            await tx.ligneFicheEcart.create({ data: { projetId, ordre: ordre++, estChapitre: true, etude: l.chapitre, chapitre: l.chapitre } })
            ajoutes++
          }
        }
        const e = trouve(l)
        if (e) await tx.ligneFicheEcart.update({ where: { id: e.id }, data: { ordre: ordre++ } })
        else {
          await tx.ligneFicheEcart.create({ data: versDonnees(projetId, l, ordre++, ev) })
          ajoutes++
        }
      }
    })
    return ajoutes
  }

  // Fiche personnalisée : ajout en fin, groupé par chapitre.
  let ordre = (existantes.at(-1)?.ordre ?? -1) + 1
  let courant = ''
  for (const l of manquantes) {
    if (l.chapitre !== courant) {
      courant = l.chapitre
      if (!chapitresExistants.has(cle(l.chapitre))) {
        await prisma.ligneFicheEcart.create({ data: { projetId, ordre: ordre++, estChapitre: true, etude: l.chapitre, chapitre: l.chapitre } })
        chapitresExistants.add(cle(l.chapitre))
        ajoutes++
      }
    }
    await prisma.ligneFicheEcart.create({ data: versDonnees(projetId, l, ordre++, ev) })
    ajoutes++
  }
  return ajoutes
}
