import { AssurancesClient } from '@/components/modules/boite-a-outils/AssurancesClient'
import { EncadreSources } from '@/components/modules/boite-a-outils/EncadreSources'

export const metadata = { title: 'Assurances — Boîte à outils' }

export default function Page() {
  return (
    <>
      <AssurancesClient />
      <EncadreSources outil="assurances" />
    </>
  )
}
