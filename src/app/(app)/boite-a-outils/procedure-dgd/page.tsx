import { ProcedureDGDClient } from '@/components/modules/boite-a-outils/ProcedureDGDClient'
import { EncadreSources } from '@/components/modules/boite-a-outils/EncadreSources'

export const metadata = { title: 'Procédure DGD — Boîte à outils' }

export default function Page() {
  return (
    <>
      <ProcedureDGDClient />
      <EncadreSources outil="procedure-dgd" />
    </>
  )
}
