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
cp .env.example .env   # renseigner DATABASE_URL
npx prisma db push     # crée le schéma
npx prisma db seed     # données de démo
npm run dev
```

Avec Supabase : `DATABASE_URL` = bouton **Connect** → **ORMs** → **Prisma** → ligne `DATABASE_URL`
(port 6543, `?pgbouncer=true`), avec le mot de passe de la base.
`AUTH_SECRET` est facultatif : à défaut, la clé de session est dérivée de `DATABASE_URL`.

Déploiement Vercel : seule `DATABASE_URL` est requise. Le build (`vercel-build`) charge les
données de démo uniquement si la base est vide.

## Comptes de démo

| Email | Mot de passe | Rôle sur « Chantier LGV Sud » |
|---|---|---|
| admin@conducrail.fr | demo1234 | owner |
| user@conducrail.fr | demo1234 | member |

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run typecheck` · `npm run lint`
- `npm test` : tests unitaires (placement de la frise, scores de la matrice)
