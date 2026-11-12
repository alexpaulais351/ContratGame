'use client'
import { forwardRef } from 'react'
import { VINCI } from '@/lib/design-tokens'
import { libelleMois } from '@/lib/mois'
import { BULLE, PERIODE, ajusterLibelle, segmentsPeriode, topBulle, type DispositionFrise } from './placements'
import { couleursPeriode, sousTitreAffiche, type PeriodeDTO } from './periodes'
import { couleursDe, jourFR, nomCategorie, type CategorieDTO, type EvenementDTO } from './types'

type Props = {
  disposition: DispositionFrise
  evenements: EvenementDTO[]
  categories: CategorieDTO[]
  /** Recadrage : n'affiche que [debutX, finX] (export PDF). Défaut : toute la frise. */
  recadrage?: { debutX: number; finX: number }
  onSelect?: (ev: EvenementDTO) => void
  /** périodes placées dans `disposition.periodes` (barres horizontales en haut de la frise) */
  periodes?: PeriodeDTO[]
  /**
   * Coupes de pages (export multi-pages, px de frise) : une période traversée par une coupe
   * est dessinée en segments, chacun avec son libellé recentré sur la partie visible de la page.
   */
  coupes?: number[]
  onSelectPeriode?: (p: PeriodeDTO) => void
}

const BORDURE_PERIODE = 1.5
const RAYON_PERIODE = 8

const POLICE = '"VINCI Sans", Arial, Helvetica, sans-serif'

/**
 * Rendu HTML/CSS de la frise — positions absolues issues de placements.ts.
 * Styles en ligne (hex VINCI) pour une capture html2canvas fidèle.
 */
export const FriseRendu = forwardRef<HTMLDivElement, Props>(function FriseRendu(
  { disposition: d, evenements, categories, recadrage, onSelect, periodes = [], coupes, onSelectPeriode },
  ref,
) {
  const parId = new Map(evenements.map((e) => [e.id, e]))
  const periodeParId = new Map(periodes.map((p) => [p.id, p]))
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
      {/* Zones teintées des périodes (derrière la frise, sur toute la hauteur) */}
      {d.periodes.map((pp) => {
        const per = periodeParId.get(pp.id)
        if (!per?.zoneFond) return null
        const c = couleursPeriode(per.couleur)
        return (
          <div
            key={`z-${pp.id}`}
            style={{
              position: 'absolute',
              left: pp.gauche + dx,
              top: 0,
              width: pp.droite - pp.gauche,
              height: d.hauteurTotale,
              background: c.fond,
              opacity: 0.55,
              borderLeft: pp.tronqueDebut ? undefined : `1px dashed ${c.bordure}`,
              borderRight: pp.tronqueFin ? undefined : `1px dashed ${c.bordure}`,
              boxSizing: 'border-box',
            }}
          />
        )
      })}
      {/* Périodes : barres arrondies couvrant exactement la plage de dates */}
      {d.periodes.flatMap((pp) => {
        const per = periodeParId.get(pp.id)
        if (!per) return []
        const c = couleursPeriode(per.couleur)
        const titre = per.titre.toLocaleUpperCase('fr-FR')
        const sous = sousTitreAffiche(per)
        const Balise = onSelectPeriode ? 'button' : 'div'
        return segmentsPeriode(pp, coupes).map((sg, i) => {
          // bords « ouverts » (carrés) quand la période continue hors de la partie visible
          const ouvertG = sg.coupeGauche || pp.tronqueDebut
          const ouvertD = sg.coupeDroite || pp.tronqueFin
          const largeur = Math.max(1, sg.droite - sg.gauche - (ouvertG ? 0 : 1) - (ouvertD ? 0 : 1))
          const utile = largeur - 2 * PERIODE.paddingX
          return (
            <Balise
              key={`pe-${pp.id}-${i}`}
              type={onSelectPeriode ? 'button' : undefined}
              onClick={onSelectPeriode ? () => onSelectPeriode(per) : undefined}
              title={onSelectPeriode ? `${per.titre} — ${jourFR(per.debut)} → ${jourFR(per.fin)}` : undefined}
              style={{
                position: 'absolute',
                left: sg.gauche + dx + (ouvertG ? 0 : 1),
                top: pp.top,
                width: largeur,
                height: pp.hauteur,
                boxSizing: 'border-box',
                margin: 0,
                padding: `0 ${PERIODE.paddingX}px`,
                background: c.fond,
                border: `${BORDURE_PERIODE}px solid ${c.bordure}`,
                borderLeftStyle: ouvertG ? 'dashed' : 'solid',
                borderRightStyle: ouvertD ? 'dashed' : 'solid',
                borderTopLeftRadius: ouvertG ? 0 : RAYON_PERIODE,
                borderBottomLeftRadius: ouvertG ? 0 : RAYON_PERIODE,
                borderTopRightRadius: ouvertD ? 0 : RAYON_PERIODE,
                borderBottomRightRadius: ouvertD ? 0 : RAYON_PERIODE,
                overflow: 'hidden',
                cursor: onSelectPeriode ? 'pointer' : 'default',
                fontFamily: POLICE,
                color: c.texte,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'stretch',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  height: PERIODE.ligneTitre,
                  lineHeight: `${PERIODE.ligneTitre}px`,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {ajusterLibelle(titre, utile, PERIODE.pxCaractereTitre)}
              </div>
              <div
                style={{
                  flexShrink: 0,
                  height: PERIODE.ligneSousTitre,
                  lineHeight: `${PERIODE.ligneSousTitre}px`,
                  fontSize: 10,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  color: c.texte,
                  opacity: 0.85,
                }}
              >
                {ajusterLibelle(sous, utile, PERIODE.pxCaractereSousTitre)}
              </div>
            </Balise>
          )
        })
      })}
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
