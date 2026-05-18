import { useState } from 'react';
import { venus, VENUS_PHASEN, VENUS_ZYKLUS_TAGE, naechsterPhasenWechsel, type VenusPhaseId } from '../lib/maya';

interface Props {
  datum: Date;
  setDatum: (d: Date) => void;
}

const R_AUSSEN = 230;
const R_TAGE_INNEN = 222;
const R_PHASEN_AUSSEN = 222;
const R_PHASEN_INNEN = 160;
const R_ZENTRUM = 155;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

function sektorPath(startAngle: number, endAngle: number, innerR: number, outerR: number): string {
  const so = polar(startAngle, outerR);
  const eo = polar(endAngle, outerR);
  const ei = polar(endAngle, innerR);
  const si = polar(startAngle, innerR);
  const sweep = endAngle - startAngle;
  const large = Math.abs(sweep) > 180 ? 1 : 0;
  const dir = sweep > 0 ? 1 : 0;
  const dirBack = sweep > 0 ? 0 : 1;
  return `M ${so.x} ${so.y} A ${outerR} ${outerR} 0 ${large} ${dir} ${eo.x} ${eo.y} L ${ei.x} ${ei.y} A ${innerR} ${innerR} 0 ${large} ${dirBack} ${si.x} ${si.y} Z`;
}

function tagZuWinkel(tag: number): number {
  return -90 + (tag / VENUS_ZYKLUS_TAGE) * 360;
}

export function VenusRad({ datum, setDatum }: Props) {
  const aktuell = venus(datum);
  const [hover, setHover] = useState<VenusPhaseId | null>(null);

  function springeZu(phaseId: VenusPhaseId) {
    setDatum(naechsterPhasenWechsel(datum, phaseId));
  }

  return (
    <div className="tzolkin-rad">
      <svg viewBox="-250 -250 500 500" className="tzolkin-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="venus-zentrum-grad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="var(--paper)" />
            <stop offset="100%" stopColor={`color-mix(in srgb, ${aktuell.phase.farbe} 14%, var(--paper))`} />
          </radialGradient>
        </defs>

        {/* === Phasenring === */}
        {VENUS_PHASEN.map(phase => {
          const w1 = tagZuWinkel(phase.start);
          const w2 = tagZuWinkel(phase.ende);
          const mitte = (w1 + w2) / 2;
          const p = polar(mitte, (R_PHASEN_AUSSEN + R_PHASEN_INNEN) / 2);
          const aktiv = phase.id === aktuell.phase.id;
          const istHover = hover === phase.id;
          const rotNorm = (((mitte + 90) % 360) + 360) % 360;
          const flip = rotNorm > 90 && rotNorm < 270;
          const textRot = flip ? mitte - 90 : mitte + 90;
          return (
            <g
              key={phase.id}
              style={{ cursor: 'pointer' }}
              onClick={() => springeZu(phase.id)}
              onMouseEnter={() => setHover(phase.id)}
              onMouseLeave={() => setHover(null)}
            >
              <path
                d={sektorPath(w1, w2, R_PHASEN_INNEN, R_PHASEN_AUSSEN)}
                fill={aktiv ? phase.farbe : istHover ? `color-mix(in srgb, ${phase.farbe} 40%, var(--paper))` : `color-mix(in srgb, ${phase.farbe} 18%, var(--paper))`}
                stroke="var(--line)"
                strokeWidth={0.6}
              />
              <g transform={`rotate(${textRot} ${p.x} ${p.y})`} pointerEvents="none">
                <text
                  x={p.x}
                  y={p.y - 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill={aktiv ? (phase.id === 'unter-konj' ? 'white' : 'var(--ink)') : 'var(--ink)'}
                  fontWeight={aktiv ? 600 : 500}
                  letterSpacing="0.5"
                >
                  {phase.name.toUpperCase()}
                </text>
                <text
                  x={p.x}
                  y={p.y + 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={7}
                  fill={aktiv ? 'rgba(255,255,255,0.75)' : 'var(--ink-mute)'}
                >
                  {phase.ende - phase.start} Tage
                </text>
              </g>
            </g>
          );
        })}

        {/* === Tag-Striche === */}
        {Array.from({ length: VENUS_ZYKLUS_TAGE }).map((_, t) => {
          const w = tagZuWinkel(t);
          const innen = polar(w, R_TAGE_INNEN);
          const aussen = polar(w, t % 20 === 0 ? R_AUSSEN : R_AUSSEN - 3);
          return (
            <line
              key={`t-${t}`}
              x1={innen.x} y1={innen.y}
              x2={aussen.x} y2={aussen.y}
              stroke="var(--ink-soft)"
              strokeWidth={t % 20 === 0 ? 0.8 : 0.3}
              opacity={t % 20 === 0 ? 0.55 : 0.25}
              pointerEvents="none"
            />
          );
        })}

        {/* === 5-Phasen-Symbol-Sterne (zur visuellen Verbindung 5×584 = 8 Sonnenjahre) === */}
        {[0, 117, 234, 351, 468].map((t, i) => {
          const w = tagZuWinkel(t);
          const pos = polar(w, R_PHASEN_INNEN - 5);
          return (
            <text
              key={`stern-${i}`}
              x={pos.x} y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill="var(--ink-soft)"
              opacity={0.5}
              pointerEvents="none"
            >
              ✦
            </text>
          );
        })}

        {/* === Zentrum === */}
        <circle cx={0} cy={0} r={R_ZENTRUM} fill="url(#venus-zentrum-grad)" stroke="var(--line-strong)" strokeWidth={0.8} />

        {/* === Zentrum-Inhalt === */}
        <g pointerEvents="none" textAnchor="middle">
          <text fontSize={11} fill="var(--ink-mute)" letterSpacing="0.5">
            <tspan x={0} y={-78}>VENUS</tspan>
          </text>
          <text fontSize={26} fill={aktuell.phase.farbe} fontWeight={600}>
            <tspan x={0} y={-44}>{aktuell.phase.name}</tspan>
          </text>
          <text fontSize={10} fill="var(--ink-mute)">
            <tspan x={0} y={-24}>
              Tag {aktuell.tagInPhase + 1} von {aktuell.phase.ende - aktuell.phase.start}
            </tspan>
            <tspan x={0} y={-10}>
              Zyklus {aktuell.zyklusNummer} seit 2012-06-06
            </tspan>
          </text>
          <foreignObject x={-130} y={0} width={260} height={140}>
            <div className="tz-zentrum-text venus-zentrum-text">
              <div className="venus-beschr">{aktuell.phase.beschreibung}</div>
              <div className="venus-bedeut">{aktuell.phase.bedeutung}</div>
            </div>
          </foreignObject>
        </g>

        {/* === Heute-Marker === */}
        {(() => {
          const w = tagZuWinkel(aktuell.tagImZyklus);
          const pos = polar(w, R_AUSSEN + 6);
          return <circle cx={pos.x} cy={pos.y} r={5} fill="var(--ink)" stroke="var(--paper)" strokeWidth={1.5} />;
        })()}
      </svg>
    </div>
  );
}
