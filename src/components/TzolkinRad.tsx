import { useState } from 'react';
import { tzolkin, TZOLKIN_NAMEN, TZOLKIN_BEDEUTUNG } from '../lib/maya';

interface Props {
  datum: Date;
  setDatum: (d: Date) => void;
}

const R_AUSSEN = 230;
const R_GLYPHEN_AUSSEN = 230;
const R_GLYPHEN_INNEN = 175;
const R_ZAHLEN_AUSSEN = 175;
const R_ZAHLEN_INNEN = 130;
const R_ZENTRUM = 130;

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

export function TzolkinRad({ datum, setDatum }: Props) {
  const aktuell = tzolkin(datum);
  const [hover, setHover] = useState<{ glyphe: string; zahl?: number } | null>(null);

  // 20 Glyphen aussen, jede 18°
  const glyphenSektoren = TZOLKIN_NAMEN.map((name, i) => ({
    name,
    w1: -90 + i * 18,
    w2: -90 + (i + 1) * 18,
    aktiv: i === aktuell.nameIndex,
  }));

  // 13 Zahlen innen, jede 360/13 = ~27.69°
  const zahlenSektoren = Array.from({ length: 13 }, (_, i) => ({
    zahl: i + 1,
    w1: -90 + i * (360 / 13),
    w2: -90 + (i + 1) * (360 / 13),
    aktiv: i + 1 === aktuell.zahl,
  }));

  function gehZu(name: string, zahl: number) {
    // Naechstes Datum finden, das diese Tzolkin-Kombination hat
    const heute = new Date(datum);
    for (let i = 1; i <= 260; i++) {
      const probe = new Date(heute);
      probe.setDate(heute.getDate() + i);
      const t = tzolkin(probe);
      if (t.name === name && t.zahl === zahl) {
        setDatum(probe);
        return;
      }
    }
  }

  return (
    <div className="tzolkin-rad">
      <svg viewBox="-250 -250 500 500" className="tzolkin-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="tz-zentrum-grad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="var(--paper)" />
            <stop offset="100%" stopColor="color-mix(in srgb, #a8423a 8%, var(--paper))" />
          </radialGradient>
        </defs>

        {/* === Glyphenring (aussen, 20 Sektoren) === */}
        {glyphenSektoren.map(({ name, w1, w2, aktiv }) => {
          const mitte = (w1 + w2) / 2;
          const p = polar(mitte, (R_GLYPHEN_AUSSEN + R_GLYPHEN_INNEN) / 2);
          const labelPos = polar(mitte, R_GLYPHEN_INNEN + 12);
          const rotNorm = (((mitte + 90) % 360) + 360) % 360;
          const flip = rotNorm > 90 && rotNorm < 270;
          const textRot = flip ? mitte - 90 : mitte + 90;
          return (
            <g
              key={name}
              style={{ cursor: 'pointer' }}
              onClick={() => gehZu(name, aktuell.zahl)}
              onMouseEnter={() => setHover({ glyphe: name })}
              onMouseLeave={() => setHover(null)}
            >
              <path
                d={sektorPath(w1, w2, R_GLYPHEN_INNEN, R_GLYPHEN_AUSSEN)}
                fill={aktiv ? '#a8423a' : (name === hover?.glyphe ? 'color-mix(in srgb, #a8423a 25%, var(--paper))' : 'var(--paper)')}
                stroke="var(--line)"
                strokeWidth={0.6}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill={aktiv ? 'white' : 'var(--ink)'}
                transform={`rotate(${textRot} ${labelPos.x} ${labelPos.y})`}
                fontWeight={aktiv ? 600 : 500}
                pointerEvents="none"
              >
                {name.toUpperCase()}
              </text>
              {aktiv && (
                <circle cx={p.x} cy={p.y} r={4} fill="white" stroke="#a8423a" strokeWidth={1.5} pointerEvents="none" />
              )}
            </g>
          );
        })}

        {/* === Zahlenring (innen, 13 Sektoren) === */}
        {zahlenSektoren.map(({ zahl, w1, w2, aktiv }) => {
          const mitte = (w1 + w2) / 2;
          const p = polar(mitte, (R_ZAHLEN_AUSSEN + R_ZAHLEN_INNEN) / 2);
          return (
            <g
              key={zahl}
              style={{ cursor: 'pointer' }}
              onClick={() => gehZu(aktuell.name, zahl)}
              onMouseEnter={() => setHover({ glyphe: hover?.glyphe ?? aktuell.name, zahl })}
              onMouseLeave={() => setHover(null)}
            >
              <path
                d={sektorPath(w1, w2, R_ZAHLEN_INNEN, R_ZAHLEN_AUSSEN)}
                fill={aktiv ? '#a8423a' : (zahl === hover?.zahl ? 'color-mix(in srgb, #a8423a 18%, var(--paper))' : 'color-mix(in srgb, #a8423a 5%, var(--paper))')}
                stroke="var(--line)"
                strokeWidth={0.6}
              />
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={18}
                fill={aktiv ? 'white' : 'var(--ink)'}
                fontWeight={aktiv ? 700 : 500}
                pointerEvents="none"
              >
                {zahl}
              </text>
            </g>
          );
        })}

        {/* === Zentrum === */}
        <circle cx={0} cy={0} r={R_ZENTRUM} fill="url(#tz-zentrum-grad)" stroke="var(--line-strong)" strokeWidth={0.8} />

        {/* === Zentrum-Inhalt === */}
        <g pointerEvents="none" textAnchor="middle">
          <text fontSize={11} fill="var(--ink-mute)" letterSpacing="0.5">
            <tspan x={0} y={-60}>TZOLKIN</tspan>
          </text>
          <text fontSize={42} fill="#a8423a" fontWeight={600}>
            <tspan x={0} y={-18}>{aktuell.zahl}</tspan>
          </text>
          <text fontSize={18} fill="var(--ink)" fontWeight={500}>
            <tspan x={0} y={14}>{aktuell.name}</tspan>
          </text>
          <text fontSize={9} fill="var(--ink-mute)">
            <tspan x={0} y={32}>Tag {aktuell.position} / 260</tspan>
          </text>
          <foreignObject x={-110} y={42} width={220} height={75}>
            <div className="tz-zentrum-text">{TZOLKIN_BEDEUTUNG[aktuell.name]}</div>
          </foreignObject>
        </g>

        {/* === Heute-Marker (klein) === */}
        <circle cx={0} cy={-R_AUSSEN + 4} r={3} fill="var(--ink)" />
      </svg>
    </div>
  );
}
