# Conduc Rail

Application web de gestion **contractuelle et financière** de chantiers ferroviaires
(charte VINCI Construction). Spécification complète : [`CLAUDE.md`](./CLAUDE.md).

## Modules

| Gestion contractuelle | Gestion financière |
|---|---|
| Infos projet (membres, modules visibles) | Détail Estimatif (+ co-traitance) |
| Courriers (modèles types, PDF) | Situations de travaux |
| Sous-traitants (fiches, avenants) | Prix Nouveaux |
| Journal (frise chronologique, fiche écart) | Suivi ST (facturations) |
| | Matrice décisionnelle Bid Comp (PDF + Excel) |

## Stack

Next.js 14 (App Router, TypeScript strict) · Tailwind + shadcn/ui · Prisma / PostgreSQL (Supabase) ·
NextAuth v5 (credentials, JWT) · Server Actions · @react-pdf/renderer · html2canvas + jsPDF (frise) ·
exceljs · Zustand · TanStack Query / Virtual · @dnd-kit.

## Installation

```bash
npm install
cp .env.example .env   # renseigner DATABASE_URL, DIRECT_URL (Supabase) et AUTH_SECRET
npx prisma db push     # crée le schéma
npx prisma db seed     # données de démo
npm run dev
```

Avec Supabase : `DATABASE_URL` = chaîne « Transaction pooler » (port 6543, ajouter `?pgbouncer=true`),
`DIRECT_URL` = connexion directe (port 5432). `AUTH_SECRET` : `openssl rand -base64 32`.

## Comptes de démo

| Email | Mot de passe | Rôle sur « Chantier LGV Sud » |
|---|---|---|
| admin@conducrail.fr | demo1234 | owner |
| user@conducrail.fr | demo1234 | member |

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run typecheck` · `npm run lint`
- `npm test` : tests unitaires (placement de la frise, scores de la matrice)
