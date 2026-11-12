'use client'
import { useEffect, useRef, useState } from 'react'
import { VINCI } from '@/lib/design-tokens'
import {
  COULEURS_SCHEMA, polygoneFleche, polygonePentagone, polygonePointe, zoneTexte, type SchemaGeometrie,
} from '@/lib/boite-a-outils/dgd'

/** Échelle minimale : en dessous, le schéma défile horizontalement (lisibilité sur téléphone). */
const ECHELLE_MIN = 0.6

/**
 * Schéma de procédure (frise horizontale, flèches de délais, boîtes d'étapes) rendu à partir
 * d'une géométrie fixe, mise à l'échelle de la largeur disponible (tablette / PC).
 */
export function SchemaDGD({ schema, titre }: { schema: SchemaGeometrie; titre: string }) {
  const conteneur = useRef<HTMLDivElement>(null)
  const [echelle, setEchelle] = useState(1)

  useEffect(() => {
    const el = conteneur.current
    if (!el) return
    const maj = () => setEchelle(Math.max(ECHELLE_MIN, Math.min(1.15, el.clientWidth / schema.largeur)))
    maj()
    const ro = new ResizeObserver(maj)
    ro.observe(el)
    return () => ro.disconnect()
  }, [schema.largeur])

  const { largeur: W, hauteur: H, axe } = schema
  return (
    <div ref={conteneur} className="w-full overflow-x-auto" role="img" aria-label={titre}>
      <div style={{ width: W * echelle, height: H * echelle }}>
        <div className="relative origin-top-left" style={{ width: W, height: H, transform: `scale(${echelle})` }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0" aria-hidden>
            {/* Axe (double trait) */}
            <line x1={axe.x1} y1={axe.y - 3} x2={axe.x2} y2={axe.y - 3} stroke={VINCI.noir} strokeWidth={2} />
            <line x1={axe.x1} y1={axe.y + 3} x2={axe.x2} y2={axe.y + 3} stroke={VINCI.noir} strokeWidth={2} />
            {/* Traits de rappel */}
            {schema.traits.map((t, i) => (
              <g key={`t${i}`}>
                <line
                  x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                  stroke={VINCI.noir} strokeWidth={t.pointille ? 3 : 2.5}
                  strokeDasharray={t.pointille ? '5 5' : undefined}
                />
                {t.pointe && <polygon points={polygonePointe(t, 11)} fill={VINCI.noir} />}
              </g>
            ))}
            {/* Flèches de délais */}
            {schema.fleches.map((f, i) => (
              <polygon key={`f${i}`} points={polygoneFleche(f)} fill={COULEURS_SCHEMA[f.couleur].fond} />
            ))}
            {/* Fonds des boîtes */}
            {schema.boites.map((b) =>
              b.forme === 'pentagone' ? (
                <polygon key={b.id} points={polygonePentagone(b)} fill={COULEURS_SCHEMA[b.couleur].fond} />
              ) : (
                <rect key={b.id} x={b.x} y={b.y} width={b.w} height={b.h} rx={12} fill={COULEURS_SCHEMA[b.couleur].fond} />
              ),
            )}
          </svg>
          {/* Libellés des flèches */}
          {schema.fleches.map((f, i) =>
            f.label ? (
              <div
                key={`fl${i}`}
                className="absolute flex items-center justify-center font-bold"
                style={{
                  left: f.x1, top: f.y - f.h / 2, width: f.x2 - f.x1, height: f.h,
                  fontSize: f.taille ?? 20, color: COULEURS_SCHEMA[f.couleur].texte,
                }}
              >
                {f.label}
              </div>
            ) : null,
          )}
          {/* Textes des boîtes */}
          {schema.boites.map((b) => {
            const z = zoneTexte(b)
            return (
              <div
                key={`tx-${b.id}`}
                className="absolute flex items-center justify-center px-2.5 text-center leading-snug"
                style={{
                  left: z.x, top: z.y, width: z.w, height: z.h,
                  color: COULEURS_SCHEMA[b.couleur].texte, fontSize: b.taille ?? 14, fontWeight: b.gras ? 700 : 600,
                }}
              >
                {b.texte}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
