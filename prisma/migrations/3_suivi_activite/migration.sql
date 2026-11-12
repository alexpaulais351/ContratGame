-- Suivi de fréquentation (onglet Analyse, administrateurs) : pages vues agrégées par jour et connexions.
-- Une ligne Visite par compte, jour (Europe/Paris), chemin normalisé et projet ("" hors projet).
-- CreateTable
CREATE TABLE "Visite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jour" DATE NOT NULL,
    "chemin" TEXT NOT NULL,
    "projetId" TEXT NOT NULL DEFAULT '',
    "nombre" INTEGER NOT NULL DEFAULT 1,
    "premiere" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniere" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Connexion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connexion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visite_jour_idx" ON "Visite"("jour");

-- CreateIndex
CREATE UNIQUE INDEX "Visite_userId_jour_chemin_projetId_key" ON "Visite"("userId", "jour", "chemin", "projetId");

-- CreateIndex
CREATE INDEX "Connexion_date_idx" ON "Connexion"("date");

-- CreateIndex
CREATE INDEX "Connexion_userId_date_idx" ON "Connexion"("userId", "date");

-- AddForeignKey
ALTER TABLE "Visite" ADD CONSTRAINT "Visite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connexion" ADD CONSTRAINT "Connexion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Sécurité Supabase : tables accessibles uniquement par Prisma (rôle propriétaire), jamais via l'API PostgREST.
ALTER TABLE "Visite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Connexion" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "Visite" FROM anon, authenticated;
    REVOKE ALL ON "Connexion" FROM anon, authenticated;
  END IF;
END $$;
