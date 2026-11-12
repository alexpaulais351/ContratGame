import { LexiqueClient } from '@/components/modules/boite-a-outils/LexiqueClient'
import { EncadreSources } from '@/components/modules/boite-a-outils/EncadreSources'

export const metadata = { title: 'Lexique — Boîte à outils' }

export default function Page() {
  return (
    <>
      <LexiqueClient />
      <EncadreSources outil="lexique" />
    </>
  )
}
