import { DelaisClesClient } from '@/components/modules/boite-a-outils/DelaisClesClient'
import { EncadreSources } from '@/components/modules/boite-a-outils/EncadreSources'

export const metadata = { title: 'Délais clés — Boîte à outils' }

export default function Page() {
  return (
    <>
      <DelaisClesClient />
      <EncadreSources outil="delais-cles" />
    </>
  )
}
