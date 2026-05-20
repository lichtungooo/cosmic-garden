import { useMemo, useState } from 'react';
import { TIERKREIS, mondTag, thunTypFarbe, thunTypLabel, phaseLabel } from '../lib/moon';
import { tagesHimmel, findPhaseAtDay, phaseEventLabel, formatZeit, formatDauer } from '../lib/himmel';
import { useStandort } from '../lib/standort';
import {
  mondphasenImJahr,
  datumZuWinkel,
  jahresAnfang,
  jahresEnde,
} from '../lib/jahreskreis';
import { MondSymbol } from '../components/MondSymbol';
import { mayaDatum, TZOLKIN_BEDEUTUNG, HAAB_BEDEUTUNG } from '../lib/maya';
import { InfoIcon } from '../components/InfoIcon';
import { TagebuchTag } from '../components/TagebuchTag';

const WT_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE_KURZ = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONATE_LANG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

interface Props {
  datum: Date;
  onDatum?: (d: Date) => void;
}

// Radien — kompakte aussere Ringe, grosses Zentrum
const R_AUSSEN          = 250;
const R_TAGRING_INNEN   = 234;
const R_MONAT_AUSSEN    = 234;
const R_MONAT_INNEN     = 214;
const R_STERN_AUSSEN    = 214;
const R_STERN_INNEN     = 188;
const R_SONNE_AUSSEN    = 188;
const R_SONNE_INNEN     = 162;
const R_MOND_RING       = 154;
const R_ZENTRUM         = 146;

// Variation Selector-15 erzwingt Text-Darstellung statt Emoji
const VS_TEXT = String.fromCharCode(0xFE0E);

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

export function JahreskreisView({ datum, onDatum }: Props) {
  const ort = useStandort();
  const jahr = datum.getFullYear();
  const [hover, setHover] = useState<{ datum: Date; label?: string; x: number; y: number } | null>(null);
  const [detailOffen, setDetailOffen] = useState(false);
  const [monatDetail, setMonatDetail] = useState<number | null>(null);

  const phasen = useMemo(() => mondphasenImJahr(jahr), [jahr]);

  const anfang = useMemo(() => jahresAnfang(jahr), [jahr]);
  const ende = useMemo(() => jahresEnde(jahr), [jahr]);
  const anzTage = Math.round((ende.getTime() - anfang.getTime()) / 86400000);

  // Sonnenkurve (alle 2 Tage gesampled, mit klarer Schliessung am Jahreswechsel)
  const sonnenkurve = useMemo(() => {
    const punkte: { winkel: number; laenge: number }[] = [];
    for (let t = 0; t < anzTage; t += 2) {
      const d = new Date(anfang);
      d.setDate(anfang.getDate() + t);
      const h = tagesHimmel(d, ort);
      if (h.tagesLaengeMin != null) {
        const wRoh = (t / anzTage) * 360 - 90; // direkt aus Position berechnen, kein Modulo
        punkte.push({ winkel: wRoh, laenge: h.tagesLaengeMin });
      }
    }
    return punkte;
  }, [jahr, ort, anfang, anzTage]);

  const maxLaenge = Math.max(...sonnenkurve.map(p => p.laenge), 1);
  const minLaenge = Math.min(...sonnenkurve.map(p => p.laenge), 0);

  // Siderische Sternzeichen-Sektoren: 12 feste 30°-Sektoren, Widder beginnt am 14.4. (sid. Eintritt).
  const widderWinkel = datumZuWinkel(new Date(jahr, 3, 14), jahr);
  const sternzeichen = TIERKREIS.map((z, i) => ({
    zeichen: z,
    w1: widderWinkel + i * 30,
    w2: widderWinkel + (i + 1) * 30,
  }));

  // Alle Tage des Jahres als klickbare Sektoren
  const tagSektoren = useMemo(() => {
    return Array.from({ length: anzTage }, (_, i) => {
      const d = new Date(anfang);
      d.setDate(anfang.getDate() + i);
      return { datum: d, winkel: datumZuWinkel(d, jahr) };
    });
  }, [jahr, anfang, anzTage]);

  const heute = new Date();
  const istJahrHeute = heute.getFullYear() === jahr;
  const winkelHeute = datumZuWinkel(heute, jahr);
  const winkelDatum = datumZuWinkel(datum, jahr);
  const istHeute = istJahrHeute && heute.toDateString() === datum.toDateString();

  // Info-Datum: bei Hover das gehoverte, sonst das selektierte Datum
  const infoDatum = hover?.datum ?? datum;
  const infoMond = mondTag(infoDatum);
  const infoHimmel = tagesHimmel(infoDatum, ort);
  const infoMaya = mayaDatum(infoDatum);
  const infoPhase = findPhaseAtDay(infoDatum);

  return (
    <div className="jahreskreis-view">
      <div className="jahreskreis-grid">
        <aside className="jahr-info-panel jahr-info-links">
          <h4>{hover ? hover.label : `${WT_LANG[infoDatum.getDay()]}, ${infoDatum.getDate()}. ${MONATE_LANG[infoDatum.getMonth()]}`}</h4>
          <div className="jahr-info-zeile" style={{ borderLeftColor: thunTypFarbe(infoMond.thunTyp) }}>
            <span>Tagestyp</span>
            <span style={{ color: thunTypFarbe(infoMond.thunTyp), fontWeight: 500 }}>{thunTypLabel(infoMond.thunTyp)}</span>
          </div>
          <div className="jahr-info-zeile">
            <span>Tierkreis</span>
            <span>{infoMond.zeichen.symbol + VS_TEXT} {infoMond.zeichen.name}</span>
          </div>
          <div className="jahr-info-zeile">
            <span>Mond</span>
            <span>{phaseLabel(infoMond.phase)} · {Math.round(infoMond.illumination * 100)}%</span>
          </div>
          <div className="jahr-info-zeile">
            <span>Aufstieg</span>
            <span>{infoMond.aufstieg}</span>
          </div>
          {infoMond.knotenTag && (
            <div className="jahr-info-zeile jahr-info-warn">
              <span>Mondknoten</span>
              <span>heute</span>
            </div>
          )}
        </aside>

        <div className="jahreskreis-wrap">
          <svg viewBox="-260 -260 520 520" className="jahreskreis-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="sonnen-grad" x1="0" y1="-1" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8B860" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fdf2c8" stopOpacity="0.35" />
            </linearGradient>
            <radialGradient id="zentrum-grad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="var(--paper)" />
              <stop offset="100%" stopColor="var(--bg)" />
            </radialGradient>
          </defs>

          {/* === Klick-Sektoren für jeden Tag === */}
          {tagSektoren.map((t, i) => {
            const winkelStart = t.winkel - (360 / anzTage) / 2;
            const winkelEnde  = t.winkel + (360 / anzTage) / 2;
            return (
              <path
                key={`klick-${i}`}
                d={sektorPath(winkelStart, winkelEnde, R_TAGRING_INNEN, R_AUSSEN)}
                fill="transparent"
                stroke="none"
                style={{ cursor: 'pointer' }}
                onClick={() => onDatum?.(t.datum)}
                onMouseEnter={(ev) => setHover({
                  datum: t.datum,
                  label: `${WT_LANG[t.datum.getDay()]}, ${t.datum.getDate()}. ${MONATE_LANG[t.datum.getMonth()]}`,
                  x: ev.clientX,
                  y: ev.clientY,
                })}
                onMouseMove={(ev) => setHover(h => h ? { ...h, x: ev.clientX, y: ev.clientY } : null)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}

          {/* === Tag-Striche === */}
          {tagSektoren.map((t, i) => {
            const w = t.winkel;
            const istMontag = t.datum.getDay() === 1;
            const istMonatsAnfang = t.datum.getDate() === 1;
            const innen = polar(w, R_TAGRING_INNEN + 2);
            const aussen = polar(w, istMonatsAnfang ? R_AUSSEN : istMontag ? R_AUSSEN - 2 : R_AUSSEN - 6);
            return (
              <line
                key={`strich-${i}`}
                x1={innen.x} y1={innen.y}
                x2={aussen.x} y2={aussen.y}
                stroke={istMonatsAnfang ? 'var(--ink)' : istMontag ? 'var(--ink-mute)' : 'var(--ink-soft)'}
                strokeWidth={istMonatsAnfang ? 1.4 : istMontag ? 0.7 : 0.4}
                opacity={istMonatsAnfang ? 0.95 : istMontag ? 0.5 : 0.3}
                pointerEvents="none"
              />
            );
          })}

          {/* === Tag-Ziffern: nur am 1. (fett) und 15. (normal) === */}
          {tagSektoren.filter(t => t.datum.getDate() === 1 || t.datum.getDate() === 15).map((t, i) => {
            const istEins = t.datum.getDate() === 1;
            const pos = polar(t.winkel, R_AUSSEN + 12);
            return (
              <text
                key={`num-${i}`}
                x={pos.x} y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={istEins ? 9 : 7}
                fill={istEins ? 'var(--ink)' : 'var(--ink-mute)'}
                fontWeight={istEins ? 600 : 400}
                pointerEvents="none"
              >
                {t.datum.getDate()}
              </text>
            );
          })}

          {/* === Monatsring (klickbar) — w2 direkt, ohne Modulo-Wrap === */}
          {Array.from({ length: 12 }).map((_, i) => {
            const s = new Date(jahr, i, 1);
            const tageImMonat = new Date(jahr, i + 1, 0).getDate();
            const w1 = datumZuWinkel(s, jahr);
            const w2 = w1 + (tageImMonat / anzTage) * 360;
            const mitte = (w1 + w2) / 2;
            const p = polar(mitte, (R_MONAT_AUSSEN + R_MONAT_INNEN) / 2);
            const rotNorm = (((mitte + 90) % 360) + 360) % 360;
            const flip = rotNorm > 90 && rotNorm < 270;
            const textRot = flip ? mitte - 90 : mitte + 90;
            return (
              <g key={i} style={{ cursor: 'pointer' }} onClick={() => setMonatDetail(i)}>
                <path
                  d={sektorPath(w1, w2, R_MONAT_INNEN, R_MONAT_AUSSEN)}
                  fill={i % 2 ? '#f3ead4' : '#faf2dc'}
                  stroke="var(--line)"
                  strokeWidth={0.5}
                />
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="var(--ink)" transform={`rotate(${textRot} ${p.x} ${p.y})`} fontWeight={600} letterSpacing="0.8">
                  {MONATE_KURZ[i].toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* === Monats-Trennlinien === */}
          {Array.from({ length: 12 }).map((_, i) => {
            const s = new Date(jahr, i, 1);
            const w = datumZuWinkel(s, jahr);
            const innen = polar(w, R_MONAT_INNEN);
            const aussen = polar(w, R_AUSSEN + 4);
            return (
              <line
                key={`grenze-${i}`}
                x1={innen.x} y1={innen.y}
                x2={aussen.x} y2={aussen.y}
                stroke="var(--ink-mute)"
                strokeWidth={0.7}
                opacity={0.5}
                pointerEvents="none"
              />
            );
          })}

          {/* === Sternzeichenring (siderisch, 12 feste 30°-Sektoren) === */}
          {sternzeichen.map(({ zeichen, w1, w2 }) => {
            const mitte = (w1 + w2) / 2;
            const p = polar(mitte, (R_STERN_AUSSEN + R_STERN_INNEN) / 2);
            const farbe = thunTypFarbe(zeichen.thunTyp);
            return (
              <g key={zeichen.name} pointerEvents="none">
                <path
                  d={sektorPath(w1, w2, R_STERN_INNEN, R_STERN_AUSSEN)}
                  fill={`color-mix(in srgb, ${farbe} 22%, var(--paper))`}
                  stroke="var(--line)"
                  strokeWidth={0.4}
                />
                <text
                  x={p.x} y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={17}
                  fill="var(--ink)"
                  className="zodiak-glyph"
                >
                  {zeichen.symbol + VS_TEXT}
                </text>
              </g>
            );
          })}

          {/* === Sonnenkurve === */}
          <SonnenkurveBand
            punkte={sonnenkurve}
            innen={R_SONNE_INNEN}
            aussen={R_SONNE_AUSSEN}
            min={minLaenge}
            max={maxLaenge}
          />

          {/* === Mondphasen-Marker === */}
          {phasen.vollmonde.map((p, i) => {
            const w = datumZuWinkel(p.zeit, jahr);
            const pos = polar(w, R_MOND_RING);
            return (
              <g
                key={`vm-${i}`}
                onMouseEnter={(ev) => setHover({ datum: p.zeit, label: `Vollmond`, x: ev.clientX, y: ev.clientY })}
                onMouseMove={(ev) => setHover(h => h ? { ...h, x: ev.clientX, y: ev.clientY } : null)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onDatum?.(p.zeit)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={pos.x} cy={pos.y} r={4} fill="#1A2638" stroke="#B5A87E" strokeWidth={0.5} />
              </g>
            );
          })}
          {phasen.neumonde.map((p, i) => {
            const w = datumZuWinkel(p.zeit, jahr);
            const pos = polar(w, R_MOND_RING);
            return (
              <g
                key={`nm-${i}`}
                onMouseEnter={(ev) => setHover({ datum: p.zeit, label: `Neumond`, x: ev.clientX, y: ev.clientY })}
                onMouseMove={(ev) => setHover(h => h ? { ...h, x: ev.clientX, y: ev.clientY } : null)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onDatum?.(p.zeit)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={pos.x} cy={pos.y} r={4} fill="#f4ecd6" stroke="#B5A87E" strokeWidth={0.7} />
              </g>
            );
          })}
          {phasen.ersteViertel.map((p, i) => {
            const w = datumZuWinkel(p.zeit, jahr);
            const pos = polar(w, R_MOND_RING);
            return (
              <g
                key={`ev-${i}`}
                onMouseEnter={(ev) => setHover({ datum: p.zeit, label: `Erstes Viertel`, x: ev.clientX, y: ev.clientY })}
                onMouseMove={(ev) => setHover(h => h ? { ...h, x: ev.clientX, y: ev.clientY } : null)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onDatum?.(p.zeit)}
                style={{ cursor: 'pointer' }}
              >
                <path d={`M ${pos.x} ${pos.y - 3} A 3 3 0 0 1 ${pos.x} ${pos.y + 3} Z`} fill="#1A2638" />
                <circle cx={pos.x} cy={pos.y} r={3} fill="none" stroke="#B5A87E" strokeWidth={0.5} />
              </g>
            );
          })}
          {phasen.letzteViertel.map((p, i) => {
            const w = datumZuWinkel(p.zeit, jahr);
            const pos = polar(w, R_MOND_RING);
            return (
              <g
                key={`lv-${i}`}
                onMouseEnter={(ev) => setHover({ datum: p.zeit, label: `Letztes Viertel`, x: ev.clientX, y: ev.clientY })}
                onMouseMove={(ev) => setHover(h => h ? { ...h, x: ev.clientX, y: ev.clientY } : null)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onDatum?.(p.zeit)}
                style={{ cursor: 'pointer' }}
              >
                <path d={`M ${pos.x} ${pos.y - 3} A 3 3 0 0 0 ${pos.x} ${pos.y + 3} Z`} fill="#1A2638" />
                <circle cx={pos.x} cy={pos.y} r={3} fill="none" stroke="#B5A87E" strokeWidth={0.5} />
              </g>
            );
          })}

          {/* === Zentrum-Kreis === */}
          <circle
            cx={0} cy={0} r={R_ZENTRUM}
            fill="url(#zentrum-grad)"
            stroke="var(--line-strong)" strokeWidth={0.8}
            style={{ cursor: 'pointer' }}
            onClick={() => setDetailOffen(true)}
          />

          {/* === Heute-Pfeil === */}
          {istJahrHeute && <HeutePfeil winkel={winkelHeute} />}

          {/* === Datum-Marker, wenn != heute === */}
          {!istHeute && <TagMarker winkel={winkelDatum} />}

          {/* === Zentrum-Inhalt (mehr Platz, mehr Info) === */}
          <ZentrumInhalt datum={datum} ort={ort} />
        </svg>

        {hover && (
          <div
            className="jahr-hover"
            style={{ left: hover.x + 14, top: hover.y + 14 }}
          >
            <strong>{hover.label}</strong>
          </div>
        )}
        </div>

        <aside className="jahr-info-panel jahr-info-rechts">
          <h4>Himmel</h4>
          <div className="jahr-info-zeile">
            <span>Sonne</span>
            <span>{formatZeit(infoHimmel.sonnenaufgang)} – {formatZeit(infoHimmel.sonnenuntergang)}</span>
          </div>
          <div className="jahr-info-zeile">
            <span>Mittagshoch</span>
            <span>{formatZeit(infoHimmel.sonnenHoechststand)}</span>
          </div>
          <div className="jahr-info-zeile">
            <span>Tageslicht</span>
            <span>{formatDauer(infoHimmel.tagesLaengeMin)}</span>
          </div>
          {infoPhase && (
            <div className="jahr-info-zeile jahr-info-event">
              <span>{phaseEventLabel(infoPhase.event)}</span>
              <span>{formatZeit(infoPhase.zeit)}</span>
            </div>
          )}
          <h4 style={{ marginTop: '.45rem' }}>Maya</h4>
          <div className="jahr-info-zeile">
            <span>Tzolkin</span>
            <span>{infoMaya.tzolkinStr}</span>
          </div>
          <div className="jahr-info-zeile">
            <span>Haab</span>
            <span>{infoMaya.haabStr}</span>
          </div>
        </aside>
      </div>

      <div className="jahr-legende">
        <span className="leg-item"><span className="leg-dot" style={{ background: '#1A2638' }} />Vollmond</span>
        <span className="leg-item"><span className="leg-dot" style={{ background: '#f4ecd6', border: '1px solid #B5A87E' }} />Neumond</span>
        <span className="leg-item leg-hinweis">Tag im Aussenring antippen · Monat für Detail klicken · Mitte für Tagesdetail</span>
      </div>

      {detailOffen && <DetailPanel datum={datum} ort={ort} onClose={() => setDetailOffen(false)} />}
      {monatDetail !== null && (
        <MonatsDetailPanel
          monat={monatDetail}
          jahr={jahr}
          onClose={() => setMonatDetail(null)}
          onTag={(d) => { onDatum?.(d); setMonatDetail(null); }}
        />
      )}
    </div>
  );
}

// === Sub-Komponenten ===

function SonnenkurveBand({
  punkte, innen, aussen, min, max,
}: { punkte: { winkel: number; laenge: number }[]; innen: number; aussen: number; min: number; max: number; }) {
  if (punkte.length < 3) return null;
  const range = max - min;
  const aeussereLinie = punkte.map(p => {
    const radius = innen + ((p.laenge - min) / range) * (aussen - innen);
    const pos = polar(p.winkel, radius);
    return `${pos.x},${pos.y}`;
  }).join(' L ');
  const innereLinie = punkte.slice().reverse().map(p => {
    const pos = polar(p.winkel, innen);
    return `${pos.x},${pos.y}`;
  }).join(' L ');
  const d = `M ${aeussereLinie} L ${innereLinie} Z`;
  return <path d={d} fill="url(#sonnen-grad)" />;
}

function HeutePfeil({ winkel }: { winkel: number }) {
  const spitze = polar(winkel, R_ZENTRUM + 16);
  const links = polar(winkel + 2, R_ZENTRUM + 5);
  const rechts = polar(winkel - 2, R_ZENTRUM + 5);
  return (
    <g pointerEvents="none">
      <polygon
        points={`${spitze.x},${spitze.y} ${links.x},${links.y} ${rechts.x},${rechts.y}`}
        fill="var(--ink)"
      />
    </g>
  );
}

function TagMarker({ winkel }: { winkel: number }) {
  const pos = polar(winkel, R_ZENTRUM + 10);
  return <circle cx={pos.x} cy={pos.y} r={4} fill="var(--accent)" stroke="white" strokeWidth={1.2} pointerEvents="none" />;
}

function ZentrumInhalt({ datum, ort }: { datum: Date; ort: { name: string; lat: number; lon: number } }) {
  const mond = mondTag(datum);
  const h = tagesHimmel(datum, ort);

  return (
    <g pointerEvents="none">
      <text textAnchor="middle">
        {/* Wochentag oben */}
        <tspan x={0} y={-70} fontSize={10} fill="var(--ink-mute)" letterSpacing="0.6">
          {WT_LANG[datum.getDay()].toUpperCase()}
        </tspan>
      </text>

      {/* Sonnenbogen (Mini-Tagesuhr) */}
      <g>
        <path d="M -45 -10 A 45 45 0 0 1 45 -10" fill="none" stroke="#E8B860" strokeWidth={2} strokeLinecap="round" opacity={0.85} />
        <path d="M -45 -10 A 45 45 0 0 0 45 -10" fill="none" stroke="var(--ink-soft)" strokeWidth={0.7} strokeDasharray="2 2" opacity={0.5} />
        <line x1={-50} y1={-10} x2={50} y2={-10} stroke="var(--ink-mute)" strokeWidth={0.4} opacity={0.4} />
        <circle cx={-45} cy={-10} r={3} fill="#E8B860" />
        <circle cx={45} cy={-10} r={3} fill="#C49758" />
        <polygon points="0,-55 -3,-47 3,-47" fill="#E8B860" />
        {/* Aufgang/Untergang Zeiten klein darunter */}
        <text textAnchor="middle">
          <tspan x={-45} y={-2} fontSize={5.5} fill="var(--ink-soft)" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatZeit(h.sonnenaufgang)}</tspan>
          <tspan x={45} y={-2} fontSize={5.5} fill="var(--ink-soft)" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatZeit(h.sonnenuntergang)}</tspan>
          <tspan x={0} y={-59} fontSize={5.5} fill="var(--ink-soft)" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatZeit(h.sonnenHoechststand)}</tspan>
        </text>
      </g>

      {/* Datum groß */}
      <text textAnchor="middle">
        <tspan x={0} y={16} fontSize={22} fontWeight={500} fill="var(--ink)">
          {datum.getDate()}. {MONATE_KURZ[datum.getMonth()]}
        </tspan>
      </text>

      {/* Sternzeichen */}
      <text textAnchor="middle" className="zodiak-glyph">
        <tspan x={0} y={36} fontSize={11} fill="var(--ink-mute)">
          {mond.zeichen.symbol + VS_TEXT} {mond.zeichen.name} · {thunTypLabel(mond.thunTyp)}
        </tspan>
      </text>

      {/* Mondphase */}
      <text textAnchor="middle">
        <tspan x={0} y={52} fontSize={9} fill="var(--ink-mute)">
          {phaseLabel(mond.phase)} · {Math.round(mond.illumination * 100)}%
        </tspan>
        <tspan x={0} y={68} fontSize={8} fill="var(--ink-soft)" fontStyle="italic">
          {ort.name} · {formatDauer(h.tagesLaengeMin)}
        </tspan>
        <tspan x={0} y={88} fontSize={6.5} fill="var(--ink-soft)" fontStyle="italic">
          antippen für Details
        </tspan>
      </text>
    </g>
  );
}

// === Detail-Panel für Tag ===

function DetailPanel({ datum, ort, onClose }: { datum: Date; ort: { name: string; lat: number; lon: number }; onClose: () => void }) {
  const mond = mondTag(datum);
  const h = tagesHimmel(datum, ort);
  const phaseEvent = findPhaseAtDay(datum);
  const farbe = thunTypFarbe(mond.thunTyp);
  const maya = mayaDatum(datum);
  const tzolkinBedeutung = TZOLKIN_BEDEUTUNG[maya.tzolkin.name];
  const haabBedeutung = HAAB_BEDEUTUNG[maya.haab.monat];

  return (
    <div className="jahr-detail-overlay" onClick={onClose}>
      <div className="jahr-detail-panel" onClick={e => e.stopPropagation()} style={{ borderTopColor: farbe }}>
        <button className="detail-close" onClick={onClose}>×</button>
        <header className="jahr-detail-kopf">
          <div>
            <div className="jahr-detail-wt">{WT_LANG[datum.getDay()]}</div>
            <h2>{datum.getDate()}. {MONATE_LANG[datum.getMonth()]} {datum.getFullYear()}</h2>
          </div>
          <div className="jahr-detail-zeichen">
            <span className="zeichen-symbol-groß zodiak-glyph">{mond.zeichen.symbol + VS_TEXT}</span>
            <span className="zeichen-name-groß">
              {mond.zeichen.name}
              <InfoIcon sektionId="tierkreis" eintragId={mond.zeichen.name.toLowerCase()} titel={`Mehr über ${mond.zeichen.name}`} />
            </span>
            <span className="thun-pille" style={{ background: farbe }}>{thunTypLabel(mond.thunTyp)}</span>
          </div>
        </header>

        <div className="jahr-detail-grid">
          <section className="jahr-detail-block">
            <h3>
              Sonne
              <InfoIcon sektionId="sonne" eintragId="sonnenhoechststand" titel="Sonnenhoechststand erklaert" />
            </h3>
            <div className="jahr-detail-zeile"><span>Aufgang</span><span>{formatZeit(h.sonnenaufgang)}</span></div>
            <div className="jahr-detail-zeile"><span>Hoechster Stand</span><span>{formatZeit(h.sonnenHoechststand)}</span></div>
            <div className="jahr-detail-zeile"><span>Untergang</span><span>{formatZeit(h.sonnenuntergang)}</span></div>
            <div className="jahr-detail-zeile"><span>Tageslaenge</span><span>{formatDauer(h.tagesLaengeMin)}</span></div>
            {h.sonnenHoeheGrad != null && (
              <div className="jahr-detail-zeile"><span>Höhe Mittag</span><span>{Math.round(h.sonnenHoeheGrad)}°</span></div>
            )}
          </section>

          <section className="jahr-detail-block">
            <h3>
              Mond
              <InfoIcon sektionId="mond" eintragId="synodischer-monat" titel="Mondphasen erklaert" />
            </h3>
            <div className="jahr-detail-zeile"><span>Aufgang</span><span>{formatZeit(h.mondaufgang)}</span></div>
            <div className="jahr-detail-zeile"><span>Untergang</span><span>{formatZeit(h.monduntergang)}</span></div>
            <div className="jahr-detail-zeile">
              <span>Phase</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                <MondSymbol illumination={mond.illumination} waxing={mond.waxing} size={14} />
                {phaseLabel(mond.phase)} ({Math.round(mond.illumination * 100)}%)
              </span>
            </div>
            <div className="jahr-detail-zeile">
              <span>Bahn</span>
              <span>
                {mond.aufstieg}
                <InfoIcon sektionId="mond" eintragId="aufsteigend-absteigend" titel="Aufsteigender und absteigender Mond" />
              </span>
            </div>
            {phaseEvent && (
              <div className="jahr-detail-zeile" style={{ color: 'var(--accent)' }}>
                <span>{phaseEventLabel(phaseEvent.event)}</span><span>{formatZeit(phaseEvent.zeit)}</span>
              </div>
            )}
            {mond.knotenTag && (
              <div className="jahr-detail-zeile" style={{ color: 'var(--warn)' }}>
                <span>
                  Hinweis
                  <InfoIcon sektionId="mond" eintragId="mondknoten" titel="Was sind Mondknoten" />
                </span>
                <span>Mondknoten</span>
              </div>
            )}
          </section>

          <section className="jahr-detail-block">
            <h3>Standort</h3>
            <div className="jahr-detail-zeile"><span>Ort</span><span>{ort.name}</span></div>
            <div className="jahr-detail-zeile"><span>Breite</span><span>{ort.lat.toFixed(3)}° N</span></div>
            <div className="jahr-detail-zeile"><span>Laenge</span><span>{ort.lon.toFixed(3)}° E</span></div>
          </section>
        </div>

        <section className="jahr-maya-block">
          <header className="jahr-maya-kopf">
            <h3>
              Maya-Zeitlinien
              <InfoIcon sektionId="maya" eintragId="mayazivilisation" titel="Mayazivilisation" />
            </h3>
            <span className="jahr-maya-untertitel">Parallele Zyklen statt erzwungener Synchronisation</span>
          </header>
          <div className="jahr-maya-grid">
            <div className="jahr-maya-zelle">
              <div className="jahr-maya-label">
                Tzolkin · heiliger Kalender
                <InfoIcon sektionId="maya" eintragId="tzolkin-tiefe" titel="Tzolkin im Detail" />
              </div>
              <div className="jahr-maya-wert">{maya.tzolkin.zahl} {maya.tzolkin.name}</div>
              <div className="jahr-maya-meta">Tag {maya.tzolkin.position} von 260</div>
              {tzolkinBedeutung && <p className="jahr-maya-bedeutung">{tzolkinBedeutung}</p>}
            </div>
            <div className="jahr-maya-zelle">
              <div className="jahr-maya-label">Haab · Sonnenkalender</div>
              <div className="jahr-maya-wert">{maya.haab.tagImMonat} {maya.haab.monat}</div>
              <div className="jahr-maya-meta">{maya.haab.istWayeb ? 'einer der fuenf namenlosen Tage' : `Monat ${maya.haab.monatIndex + 1} von 18`}</div>
              {haabBedeutung && <p className="jahr-maya-bedeutung">{haabBedeutung}</p>}
            </div>
            <div className="jahr-maya-zelle">
              <div className="jahr-maya-label">
                Long Count · grosse Zeitachse
                <InfoIcon sektionId="maya" eintragId="2012-wahrheit" titel="21.12.2012 — was wirklich war" />
              </div>
              <div className="jahr-maya-wert mono">{maya.longCountStr}</div>
              <div className="jahr-maya-meta">{maya.tageSeitNullpunkt.toLocaleString('de-DE')} Tage seit der Maya-Schöpfung (11.8.3114 v.Chr.)</div>
              <p className="jahr-maya-bedeutung">Bak'tun · K'atun · Tun · Winal · K'in. Der aktuelle 13. Bak'tun begann am 21.12.2012.</p>
            </div>
          </div>
        </section>

        <TagebuchTag datum={datum} kompakt />
      </div>
    </div>
  );
}

// === Detail-Panel für Monat ===

function MonatsDetailPanel({
  monat, jahr, onClose, onTag,
}: { monat: number; jahr: number; onClose: () => void; onTag: (d: Date) => void }) {
  const tage = useMemo(() => {
    const anzahl = new Date(jahr, monat + 1, 0).getDate();
    return Array.from({ length: anzahl }, (_, i) => new Date(jahr, monat, i + 1));
  }, [monat, jahr]);

  const phasen = useMemo(() => {
    const von = new Date(jahr, monat, 1);
    const bis = new Date(jahr, monat + 1, 1);
    return tage.map(d => {
      const m = mondTag(d);
      return { datum: d, mond: m };
    }).filter(t => t.datum >= von && t.datum < bis);
  }, [tage, jahr, monat]);

  // Voll- und Neumonde des Monats
  const monatsEreignisse = useMemo(() => {
    return tage.map(d => {
      const evt = findPhaseAtDay(d);
      return evt ? { datum: d, event: evt } : null;
    }).filter((x): x is { datum: Date; event: NonNullable<ReturnType<typeof findPhaseAtDay>> } => !!x);
  }, [tage]);

  return (
    <div className="jahr-detail-overlay" onClick={onClose}>
      <div className="jahr-detail-panel" onClick={e => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}>×</button>
        <header className="jahr-detail-kopf">
          <div>
            <div className="jahr-detail-wt">Monat</div>
            <h2>{MONATE_LANG[monat]} {jahr}</h2>
          </div>
          <div className="jahr-detail-zeichen">
            <span className="zeichen-name-groß">{tage.length} Tage</span>
          </div>
        </header>

        <div className="jahr-detail-grid">
          <section className="jahr-detail-block">
            <h3>Mondphasen</h3>
            {monatsEreignisse.length === 0 ? (
              <p className="jahr-detail-zeile"><span>Keine Phasen-Wechsel diesen Monat</span></p>
            ) : monatsEreignisse.map(({ datum, event }, i) => (
              <div key={i} className="jahr-detail-zeile" style={{ cursor: 'pointer' }} onClick={() => onTag(datum)}>
                <span>{phaseEventLabel(event.event)}</span>
                <span>{datum.getDate()}. · {formatZeit(event.zeit)}</span>
              </div>
            ))}
          </section>

          <section className="jahr-detail-block">
            <h3>Tagestypen</h3>
            {(['wurzel', 'blatt', 'bluete', 'frucht'] as const).map(typ => {
              const anzahl = phasen.filter(p => p.mond.thunTyp === typ).length;
              return (
                <div key={typ} className="jahr-detail-zeile">
                  <span>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: thunTypFarbe(typ), marginRight: 6 }} />
                    {thunTypLabel(typ)}
                  </span>
                  <span>{anzahl} Tage</span>
                </div>
              );
            })}
          </section>
        </div>

        <section style={{ marginTop: '1rem' }}>
          <h3 style={{ fontSize: '.78rem', color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>Alle Tage</h3>
          <div className="monatsdetail-tage">
            {phasen.map(({ datum, mond }) => (
              <button
                key={datum.toISOString()}
                className="monatsdetail-tag"
                style={{ borderTopColor: thunTypFarbe(mond.thunTyp) }}
                onClick={() => onTag(datum)}
                title={`${WT_LANG[datum.getDay()]} · ${mond.zeichen.name} · ${thunTypLabel(mond.thunTyp)}`}
              >
                <span className="md-tag-num">{datum.getDate()}</span>
                <span className="md-tag-wt">{WT_LANG[datum.getDay()].slice(0, 2)}</span>
                <span className="md-tag-zeichen zodiak-glyph">{mond.zeichen.symbol + VS_TEXT}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
