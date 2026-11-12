import { Calculateurs } from '@/components/modules/boite-a-outils/Calculateurs'
import { EncadreSources } from '@/components/modules/boite-a-outils/EncadreSources'

export const metadata = { title: 'Calculateurs — Boîte à outils' }

export default function Page() {
  return (
    <>
      <Calculateurs />
      <EncadreSources outil="calculateurs" />
    </>
  )
}
