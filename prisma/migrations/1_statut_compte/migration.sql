-- Statut des comptes (demande de création validée par un administrateur)
ALTER TABLE "User" ADD COLUMN "statut" TEXT NOT NULL DEFAULT 'approuve';
