'use client'
import { useEffect } from 'react'
import { useProfilStore, type ProfilSociete } from '@/stores/profil'

export function ProfilHydrator({ profil }: { profil: ProfilSociete }) {
  const setProfil = useProfilStore((s) => s.setProfil)
  useEffect(() => setProfil(profil), [profil, setProfil])
  return null
}
