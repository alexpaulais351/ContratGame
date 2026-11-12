# CLAUDE.md — CONTRAT GAME (version Gestion Contractuelle & Financière)
# Fichier lu automatiquement par Claude Code à chaque session.
# NE PAS MODIFIER sans mettre à jour tous les agents.

---

## PRÉSENTATION DU PROJET

**Contrat Game** est une application web de gestion contractuelle et financière
de chantier (tous types de travaux — aucune référence à un métier particulier).
Utilisateurs : conducteurs de travaux, travail sur tablette/PC portable.
Équipe : 2 à 5 utilisateurs simultanés, chaque utilisateur voit uniquement ses projets.

### PÉRIMÈTRE — IMPORTANT

Cette version NE CONTIENT PAS la gestion de chantier. Ne jamais créer :
```
✗ Onglet « Gestion de Chantier » (aucun de ses modules)
✗ Tableau de Service
✗ Rapports journaliers (et donc AUCUN lien rapports → situations :
  les avancements des situations sont saisis directement dans la situation)
✗ Suivi de soudures (SA)
✗ Composition TTx
✗ Suivi ARF
✗ Planning minuté / OCP / Récapitulatif travaux
✗ Module Personnel (pas de page personnel, pas de modèle Personnel)
✗ Module Matériel / engins TTx (pas de MaterielTTx, pas de SVG d'engins)
✗ Profil « chef de chantier » (un seul type de profil : conducteur de travaux)
```

---

## STACK TECHNIQUE — OBLIGATOIRE

```
Framework        : Next.js 14+ App Router, TypeScript strict (strict: true)
Styles           : Tailwind CSS + shadcn/ui
Base de données  : PostgreSQL via Prisma ORM → Supabase (cloud)
Auth             : NextAuth.js v5 (credentials email/password, JWT)
PDF web          : @react-pdf/renderer
PDF capture      : html2canvas + jsPDF (frise chronologique uniquement)
Excel            : exceljs (exports .xlsx)
State local      : Zustand
Server state     : TanStack React Query v5
Mutations        : Next.js Server Actions UNIQUEMENT (jamais d'API Routes custom)
Virtualisation   : @tanstack/react-virtual (tables > 100 lignes, ex. Détail Estimatif)
Drag & drop      : @dnd-kit/sortable (réordonner lignes DE et Prix Nouveaux)
```

**Interdits absolus** : next-pwa · WebSocket · Redis · tRPC · API Routes custom · localStorage

---

## CHARTE GRAPHIQUE — VINCI CONSTRUCTION (v1.1 Février 2023)

### Couleurs — importer depuis `src/lib/design-tokens.ts`

```
BLEU VINCI        #004489    → couleur primaire, nav, en-têtes tables, boutons CTA
BLEU FONCÉ        #003370    → hover nav, pieds de tableaux, onglet actif fond
BLEU CLAIR        #0056B3    → états intermédiaires
BLEU TRÈS CLAIR   #E5EFF8    → fonds sélection, onglet actif fond N1
ROUGE VINCI       #E20025    → accent, boutons danger, indicateur onglet actif N2
ROUGE FONCÉ       #B8001E    → hover rouge
ROUGE TRÈS CLAIR  #FDEAED    → fonds alerte, lignes HS
GRIS VINCI        #B5ABA1    → éléments neutres, bordures fortes
GRIS CLAIR        #F0F0F0    → fonds alternés tables, surfaces neutres
GRIS BORDURE      #DCDCDC    → bordures standard
NOIR              #000000    → texte principal
TEXTE SECONDAIRE  #5A5A5A    → texte muted
BLANC             #FFFFFF    → fond carte, texte sur fond coloré
```

### Palette secondaire VINCI (modules, frise, badges sémantiques)

```
Vert              #7AA536  fond clair #E8EFDA   → succès, validé, contrat
Vert vif          #A9D461  fond clair #C9E39E   → étude diffusion
Bleu moyen        #307BFF  fond clair #E5F1F9   → groupement, info
Bleu ciel         #80B4FF  fond clair #B2D4FC   → suivi/impact
Jaune doré        #F2AB1B  fond clair #FFF7D1   → avertissement, SOS terrain
Orange brun       #C26A32  fond clair #F9E9D9   → alerte
Rose              #F25799  fond clair #FFE8E8   → VISA étude
Violet            #A152E5  fond clair #FCE8FF   → EBGC
Gris chaud        #B5ABA1  fond clair #F0F0F0   → autre, neutre
```

### Typographie

```
Police principale : VINCI Sans (fichiers dans public/fonts/)
Fallback          : Arial, Helvetica, sans-serif
Condensed         : VINCI Sans Condensed (tableaux denses)
Serif             : VINCI Serif (usage éditorial uniquement)
Taille body       : 14px
Taille tables     : 12-13px
```

### Règles design inviolables

```
1. JAMAIS de couleur hors palette VINCI ci-dessus
2. JAMAIS d'ancien bleu indigo #1A237E
3. JAMAIS d'ambre #F9A825 (remplacé par jaune VINCI #F2AB1B)
4. Toujours importer depuis src/lib/design-tokens.ts
5. Tables : en-tête fond #004489 texte blanc gras
6. Tables : lignes alternées blanc / #F0F0F0
7. Tables : ligne sélectionnée fond #E5EFF8 texte #003370
8. Bouton primaire : fond #004489 texte blanc
9. Bouton danger/supprimer : fond #E20025 texte blanc
10. Bouton secondaire : fond blanc bordure #004489 texte #004489
11. Bouton toolbar : fond #F0F0F0 bordure #DCDCDC texte #000000
12. Focus inputs : bordure #004489
13. Sidebar : fond #004489, indicateur actif = trait gauche rouge #E20025
14. Onglet N1 actif : fond #E5EFF8 bordure basse #004489 2px
15. Sous-menu N2 actif : bordure basse rouge #E20025 2px
16. PDF en-tête : bande #004489 texte blanc, pied #003370
```

---

## ARCHITECTURE DES FICHIERS

```
conduc-rail/
├── CLAUDE.md                         ← CE FICHIER
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── middleware.ts                 ← garde auth (getToken)
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   └── (app)/
│   │       ├── layout.tsx            ← shell auth + sidebar
│   │       ├── projets/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       ├── layout.tsx    ← nav 2 onglets + topbar
│   │       │       ├── infos/page.tsx
│   │       │       ├── courriers/
│   │       │       │   ├── page.tsx
│   │       │       │   ├── nouveau/page.tsx
│   │       │       │   └── [courrierId]/page.tsx
│   │       │       ├── sous-traitants/page.tsx          ← fiches ST (contractuel)
│   │       │       ├── detail-estimatif/
│   │       │       │   ├── page.tsx
│   │       │       │   └── cotraitance/page.tsx         ← répartition groupement
│   │       │       ├── matrice/
│   │       │       │   ├── page.tsx
│   │       │       │   └── [matriceId]/page.tsx
│   │       │       └── suivi/
│   │       │           ├── journal/
│   │       │           │   ├── page.tsx                 ← événements + frise
│   │       │           │   └── fiche-ecart/page.tsx
│   │       │           ├── situations/
│   │       │           │   ├── page.tsx
│   │       │           │   └── [situationId]/page.tsx
│   │       │           ├── prix-nouveaux/page.tsx
│   │       │           └── sous-traitants/page.tsx      ← suivi ST (financier)
│   │       └── profil/page.tsx
│   ├── components/
│   │   ├── ui/                       ← shadcn/ui UNIQUEMENT (via CLI)
│   │   ├── layout/                   ← Sidebar, Topbar, ProjetNav, Shell
│   │   └── modules/                  ← composants par module (sous-dossiers) :
│   │       infos-projet/ courriers/ sous-traitants/ detail-estimatif/
│   │       situations/ prix-nouveaux/ journal/ matrice/
│   ├── lib/
│   │   ├── prisma.ts                 ← singleton Prisma
│   │   ├── auth.ts + auth-helpers.ts ← config NextAuth v5
│   │   ├── design-tokens.ts          ← CHARTE VINCI — source de vérité
│   │   ├── modules-projet.ts         ← ONGLETS_PROJET (config navigation partagée)
│   │   ├── courriers-templates.ts    ← modèles de courriers types
│   │   ├── matrice-bidcomp.ts        ← gabarit Bid Comp (matrice fournisseurs)
│   │   ├── mois.ts                   ← libellés mois FR
│   │   ├── utils.ts                  ← fonctions utilitaires FR
│   │   └── pdf/                      ← générateurs PDF par module
│   │       pdf-entete.tsx (EntetePDF + PiedPagePDF communs) · detail-estimatif.tsx ·
│   │       situation.tsx · prix-nouveaux.tsx · sous-traitants.tsx · courrier.tsx ·
│   │       fiche-ecart.tsx · matrice-bidcomp.tsx · format.ts
│   ├── components/modules/journal/placements.ts ← algorithme pur de placement frise
│   ├── hooks/                        ← useExportPDF, custom React Query hooks
│   ├── stores/                       ← Zustand (ex. profil : logo/nom société)
│   ├── actions/                      ← Server Actions (1 fichier par module)
│   └── types/                        ← types TypeScript partagés (ActionResult<T>)
```

---

## NAVIGATION DU PROJET (2 onglets)

```
GESTION CONTRACTUELLE    → Infos · Courriers · Sous-traitants · Journal
GESTION FINANCIÈRE       → Détail Estimatif · Situations · Prix Nouveaux · Suivi ST · Matrice
```

Sidebar principale : Projets · [Nom utilisateur → /profil]

Les modules visibles par projet sont configurables (checkboxes dans l'onglet Infos,
champ `Projet.modulesMasques`, config partagée dans `src/lib/modules-projet.ts`).
Tout nouveau module doit être déclaré dans `ONGLETS_PROJET` de ce fichier.
Le module « Infos » n'est pas masquable (`toggleable: false`).

Un seul type de profil utilisateur (conducteur de travaux, accès à tout).

---

## PATTERNS OBLIGATOIRES

### Server Action (copier pour chaque nouvelle action)

```typescript
'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function monAction(projetId: string, data: unknown) {
  // 1. Auth
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non authentifié')
  // 2. Membership (pour toute action liée à un projet)
  const member = await prisma.projetMember.findUnique({
    where: { userId_projetId: { userId: session.user.id, projetId } }
  })
  if (!member) throw new Error('Accès refusé')
  // 3. Validation Zod
  const schema = z.object({ /* champs */ })
  const parsed = schema.parse(data)
  // 4. Mutation Prisma
  const result = await prisma.MODEL.create({ data: { projetId, ...parsed } })
  // 5. Revalidation
  revalidatePath(`/projets/${projetId}/MODULE`)
  return { success: true, data: result }
}
```

### Auto-save debounced (tables éditables)

```typescript
const saveRef = useRef<NodeJS.Timeout>()
const scheduleSave = useCallback((data: unknown) => {
  clearTimeout(saveRef.current)
  saveRef.current = setTimeout(() => saveAction(data), 500)
}, [])
```

### Réordonner par glisser-déposer (lignes DE, Prix Nouveaux)

@dnd-kit : `DndContext` + `SortableContext` (verticalListSortingStrategy),
poignée `GripVertical`, `arrayMove` optimiste puis Server Action
`reorderXxx(projetId, orderedIds)` qui réécrit `ordre` dans une transaction.

### Export PDF anti-double-téléchargement

```typescript
// Toujours utiliser ce hook — jamais appeler exportPDF() directement
import { useExportPDF } from '@/hooks/useExportPDF'
const { exportAvecGuard, isExporting } = useExportPDF()
// Usage : exportAvecGuard(() => genererPDF(data))
```

### Formatage français (toujours utiliser lib/utils.ts)

```typescript
formatNombreFR(1234.5)        // → "1 234,50"
formatMontant(1234.5)         // → "1 234,50 €"
formatDateFR(new Date())      // → "01/04/2026"
hexToRgb("#004489")           // → { r: 0, g: 68, b: 137 }
```

---

## RÈGLES SPÉCIFIQUES PAR MODULE

### Profil utilisateur (`/profil`)

- Champs : nom, email, mot de passe + société (`logoSociete` base64, `nomSociete`,
  `adresseSociete`, `telSociete`, `faxSociete`, `certifications`)
- Le logo et le nom de société alimentent l'en-tête de TOUS les PDF
  (store Zustand `profil` côté client)

### Infos projet

- Champs : nom, description, MOA (nom/prénom/adresse), n° affaire, n° commande,
  n° OTP, adresse chantier, dates début/fin
- Checkboxes de visibilité des modules (écrit `modulesMasques`)
- Gestion des membres du projet (ProjetMember, rôles owner/member)

### Détail Estimatif

- Tableau éditable type Excel : chapitres (`estChapitre`) + lignes
  (code, désignation, unité, quantité, PU) — montant = quantité × PU
- Auto-save 500 ms sur chaque cellule, **Ctrl+S force la sauvegarde immédiate**
- Réordonnancement des lignes par glisser-déposer
- Virtualisation obligatoire (peut dépasser 100 lignes)
- Sous-page **Co-traitance** : déclarer les co-traitants du groupement
  (mandataire + ordre) et répartir le PU de chaque ligne entre co-traitants
  (`LigneDE.repartition` Json `{ [coTraitantId]: number }`) ; totaux par co-traitant
- Le Dialog d'export PDF NE DOIT PAS être imbriqué dans le Sheet
  (bug boutons non cliquables) → placer le Dialog au même niveau que le Sheet

### Situations de travaux

- Une situation = n° séquentiel unique par projet + mois/année + libellé
  + statut `brouillon | validee`
- Lignes : pour chaque ligne du DE, **saisie MANUELLE de la quantité réalisée
  cumulée** (AUCUN lien avec un quelconque rapport de chantier) ;
  `prixUnitaire` snapshot au moment de la saisie
- Affichage : cumul précédent / mois / cumul total, % d'avancement par ligne
  et global, montants formatés FR
- PDF de situation : tableau des lignes + **section sous-traitants**
  (récap des facturations ST du mois et cumulées)
- Supprimer une situation doit mettre à jour le récap des sous-traitants
  (purger les facturations ST liées au mois concerné le cas échéant)

### Prix Nouveaux

- Champs : n° devis, intitulé, date devis, montant présenté, potentiel
  d'acceptation (0-100 %), montant accepté, déboursé réel, n° OS, date OS,
  délai supplémentaire, statut (`a_venir | en_cours | accepte | refuse`)
- Totaux : présenté, pondéré (présenté × potentiel), accepté, déboursé
- Réordonnancement par glisser-déposer (champ `ordre`)
- Badges statut et potentiel aux couleurs sémantiques VINCI

### Suivi ST (financier)

- Par sous-traitant : montant marché + avenants = montant total ;
  facturations mensuelles (`annee`, `mois`, montant, unique par ST/mois)
- Cumul facturé, reste à facturer, % d'avancement
- Fiches sous-traitants (onglet contractuel) : contact, téléphone, email,
  paiement direct, commentaire + avenants

### Courriers

- Modèles types dans `src/lib/courriers-templates.ts` (réserves, mise en demeure,
  demande de prolongation, transmission de documents, etc.) avec corps pré-rempli
- Champs : référence, objet, type, destinataire, expéditeur, lieu, mode d'envoi,
  copies, signataire (nom/fonction), corps (texte), statut `brouillon | envoye`,
  date d'envoi
- Export PDF au format courrier officiel avec en-tête société de l'utilisateur
- Un courrier peut générer un événement dans le Journal (lien `courrierId`)

### Journal du chantier

- Événements : date, titre, description, catégorie (modèle `CategorieEvenement`
  par projet : nom + 4 couleurs, catégories système + personnalisées,
  couleurs = palette secondaire VINCI), pièces jointes (base64, images et PDF),
  case « afficher sur la frise »
- Filtres par catégorie (chips cliquables)

#### Frise chronologique

- Rendu : HTML/CSS avec positions absolues calculées en JS
- Anti-chevauchement : algorithme PUR dans `placements.ts`
  (testable sans rendu) : chaque bulle reste À L'APLOMB de sa date
  (trait de rappel strictement vertical), essaie haut puis bas contre la ligne,
  sinon s'empile au plus près de la ligne. Jamais de décalage horizontal.
- Axe : largeur fixe par mois (`LARGEUR_MOIS = 260px`), labels de mois,
  points colorés sur la ligne, bulles ~185px de large
- Export : `html2canvas` + `jsPDF` (PAS @react-pdf/renderer), A4 paysage,
  en-tête/pied VINCI vectoriels + légende des catégories vectorielle :
  1. Dialog avant export : dates début/fin (pré-remplies min/max), compteur
     d'événements dans la période, la frise est re-rendue filtrée (flushSync)
  2. Étalement : chercher par itération (calcul pur sur `placements.ts`)
     la largeur/mois qui fait remplir TOUTE la largeur de la page
  3. Échelle de capture plafonnée à ~16,7 Mpx de surface canvas
     (limite Safari/iPad, sinon canvas blanc/tronqué)
  4. Recadrage au contenu réel (première → dernière bulle + marge)
  5. Multi-pages : découpe ENTRE les bulles (jamais au travers), échelle
     identique sur toutes les pages ; compression ≤ 15 % pour éviter une
     page quasi vide
  6. Image JPEG qualité 0,82 + `addImage(..., 'FAST')` (jamais PNG : trop lourd)
  7. Pièces jointes images des événements de la période en pages portrait à la fin
  8. Période dans l'en-tête et le nom de fichier

#### Fiche écart (sous-page du Journal)

- Tableau par chapitres (lignes `estChapitre`) avec colonnes :
  **Étude / Écart** · Prévu au DCE · Phase transitoire · EXE ·
  Impacts et conséquences · Délais impactés · Coûts impactés
- Cellules textarea auto-redimensionnées, auto-save 500 ms
- Bouton « Importer depuis Journal » : sélection d'événements → une ligne par
  événement avec `etude = "titre (date)"` et `evenementId` (anti-doublon :
  les événements déjà importés sont exclus de la liste)
- Export PDF paysage même structure

### Matrice décisionnelle d'offres fournisseurs (Bid Comp)

- Calquée sur l'Excel « Matrice Décisionnelle d'Offres Fournisseurs » :
  grille `bidComp` Json (gabarit dans `src/lib/matrice-bidcomp.ts`) : sections
  Offre fournisseur / Conditions financières / Évaluation délais / juridique /
  Qualité-prévention / technique / CSRD / Détail des coûts / Options ;
  une colonne par fournisseur candidat
- Fournisseurs : nom, rang, réf offre, date, pays, incoterm, décision
  `go | no_go | en_attente` (couleur vert/jaune/rouge)
- Critères notés 1-3 avec coefficients + non-conformités majeures (fond rouge)
  / négociables (fond jaune) ; score total pondéré, score normalisé %, classement
- En-tête : acheteur, site, famille d'achats, budget théorique, typologie d'achat
- Blocs de synthèse : opportunités, risques, recommandation
- Exports : Excel (exceljs, 2 onglets « Bid Comp » + « Sélection RMS »,
  mise en forme VINCI) et PDF

---

## FONCTIONS UTILITAIRES OBLIGATOIRES (`src/lib/utils.ts`)

```typescript
export function formatNombreFR(n: number, decimales = 2): string
export function formatMontant(n: number): string
export function formatDateFR(date: Date): string
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null
```

---

## SCHÉMA PRISMA — MODÈLES

```prisma
User                 // email unique, name, password (hash), role ("user"|"admin"),
                     // logoSociete, nomSociete, adresseSociete, telSociete,
                     // faxSociete, certifications
Projet               // name, description, moaNom/Prenom/Adresse, numeroAffaire,
                     // numeroCommande, numeroOTP, adresseChantier, dateDebut,
                     // dateFin, modulesMasques Json "[]"
ProjetMember         // userId + projetId uniques, role "owner"|"member"

LigneDE              // code, designation, unite, quantite, prixUnitaire,
                     // estChapitre, repartition Json? (PU par co-traitant), ordre
CoTraitant           // nom, estMandataire, ordre

Situation            // numero unique/projet, libelle, annee, mois,
                     // statut "brouillon"|"validee", commentaire
LigneSituation       // situationId + ligneDEId uniques, quantite (cumul saisi),
                     // prixUnitaire (snapshot)

PrixNouveau          // numero, intitule, dateDevis, montantPresente,
                     // montantAccepte?, debourseReel?, numeroOS, dateOS,
                     // delaiSupplementaire, potentielAcceptation 0-100,
                     // statut, commentaire, ordre

SousTraitant         // nom, contact, telephone, email, paiementDirect,
                     // montantMarche, montantAS, commentaire, ordre
AvenantSousTraitant  // numero, libelle, montant, date
FacturationSousTraitant // annee + mois uniques par ST, montant, commentaire

CourrierChantier     // reference, objet, type, dateEnvoi, destinataire,
                     // expediteur, corps, statut, lieu, modeEnvoi, copies,
                     // signataireNom/Fonction
CategorieEvenement   // nom unique/projet, couleurBg/Border/Text/Point, estSysteme
EvenementChantier    // date, titre, description, categorie, categorieId?,
                     // afficherFrise, source?, courrierId?
FichierEvenement     // nom, type MIME, contenu base64, taille
LigneFicheEcart      // evenementId?, etude, prevuDCE, phaseTransitoire, exe,
                     // impacts, delaisImpactes, coutImpactes, ordre, chapitre,
                     // estChapitre

MatriceDecisionnelle // titre, acheteur, site, familleAchats, budgetTheorique,
                     // devise, seuilGo, statut, bidComp Json
FournisseurCandidat  // nom, rang, refOffre, dateOffre, paysFabrication,
                     // incoterm, montantOffre, decision, couleurDecision
Critere              // famille, libelle, coefficient, type "note_1_3"|..., ordre
NotationCritere      // critereId + fournisseurId uniques, valeurTexte, note,
                     // valeurBool, commentaire, estNonConformiteMajeure,
                     // estNonConformiteNegociable
```

PAS de modèles : Personnel, TableauService, RapportJournalier, LigneAvancement,
SoudureAluminothermique, MaterielTTx, CompositionTTx, LigneARFManuelle, OCP,
ChantierElementaire, CreneauActivite, PlanningPersonnelLink, PlanningTractionLink.

---

## PDF — RÈGLES COMMUNES

Tous les PDFs (@react-pdf/renderer, composants communs `pdf-entete.tsx`) :
```
En-tête : bande #004489 · logo du profil utilisateur à gauche (à défaut nom de société) · nom du projet à droite (pas de « CONTRAT GAME »)
En-tête tableau : fond #004489 texte blanc gras
Lignes alternées : blanc / #F0F0F0
Pied de tableau : fond #003370 texte blanc
Pied de page : ligne fine #DCDCDC · "Page X / Y" · texte #B5ABA1
Police PDF : Helvetica (intégrée dans @react-pdf/renderer)
Formatage : fonctions françaises de lib/utils.ts
```

---

## COMPTES DE TEST (seed)

```
admin@contratgame.fr / demo1234  → owner du projet "Chantier LGV Sud"
user@contratgame.fr  / demo1234  → member du projet "Chantier LGV Sud"
```

Le seed crée le projet de démo avec : lignes de DE (chapitres + lignes),
une situation, 2 prix nouveaux, 1 sous-traitant avec facturations,
quelques événements de journal avec catégories, 1 courrier, 1 matrice.

---

## CE QU'IL NE FAUT JAMAIS FAIRE

```
✗ Créer des API Routes (/api/...) — utiliser les Server Actions
✗ Utiliser localStorage ou sessionStorage
✗ Hardcoder des couleurs hors palette VINCI
✗ Imbriquer un Dialog dans un Sheet (bug overlay z-index)
✗ Appeler exportPDF() sans le hook useExportPDF (double téléchargement)
✗ Utiliser toLocaleString() directement — utiliser formatNombreFR()
✗ Modifier les fichiers dans src/components/ui/ — shadcn/ui via CLI uniquement
✗ Utiliser fetch() côté client pour les mutations — Server Actions uniquement
✗ Oublier revalidatePath() après une mutation Prisma
✗ Oublier la vérification ProjetMember dans les Server Actions de projet
✗ Créer un module de gestion de chantier (voir PÉRIMÈTRE en tête de fichier)
✗ Lier les situations à des rapports : les avancements sont saisis à la main
✗ Exporter la frise en PNG (toujours JPEG compressé)
```
