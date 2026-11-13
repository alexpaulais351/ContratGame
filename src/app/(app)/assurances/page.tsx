import { AssurancesClient } from '@/components/modules/boite-a-outils/AssurancesClient'
import { EncadreSources } from '@/components/modules/boite-a-outils/EncadreSources'

export const metadata = { title: 'Assurances — Contrat Game' }

export default function Page() {
  return (
    <>
      <AssurancesClient />
      <EncadreSources outil="assurances" />
    </>
  )
}
