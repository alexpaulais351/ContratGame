import { Fragment } from 'react'

const LIBELLES_VARIABLES: Record<string, string> = {
  projet: 'Projet', moa: 'Maître d’ouvrage', moaAdresse: 'Adresse MOA', numeroAffaire: 'N° affaire',
  numeroCommande: 'N° commande', numeroOTP: 'N° OTP', adresseChantier: 'Adresse chantier',
  date: 'Date', societe: 'Société', signataire: 'Signataire',
}

export function libelleVariable(cle: string): string {
  return LIBELLES_VARIABLES[cle] ?? cle
}

/** Affiche un texte de modèle en mettant les {{variables}} en évidence (badges) et les « ……… » à compléter. */
export function TexteAvecVariables({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\{\{\w+\}\}|…{2,})/g)
  return (
    <>
      {morceaux.map((m, i) => {
        const v = /^\{\{(\w+)\}\}$/.exec(m)
        if (v)
          return (
            <span
              key={i}
              title={`Variable remplacée automatiquement : {{${v[1]}}}`}
              className="mx-0.5 inline-block rounded-sm border border-vinci-bleu-moyen bg-vinci-bleu-moyen-clair px-1 py-px align-baseline font-sans text-[11px] font-bold leading-tight text-vinci-bleu"
            >
              {libelleVariable(v[1])}
            </span>
          )
        if (/^…{2,}$/.test(m))
          return (
            <span key={i} title="À compléter" className="rounded-sm bg-vinci-jaune-clair px-0.5 text-vinci-orange">
              {m}
            </span>
          )
        return <Fragment key={i}>{m}</Fragment>
      })}
    </>
  )
}

export function variablesDuModele(...textes: string[]): string[] {
  const set = new Set<string>()
  for (const t of textes) for (const m of t.matchAll(/\{\{(\w+)\}\}/g)) set.add(m[1])
  return [...set]
}
