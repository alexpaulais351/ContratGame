'use client'
import { forwardRef } from 'react'
import { VINCI } from '@/lib/design-tokens'
import { libelleMois } from '@/lib/mois'
import { BULLE, topBulle, type DispositionFrise } from './placements'
import { couleursDe, jourFR, nomCategorie, type CategorieDTO, type EvenementDTO } from './types'

type Props = {
  disposition: DispositionFrise
  evenements: EvenementDTO[]
  categories: CategorieDTO[]
  /** Recadrage : n'affiche que [debutX, finX] (export PDF). Défaut : toute la frise. */
  recadrage?: { debutX: number; finX: number }
  onSelect?: (ev: EvenementDTO) => void
}

const POLICE = '"VINCI Sans", Arial, Helvetica, sans-serif'

/**
 * Rendu HTML/CSS de la frise — positions absolues issues de placements.ts.
 * Styles en ligne (hex VINCI) pour une capture html2canvas fidèle.
 */
export const FriseRendu = forwardRef<HTMLDivElement, Props>(function FriseRendu(
  { disposition: d, evenements, categories, recadrage, onSelect },
  ref,
) {
  const parId = new Map(evenements.map((e) => [e.id, e]))
  const dx = recadrage ? -recadrage.debutX : 0
  const largeur = recadrage ? recadrage.finX - recadrage.debutX : d.largeurTotale
  const premierX = d.mois[0]?.x ?? 0
  const dernierX = d.mois.length ? d.mois[d.mois.length - 1].x + d.largeurMois : 0

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: largeur,
        height: d.hauteurTotale,
        overflow: 'hidden',
        background: VINCI.blanc,
        fontFamily: POLICE,
        color: VINCI.noir,
      }}
    >
      {/* Bandes de mois alternées + séparateurs */}
      {d.mois.map((m, i) => (
        <div
          key={`${m.annee}-${m.mois}`}
          style={{
            position: 'absolute',
            left: m.x + dx,
            top: 0,
            width: m.largeur,
            height: d.hauteurTotale,
            background: i % 2 === 1 ? VINCI.grisClair : VINCI.blanc,
            borderLeft: `1px solid ${VINCI.grisBordure}`,
            boxSizing: 'border-box',
          }}
        />
      ))}
      {/* Ligne du temps */}
      <div
        style={{
          position: 'absolute',
          left: premierX + dx,
          top: d.yLigne - 1.5,
          width: dernierX - premierX,
          height: 3,
          background: VINCI.bleu,
          borderRadius: 2,
        }}
      />
      {/* Labels de mois (sous la ligne) */}
      {d.mois.map((m) => (
        <div
          key={`l-${m.annee}-${m.mois}`}
          style={{
            position: 'absolute',
            left: m.x + dx + 6,
            top: d.yLigne + 5,
            height: 14,
            lineHeight: '14px',
            fontSize: 11,
            fontWeight: 700,
            color: VINCI.bleu,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {libelleMois(m.mois, m.annee)}
        </div>
      ))}
      {/* Traits de rappel (strictement verticaux) */}
      {d.placements.map((p) => {
        const ev = parId.get(p.id)
        if (!ev) return null
        const c = couleursDe(ev, categories)
        return (
          <div
            key={`t-${p.id}`}
            style={{
              position: 'absolute',
              left: p.x + dx - 0.5,
              top: p.cote === 'haut' ? d.yLigne - p.distance : d.yLigne,
              width: 1,
              height: p.distance,
              background: c.couleurBorder,
            }}
          />
        )
      })}
      {/* Points colorés sur la ligne */}
      {d.placements.map((p) => {
        const ev = parId.get(p.id)
        if (!ev) return null
        const c = couleursDe(ev, categories)
        return (
          <div
            key={`p-${p.id}`}
            style={{
              position: 'absolute',
              left: p.x + dx - 6,
              top: d.yLigne - 6,
              width: 12,
              height: 12,
              borderRadius: 6,
              background: c.couleurPoint,
              border: `2px solid ${VINCI.blanc}`,
              boxSizing: 'border-box',
              boxShadow: `0 0 0 1px ${c.couleurBorder}`,
            }}
          />
        )
      })}
      {/* Bulles */}
      {d.placements.map((p) => {
        const ev = parId.get(p.id)
        if (!ev) return null
        const c = couleursDe(ev, categories)
        const Balise = onSelect ? 'button' : 'div'
        return (
          <Balise
            key={`b-${p.id}`}
            type={onSelect ? 'button' : undefined}
            onClick={onSelect ? () => onSelect(ev) : undefined}
            title={onSelect ? `${jourFR(ev.jour)} — ${ev.titre}` : undefined}
            style={{
              position: 'absolute',
              left: p.gauche + dx,
              top: topBulle(p, d.yLigne),
              width: p.largeur,
              height: p.hauteur,
              boxSizing: 'border-box',
              padding: `${BULLE.paddingY}px 8px ${BULLE.paddingY}px 9px`,
              background: c.couleurBg,
              border: `${BULLE.bordure}px solid ${c.couleurBorder}`,
              borderLeftWidth: 4,
              borderRadius: 6,
              overflow: 'hidden',
              textAlign: 'left',
              cursor: onSelect ? 'pointer' : 'default',
              fontFamily: POLICE,
              color: c.couleurText,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexShrink: 0,
                justifyContent: 'space-between',
                gap: 6,
                height: BULLE.ligneEntete,
                lineHeight: `${BULLE.ligneEntete}px`,
                fontSize: 10.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <span style={{ fontWeight: 700 }}>{jourFR(ev.jour)}</span>
              <span style={{ overflow: 'hidden', color: VINCI.texteSecondaire }}>{nomCategorie(ev, categories)}</span>
            </div>
            {p.lignesTitre.map((l, i) => (
              <div
                key={`ti${i}`}
                style={{ flexShrink: 0, height: BULLE.ligneTitre, lineHeight: `${BULLE.ligneTitre}px`, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}
              >
                {l}
              </div>
            ))}
            {p.lignesDescription.length > 0 && <div style={{ flexShrink: 0, height: BULLE.ecartDescription }} />}
            {p.lignesDescription.map((l, i) => (
              <div
                key={`de${i}`}
                style={{
                  flexShrink: 0,
                  height: BULLE.ligneDescription,
                  lineHeight: `${BULLE.ligneDescription}px`,
                  fontSize: 11,
                  color: VINCI.texteSecondaire,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {l}
              </div>
            ))}
          </Balise>
        )
      })}
    </div>
  )
})
