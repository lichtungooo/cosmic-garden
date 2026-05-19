import { useState } from 'react';
import { haab, HAAB_MONATE, HAAB_BEDEUTUNG, mayaTageSeitNullpunkt } from '../lib/maya';

interface Props {
  datum: Date;
  setDatum: (d: Date) => void;
}

const R_AUSSEN = 230;
const R_MONAT_AUSSEN = 230;
const R_MONAT_INNEN = 170;
const R_ZENTRUM = 165;

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

export function HaabRad({ datum, setDatum }: Props) {
  const aktuell = haab(datum);
  const [hover, setHover] = useState<number | null>(null);

  // 18 reguläre Monate à 20 Tage + Wayeb (5 Tage)
  // Insgesamt 365 Tage. Sektor-Breite proportional zu Tagen.
  const monate = HAAB_MONATE.map((name, i) => {
    const tageImMonat = i === 18 ? 5 : 20;
    const startTag = i < 18 ? i * 20 : 360;
    const w1 = -90 + (startTag / 365) * 360;
    const w2 = -90 + ((startTag + tageImMonat) / 365) * 360;
    return { name, w1, w2, index: i, aktiv: i === aktuell.monatIndex, istWayeb: i === 18 };
  });

  function gehZuMonat(monatIndex: number) {
    // Naechstes Datum finden, das in diesem Haab-Monat liegt (Tag 0)
    const heute = mayaTageSeitNullpunkt(datum);
    // Zielposition: monatIndex * 20 (wenn nicht Wayeb), Wayeb = 360
    const zielHaabPos = monatIndex === 18 ? 360 : monatIndex * 20;
    // Aktueller haabPos: (348 + heute) % 365
    const aktuellHaabPos = ((348 + heute) % 365 + 365) % 365;
    let delta = zielHaabPos - aktuellHaabPos;
    if (delta < 0) delta += 365;
    if (delta === 0) delta = 365; // springe zum nächsten gleichen Monat
    const neu = new Date(datum);
    neu.setDate(neu.getDate() + delta);
    setDatum(neu);
  }

  return (
    <div className="tzolkin-rad">
      <svg viewBox="-250 -250 500 500" className="tzolkin-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="ha-zentrum-grad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="var(--paper)" />
            <stop offset="100%" stopColor="color-mix(in srgb, #c89b3a 10%, var(--paper))" />
          </radialGradient>
        </defs>

        {/* === Monatsring === */}
        {monate.map(({ name, w1, w2, index, aktiv, istWayeb }) => {
          const mitte = (w1 + w2) / 2;
          const p = polar(mitte, (R_MONAT_AUSSEN + R_MONAT_INNEN) / 2);
          const rotNorm = (((mitte + 90) % 360) + 360) % 360;
          const flip = rotNorm > 90 && rotNorm < 270;
          const textRot = flip ? mitte - 90 : mitte + 90;
          return (
            <g
              key={name}
              style={{ cursor: 'pointer' }}
              onClick={() => gehZuMonat(index)}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            >
              <path
                d={sektorPath(w1, w2, R_MONAT_INNEN, R_MONAT_AUSSEN)}
                fill={
                  aktiv ? '#c89b3a' :
                  istWayeb ? 'color-mix(in srgb, #5b3a8a 14%, var(--paper))' :
                  hover === index ? 'color-mix(in srgb, #c89b3a 20%, var(--paper))' :
                  index % 2 === 0 ? '#faf2dc' : '#f3ead4'
                }
                stroke="var(--line)"
                strokeWidth={0.6}
              />
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={istWayeb ? 7 : 9}
                fill={aktiv ? 'white' : istWayeb ? 'var(--ink-mute)' : 'var(--ink)'}
                transform={`rotate(${textRot} ${p.x} ${p.y})`}
                fontWeight={aktiv ? 700 : 500}
                pointerEvents="none"
              >
                {name.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* === Tag-Markierungen (jeder Tag, 1-20 oder 1-5 für Wayeb) === */}
        {Array.from({ length: 365 }).map((_, t) => {
          const w = -90 + (t / 365) * 360;
          const innen = polar(w, R_MONAT_INNEN);
          const aussen = polar(w, R_MONAT_INNEN + (t % 20 === 0 ? 6 : 3));
          return (
            <line
              key={`tag-${t}`}
              x1={innen.x} y1={innen.y}
              x2={aussen.x} y2={aussen.y}
              stroke="var(--ink-mute)"
              strokeWidth={t % 20 === 0 ? 0.7 : 0.3}
              opacity={t % 20 === 0 ? 0.5 : 0.25}
              pointerEvents="none"
            />
          );
        })}

        {/* === Zentrum === */}
        <circle cx={0} cy={0} r={R_ZENTRUM} fill="url(#ha-zentrum-grad)" stroke="var(--line-strong)" strokeWidth={0.8} />

        {/* === Zentrum-Inhalt === */}
        <g pointerEvents="none" textAnchor="middle">
          <text fontSize={11} fill="var(--ink-mute)" letterSpacing="0.5">
            <tspan x={0} y={-80}>HAAB</tspan>
          </text>
          <text fontSize={48} fill="#c89b3a" fontWeight={600}>
            <tspan x={0} y={-30}>{aktuell.tagImMonat}</tspan>
          </text>
          <text fontSize={20} fill="var(--ink)" fontWeight={500}>
            <tspan x={0} y={4}>{aktuell.monat}</tspan>
          </text>
          <text fontSize={9} fill="var(--ink-mute)">
            <tspan x={0} y={24}>
              {aktuell.istWayeb ? 'einer der fuenf namenlosen Tage' : `Monat ${aktuell.monatIndex + 1} von 18`}
            </tspan>
          </text>
          <foreignObject x={-130} y={36} width={260} height={100}>
            <div className="tz-zentrum-text">{HAAB_BEDEUTUNG[aktuell.monat]}</div>
          </foreignObject>
        </g>

        {/* === Aktueller-Tag-Marker innerhalb des aktuellen Monatssektors === */}
        {(() => {
          const haabPos = aktuell.monatIndex * 20 + aktuell.tagImMonat;
          const wAktuell = -90 + ((aktuell.istWayeb ? 360 + aktuell.tagImMonat : haabPos) / 365) * 360;
          const pos = polar(wAktuell, R_MONAT_AUSSEN + 8);
          return <circle cx={pos.x} cy={pos.y} r={4} fill="var(--ink)" />;
        })()}
      </svg>
    </div>
  );
}
