import { redirect } from 'next/navigation'

/** Ancienne adresse : l'outil Assurances est désormais un onglet à part entière. */
export default function Page() {
  redirect('/assurances')
}
