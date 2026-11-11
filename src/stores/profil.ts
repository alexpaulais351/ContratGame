'use client'
import { create } from 'zustand'

export type ProfilSociete = {
  nom: string
  email: string
  logoSociete: string | null
  nomSociete: string | null
  adresseSociete: string | null
  telSociete: string | null
  faxSociete: string | null
  certifications: string | null
}

type ProfilState = {
  profil: ProfilSociete | null
  setProfil: (p: ProfilSociete) => void
}

/** Store du profil (logo + société) — alimente l'en-tête de TOUS les PDF. */
export const useProfilStore = create<ProfilState>((set) => ({
  profil: null,
  setProfil: (profil) => set({ profil }),
}))
