/**
 * Délais et règles clés d'un marché public de travaux.
 * Références : CCAG Travaux 2021 (arrêté du 30 mars 2021 modifié) et code de la commande publique (CCP).
 * « À vérifier » = valeur non confirmée par une source officielle lors de la rédaction, ou susceptible
 * d'évoluer : se reporter au texte en vigueur et aux pièces du marché.
 */

export type ThemeDelai =
  | 'Calcul des délais'
  | 'Ordres de service'
  | 'Paiement'
  | 'Avance & garanties financières'
  | 'Pénalités'
  | 'Modification du marché'
  | 'Ajournement & interruption'
  | 'Réception'
  | 'Garanties'
  | 'Décompte'
  | 'Différends'
  | 'Assurances'

export type DelaiCle = {
  theme: ThemeDelai
  regle: string
  delai: string
  depart: string
  article: string
  consequence: string
  aVerifier?: boolean
}

export const THEMES_DELAIS: ThemeDelai[] = [
  'Calcul des délais', 'Ordres de service', 'Paiement', 'Avance & garanties financières', 'Pénalités',
  'Modification du marché', 'Ajournement & interruption', 'Réception', 'Garanties', 'Décompte', 'Différends', 'Assurances',
]

export const DELAIS_CLES: DelaiCle[] = [
  // Calcul des délais
  {
    theme: 'Calcul des délais', regle: 'Les délais en jours sont des jours calendaires ; le jour de l’acte de départ n’est pas compté ; expiration à minuit le dernier jour',
    delai: '—', depart: 'Lendemain de l’acte ou du fait', article: 'CCAG 2021 art. 3.2', consequence: '—',
  },
  {
    theme: 'Calcul des délais', regle: 'Délai en mois : de quantième à quantième (dernier jour du mois si le quantième n’existe pas)',
    delai: '—', depart: 'Acte ou fait générateur', article: 'CCAG 2021 art. 3.2', consequence: '—',
  },
  {
    theme: 'Calcul des délais', regle: 'Dernier jour = samedi, dimanche ou jour férié/chômé : le délai est prolongé jusqu’à la fin du premier jour ouvrable suivant',
    delai: '—', depart: '—', article: 'CCAG 2021 art. 3.2.4', consequence: '—',
  },
  // OS
  {
    theme: 'Ordres de service', regle: 'Observations / réserves du titulaire sur un ordre de service (au MOE et au MOA)',
    delai: '15 jours', depart: 'Réception de l’OS', article: 'CCAG 2021 art. 3.8.2', consequence: 'Forclusion : l’OS est réputé accepté sans réserve',
  },
  {
    theme: 'Ordres de service', regle: 'OS jugé contraire à la sécurité/santé ou à la réglementation : observations motivées, exécution suspendue jusqu’à la réponse du MOA',
    delai: '15 jours (réponse du MOA)', depart: 'Réception des observations', article: 'CCAG 2021 art. 3.8.2',
    consequence: 'Sans réponse du MOA, le titulaire n’est pas tenu d’exécuter l’OS',
  },
  {
    theme: 'Ordres de service', regle: 'OS ayant une incidence sur le délai, la durée ou le montant du marché : validation préalable du MOA jointe',
    delai: '—', depart: '—', article: 'CCAG 2021 art. 3.8.1', consequence: 'À défaut, le titulaire n’est pas tenu de l’exécuter',
  },
  // Paiement
  {
    theme: 'Paiement', regle: 'Notification de l’état d’acompte mensuel par le MOE',
    delai: '7 jours', depart: 'Réception de la demande de paiement (projet de décompte mensuel)', article: 'CCAG 2021 art. 12.2.2',
    consequence: 'Le titulaire en informe le MOA, qui paie sur la base des sommes admises',
  },
  {
    theme: 'Paiement', regle: 'Délai global de paiement : État, collectivités territoriales et leurs établissements publics',
    delai: '30 jours', depart: 'Réception de la demande de paiement', article: 'CCP art. R2192-10',
    consequence: 'Intérêts moratoires de plein droit + indemnité forfaitaire de 40 €',
  },
  {
    theme: 'Paiement', regle: 'Délai global de paiement : établissements publics de santé (et du service de santé des armées)',
    delai: '50 jours', depart: 'Réception de la demande de paiement', article: 'CCP art. R2192-11',
    consequence: 'Intérêts moratoires de plein droit + indemnité forfaitaire de 40 €',
  },
  {
    theme: 'Paiement', regle: 'Délai global de paiement : entreprises publiques (pouvoirs adjudicateurs concernés)',
    delai: '60 jours', depart: 'Réception de la demande de paiement', article: 'CCP art. R2192-11', consequence: 'Intérêts moratoires', aVerifier: true,
  },
  {
    theme: 'Paiement', regle: 'Taux des intérêts moratoires : taux BCE (opérations principales de refinancement) en vigueur au 1er jour du semestre civil + 8 points',
    delai: 'Du lendemain de l’échéance au jour de mise en paiement inclus', depart: 'Expiration du délai de paiement',
    article: 'CCP art. R2192-31 et R2192-32', consequence: '—',
  },
  {
    theme: 'Paiement', regle: 'Indemnité forfaitaire pour frais de recouvrement (indemnisation complémentaire possible sur justificatifs)',
    delai: '40 €', depart: 'Dès le retard de paiement', article: 'CCP art. L2192-13 et D2192-35', consequence: '—',
  },
  {
    theme: 'Paiement', regle: 'Paiement des intérêts moratoires et de l’indemnité forfaitaire',
    delai: '45 jours', depart: 'Mise en paiement du principal', article: 'CCP art. R2192-36', consequence: '—',
  },
  // Avance & garanties financières
  {
    theme: 'Avance & garanties financières', regle: 'Avance obligatoire si montant initial > 50 000 € HT et durée d’exécution > 2 mois ; taux minimal 5 % (PME : 30 % pour l’État, 10 % pour certaines collectivités)',
    delai: '—', depart: 'Notification du marché / début d’exécution', article: 'CCP art. R2191-3 et R2191-7',
    consequence: 'Taux et seuils PME à vérifier dans le CCAP et le CCP en vigueur', aVerifier: true,
  },
  {
    theme: 'Avance & garanties financières', regle: 'Retenue de garantie : 5 % maximum du montant initial (+ modifications) ; 3 % pour une PME avec l’État et certains grands acheteurs (consultations depuis le 1er janvier 2025)',
    delai: '—', depart: 'Prélevée sur chaque acompte', article: 'CCP art. R2191-32 et R2191-33 (décret n° 2024-1251)',
    consequence: 'Peut être remplacée par une garantie à première demande ou, si le MOA l’accepte, une caution personnelle et solidaire', aVerifier: true,
  },
  {
    theme: 'Avance & garanties financières', regle: 'Remboursement de la retenue de garantie (ou libération de la garantie à première demande)',
    delai: '30 jours (1 mois pour la garantie bancaire)', depart: 'Expiration du délai de garantie (ou levée des réserves notifiées pendant ce délai)',
    article: 'CCP art. R2191-35', consequence: 'Intérêts moratoires en cas de retard',
  },
  // Pénalités
  {
    theme: 'Pénalités', regle: 'Pénalité journalière de retard : 1/3 000 du montant HT du marché (ou de la tranche / du bon de commande)',
    delai: 'Par jour calendaire de retard', depart: 'Lendemain de l’expiration du délai contractuel', article: 'CCAG 2021 art. 19.2.3',
    consequence: 'Sauf stipulation contraire du CCAP',
  },
  {
    theme: 'Pénalités', regle: 'Plafond des pénalités de retard', delai: '10 % du montant HT', depart: '—', article: 'CCAG 2021 art. 19.2.2',
    consequence: 'Sauf stipulation contraire du CCAP',
  },
  {
    theme: 'Pénalités', regle: 'Exonération si le montant total des pénalités ne dépasse pas 1 000 € pour l’ensemble du marché',
    delai: '—', depart: '—', article: 'CCAG 2021 art. 19.2.1', consequence: '—',
  },
  {
    theme: 'Pénalités', regle: 'Procédure contradictoire : le MOA invite le titulaire à présenter ses observations avant d’appliquer les pénalités',
    delai: '15 jours minimum', depart: 'Invitation écrite du MOA', article: 'CCAG 2021 art. 19.2.4', consequence: 'Sans réponse, les pénalités sont appliquées',
  },
  // Modification
  {
    theme: 'Modification du marché', regle: 'Travaux liés à un changement des besoins : exécution obligatoire jusqu’au dixième du montant contractuel ; refus possible au-delà',
    delai: '15 jours (refus écrit motivé)', depart: 'Réception de l’OS', article: 'CCAG 2021 art. 14.2.2', consequence: 'À défaut de refus, l’OS doit être exécuté',
  },
  {
    theme: 'Modification du marché', regle: 'Préavis au MOA et au MOE de la date probable à laquelle le montant contractuel sera atteint',
    delai: '30 jours avant', depart: 'Date probable d’atteinte du montant', article: 'CCAG 2021 art. 14.4',
    consequence: 'Arrêt des travaux à défaut de décision ; travaux exécutés au-delà non payés',
  },
  {
    theme: 'Modification du marché', regle: 'Estimation par le MOE du montant des travaux modifiés (part relevant du dixième)',
    delai: '15 jours', depart: 'OS modifiant le montant', article: 'CCAG 2021 art. 14.5', consequence: '—',
  },
  {
    theme: 'Modification du marché', regle: 'Augmentation du montant des travaux au-delà d’un seuil (5 % prix forfaitaires / 25 % prix unitaires) : droit à indemnisation du préjudice',
    delai: '—', depart: '—', article: 'CCAG 2021 art. 14.3', consequence: 'Seuils à vérifier dans le texte et le CCAP', aVerifier: true,
  },
  // Ajournement
  {
    theme: 'Ajournement & interruption', regle: 'Ajournements cumulés > 1 an : le titulaire peut demander la résiliation',
    delai: '15 jours', depart: 'Notification de l’ajournement portant le cumul au-delà d’un an', article: 'CCAG 2021 art. 53.1.2',
    consequence: 'Perte du droit à résiliation passé le délai ; indemnisation des frais de garde (53.1.1)',
  },
  {
    theme: 'Ajournement & interruption', regle: 'Deux acomptes successifs impayés : notification de l’intention d’interrompre les travaux',
    delai: '30 jours + 30 jours', depart: 'Remise du projet de décompte du 2e acompte', article: 'CCAG 2021 art. 53.2',
    consequence: 'Interruption possible si aucun ordre de reprise n’est notifié ; délais prolongés',
  },
  // Réception
  {
    theme: 'Réception', regle: 'Opérations préalables à la réception (OPR) organisées par le MOE', delai: '20 jours',
    depart: 'Avis d’achèvement du titulaire (ou date d’achèvement indiquée si postérieure)', article: 'CCAG 2021 art. 41.1',
    consequence: 'Carence du MOE : le MOA fixe la date sous 30 j, à défaut réception réputée acquise (41.1.2, 41.1.3)',
  },
  {
    theme: 'Réception', regle: 'Proposition du MOE au MOA (avec PV des OPR) et information du titulaire', delai: '5 jours',
    depart: 'Date du PV des OPR', article: 'CCAG 2021 art. 41.2', consequence: 'Le titulaire peut transmettre lui-même le PV au MOA',
  },
  {
    theme: 'Réception', regle: 'Décision du MOA (réception avec ou sans réserves, ou refus)', delai: '30 jours', depart: 'Date du PV des OPR',
    article: 'CCAG 2021 art. 41.3', consequence: 'À défaut, les propositions du MOE s’imposent',
  },
  {
    theme: 'Réception', regle: 'Prestations restant à exécuter fixées dans la décision de réception', delai: '3 mois maximum',
    depart: 'Décision de réception', article: 'CCAG 2021 art. 41.5', consequence: '—',
  },
  {
    theme: 'Réception', regle: 'Levée des réserves', delai: 'Délai fixé par le MOA ; à défaut, 3 mois avant la fin du délai de garantie',
    depart: 'Décision de réception', article: 'CCAG 2021 art. 41.6', consequence: 'Exécution aux frais et risques du titulaire après mise en demeure',
  },
  // Garanties
  {
    theme: 'Garanties', regle: 'Délai de garantie contractuel (obligation de parfait achèvement)', delai: '1 an', depart: 'Date d’effet de la réception',
    article: 'CCAG 2021 art. 44.1 ; C. civ. art. 1792-6', consequence: 'Prolongation possible par le MOA si travaux non achevés (44.2)',
  },
  {
    theme: 'Garanties', regle: 'Garantie biennale de bon fonctionnement (éléments d’équipement dissociables)', delai: '2 ans minimum',
    depart: 'Réception', article: 'C. civ. art. 1792-3', consequence: '—',
  },
  {
    theme: 'Garanties', regle: 'Responsabilité décennale des constructeurs', delai: '10 ans', depart: 'Réception',
    article: 'C. civ. art. 1792 et 1792-4-1', consequence: '—',
  },
  // Décompte
  {
    theme: 'Décompte', regle: 'Projet de décompte final (demande de paiement finale) notifié au MOE et au MOA', delai: '30 jours',
    depart: 'Notification de la décision de réception', article: 'CCAG 2021 art. 12.3.2',
    consequence: 'Mise en demeure (15 j) puis décompte final établi d’office aux frais du titulaire (12.3.4)',
  },
  {
    theme: 'Décompte', regle: 'Notification du décompte général signé par le MOA', delai: '30 jours',
    depart: 'Réception de la demande de paiement finale par le MOE (ou le MOA si plus tardive)', article: 'CCAG 2021 art. 12.4.2',
    consequence: 'Le titulaire peut notifier son propre projet de DG (12.4.4)',
  },
  {
    theme: 'Décompte', regle: 'Renvoi du décompte général signé, avec ou sans réserves', delai: '30 jours', depart: 'Notification du DG',
    article: 'CCAG 2021 art. 12.4.3 et 12.4.5', consequence: 'DG réputé accepté : il devient le DGD',
  },
  {
    theme: 'Décompte', regle: 'Carence du MOA : notification du DG après réception du projet de DG du titulaire', delai: '10 jours',
    depart: 'Réception du projet de DG du titulaire', article: 'CCAG 2021 art. 12.4.4', consequence: 'Le projet du titulaire devient le DGD',
  },
  {
    theme: 'Décompte', regle: 'Paiement des sommes admises en cas de contestation du DG', delai: '30 jours', depart: 'Contestation du DG',
    article: 'CCAG 2021 art. 12.4.3', consequence: 'Intérêts moratoires', aVerifier: true,
  },
  // Différends
  {
    theme: 'Différends', regle: 'Mémoire en réclamation portant sur le décompte général', delai: '30 jours', depart: 'Notification du DG',
    article: 'CCAG 2021 art. 55.1.1', consequence: 'Forclusion ; reprendre les réclamations antérieures non réglées',
  },
  {
    theme: 'Différends', regle: 'Décision motivée du MOA sur le mémoire en réclamation (après avis du MOE)', delai: '30 jours',
    depart: 'Réception du mémoire', article: 'CCAG 2021 art. 55.1.2 et 55.1.3', consequence: 'Silence = rejet implicite',
  },
  {
    theme: 'Différends', regle: 'Saisine du tribunal administratif (réclamation sur le DG)', delai: '6 mois',
    depart: 'Notification de la décision ou rejet implicite', article: 'CCAG 2021 art. 55.3.2 et 55.3.3',
    consequence: 'Forclusion : la décision est réputée acceptée',
  },
  {
    theme: 'Différends', regle: 'Comité consultatif de règlement amiable (CCRA), conciliation, médiation : interruption du délai de recours contentieux',
    delai: '—', depart: 'Saisine', article: 'CCAG 2021 art. 55.2', consequence: '—',
  },
  // Assurances
  {
    theme: 'Assurances', regle: 'Attestations d’assurance (RC et décennale) à produire par le titulaire', delai: '15 jours',
    depart: 'Notification du marché (et avant tout début d’exécution) ; à tout moment sur demande du MOA', article: 'CCAG 2021 art. 8.1.3',
    consequence: 'Résiliation pour faute possible (art. 50.3.1)',
  },
]
