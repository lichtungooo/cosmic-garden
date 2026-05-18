import { useMemo, useRef, useState } from 'react';
import { mondTag, thunTypFarbe, thunTypLabel, phaseLabel } from '../lib/moon';
import { tagesHimmel, formatZeit, findPhaseAtDay, phaseEventLabel } from '../lib/himmel';
import { useStandort } from '../lib/standort';
import { useSwipe } from '../lib/useSwipe';
import { useWetter, findeWetterFuerDatum, klasse as wetterKlasse, klasseLabel as wetterKlasseLabel, giessenEmpfohlen } from '../lib/wetter';
import type { Pflanze, Gartenarbeit } from '../lib/pflanzen';
import { MondSymbol } from '../components/MondSymbol';
import { WetterSymbol } from '../components/WetterSymbol';
import { TagView } from './TagView';
import { WocheView } from './WocheView';
import { JahreskreisView } from './JahreskreisView';
import { MayaView } from './MayaView';
import { StandortMenu } from '../components/StandortMenu';
import type { Ort } from '../lib/standort';

type Ansicht = 'tag' | 'woche' | 'monat' | 'jahr' | 'maya';

const MONATE = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

interface Props {
  datum: Date;
  setDatum: (d: Date) => void;
  ort: Ort;
  onOrt: (o: Ort) => void;
  onPflanze: (p: Pflanze) => void;
  onArbeit: (a: Gartenarbeit) => void;
}

export function KalenderView({ datum, setDatum, ort, onOrt, onPflanze, onArbeit }: Props) {
  const [ansicht, setAnsicht] = useState<Ansicht>('monat');
  const wrapRef = useRef<HTMLDivElement>(null);

  function navigate(delta: number) {
    const d = new Date(datum);
    if (ansicht === 'tag') d.setDate(d.getDate() + delta);
    if (ansicht === 'woche') d.setDate(d.getDate() + delta * 7);
    if (ansicht === 'monat') d.setMonth(d.getMonth() + delta);
    if (ansicht === 'jahr') d.setFullYear(d.getFullYear() + delta);
    if (ansicht === 'maya') d.setDate(d.getDate() + delta);
    setDatum(d);
  }

  useSwipe(wrapRef, {
    onLeft: () => navigate(1),
    onRight: () => navigate(-1),
  });

  const titel = useMemo(() => {
    if (ansicht === 'tag')   return `${datum.getDate()}. ${MONATE[datum.getMonth()]} ${datum.getFullYear()}`;
    if (ansicht === 'maya')  return `${datum.getDate()}. ${MONATE[datum.getMonth()]} ${datum.getFullYear()}`;
    if (ansicht === 'monat') return `${MONATE[datum.getMonth()]} ${datum.getFullYear()}`;
    if (ansicht === 'jahr')  return `Jahreskreis ${datum.getFullYear()}`;
    const start = startDerWoche(datum);
    const ende = new Date(start);
    ende.setDate(start.getDate() + 6);
    return `KW ${kalenderwoche(start)} · ${start.getDate()}.${(start.getMonth() + 1).toString().padStart(2, '0')} – ${ende.getDate()}.${(ende.getMonth() + 1).toString().padStart(2, '0')}.${ende.getFullYear()}`;
  }, [ansicht, datum]);

  return (
    <div className="kalender-view" ref={wrapRef}>
      <div className="kalender-toolbar">
        <div className="kalender-toolbar-links">
          <div className="switch-group">
            {(['tag', 'woche', 'monat', 'jahr', 'maya'] as Ansicht[]).map(a => (
              <button
                key={a}
                className={`switch ${ansicht === a ? 'switch-active' : ''}`}
                onClick={() => setAnsicht(a)}
              >
                {a === 'tag' ? 'Tag' : a === 'woche' ? 'Woche' : a === 'monat' ? 'Monat' : a === 'jahr' ? 'Jahr' : 'Maya'}
              </button>
            ))}
          </div>
          <span className="tab-trenner" aria-hidden="true" />
          <button
            className={`heute-knopf-toolbar ${new Date().toDateString() === datum.toDateString() ? 'aktiv' : ''}`}
            onClick={() => setDatum(new Date())}
            title="Zum heutigen Datum"
          >
            Heute
          </button>
        </div>
        <div className="nav-group">
          <button onClick={() => navigate(-1)} className="nav-btn">‹</button>
          <h2 className="kalender-titel">{titel}</h2>
          <button onClick={() => navigate(1)} className="nav-btn">›</button>
        </div>
        <div className="kalender-toolbar-rechts">
          <StandortMenu ort={ort} onChange={onOrt} />
        </div>
      </div>

      {ansicht === 'tag' && (
        <TagView
          datum={datum}
          onPflanze={onPflanze}
          onArbeit={onArbeit}
        />
      )}
      {ansicht === 'woche' && (
        <WocheView
          start={datum}
          onTag={d => { setDatum(d); setAnsicht('tag'); }}
          onPflanze={onPflanze}
          onArbeit={onArbeit}
        />
      )}
      {ansicht === 'monat' && (
        <MonatsAnsicht
          datum={datum}
          onTag={d => { setDatum(d); setAnsicht('tag'); }}
        />
      )}
      {ansicht === 'jahr' && (
        <JahreskreisView datum={datum} onDatum={setDatum} />
      )}
      {ansicht === 'maya' && (
        <MayaView
          datum={datum}
          setDatum={setDatum}
        />
      )}
    </div>
  );
}

function startDerWoche(d: Date): Date {
  const result = new Date(d);
  const offset = (d.getDay() + 6) % 7;
  result.setDate(d.getDate() - offset);
  return result;
}

function kalenderwoche(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

interface MonatsAnsichtProps {
  datum: Date;
  onTag: (d: Date) => void;
}

function MonatsAnsicht({ datum, onTag }: MonatsAnsichtProps) {
  const ort = useStandort();
  const wetter = useWetter(ort);
  const jahr = datum.getFullYear();
  const monat = datum.getMonth();
  const [hoverTag, setHoverTag] = useState<number | null>(null);
  const heuteKey = new Date().toISOString().slice(0, 10);
  const [giessBannerOffen, setGiessBannerOffen] = useState(() => {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem('garten.banner-giessen-versteckt') !== heuteKey;
  });

  const tage = useMemo(() => buildMonthDays(jahr, monat, ort), [jahr, monat, ort]);
  const giessen = useMemo(() => giessenEmpfohlen(wetter), [wetter]);

  function bannerSchliessen() {
    try { localStorage.setItem('garten.banner-giessen-versteckt', heuteKey); } catch { /* leise */ }
    setGiessBannerOffen(false);
  }

  return (
    <div className="monat-kompakt">
      {giessen && giessBannerOffen && (
        <div className="giess-banner">
          <span>Trockenheit der letzten Tage — Giessen vor Sonnenaufgang oder am spaeten Abend hilft.</span>
          <button
            className="giess-banner-schliessen"
            onClick={bannerSchliessen}
            aria-label="Hinweis schliessen"
            title="Heute nicht mehr zeigen"
          >×</button>
        </div>
      )}
      <div className="monat-headers">
        {WOCHENTAGE.map(w => <div key={w} className="monat-header">{w}</div>)}
      </div>
      <div className="monat-tage">
        {(() => {
          const totalRows = tage.length / 7;
          return tage.map((t, i) => {
            if (!t.day) return <div key={i} className="monat-zelle leer" />;
            const tagDatum = new Date(jahr, monat, t.day);
            const w = findeWetterFuerDatum(wetter, tagDatum);
            const k = w ? wetterKlasse(w.wettercode) : null;
            const istVollOderNeu = t.phaseEvent && (t.phaseEventKey === 'vollmond' || t.phaseEventKey === 'neumond');
            const reihe = Math.floor(i / 7);
            const tooltipOben = reihe >= totalRows - 2;
            return (
            <div
              key={i}
              className={`monat-zelle ${t.isToday ? 'heute' : ''} ${t.knoten ? 'knoten' : ''} ${istVollOderNeu ? 'phase-highlight' : ''} ${tooltipOben ? 'tooltip-oben' : ''}`}
              style={{ ['--thun-color' as string]: t.color! }}
              onClick={() => onTag(tagDatum)}
              onMouseEnter={() => setHoverTag(t.day!)}
              onMouseLeave={() => setHoverTag(null)}
            >
              <div className="zelle-oben">
                <span className="zelle-tag">{t.day}</span>
                {istVollOderNeu ? (
                  <span className="zelle-mond-gross" title={`${t.phaseEventLabel} ${t.phaseEventZeit}`}>
                    <MondSymbol illumination={t.illumination!} waxing={t.waxing!} size={22} />
                  </span>
                ) : (
                  <span className="zelle-mond" title={t.phaseLabelText!}>
                    <MondSymbol illumination={t.illumination!} waxing={t.waxing!} size={11} />
                  </span>
                )}
              </div>
              <div className="zelle-mitte">
                <span className={`zelle-zeichen ${t.zeichenWechsel ? 'wechsel' : ''}`}>
                  {t.zeichenSymbol}
                </span>
                {istVollOderNeu && t.phaseEventZeit && (
                  <span className="zelle-phase-zeit">{t.phaseEventZeit}</span>
                )}
              </div>
              <div className="zelle-unten">
                <span className="zelle-sonne" title={`Sonne ${t.sonneAuf} – ${t.sonneUnter} · hoechster Stand ${t.sonneHoch}`}>
                  {t.sonneAuf}<span className="dot">·</span>{t.sonneUnter}
                </span>
                {k && (
                  <span className="zelle-wetter" title={`${wetterKlasseLabel(k)} · ${w!.niederschlagMm.toFixed(1)} mm · ${Math.round(w!.tMin)}-${Math.round(w!.tMax)}°C`}>
                    <WetterSymbol klasse={k} size={12} />
                  </span>
                )}
              </div>
              {hoverTag === t.day && (
                <div className="zelle-tooltip">
                  <div className="tt-titel">{t.day}. {MONATE[monat]} · {t.zeichenSymbol} {t.zeichenName}</div>
                  <div className="tt-thun" style={{ background: t.color! }}>{thunTypLabel(t.thunTypFull!)}</div>
                  <div className="tt-zeile"><span>Mond</span><span>{t.phaseLabelText} · {Math.round(t.illumination! * 100)}%</span></div>
                  {t.phaseEvent && (
                    <div className="tt-zeile tt-event"><span>{t.phaseEventLabel}</span><span>{t.phaseEventZeit}</span></div>
                  )}
                  <div className="tt-zeile"><span>Sonne</span><span>{t.sonneAuf} → {t.sonneHoch} → {t.sonneUnter}</span></div>
                  <div className="tt-zeile"><span>Tageslaenge</span><span>{t.tagesLaenge}</span></div>
                  <div className="tt-zeile"><span>Mondbahn</span><span>{t.mondAuf} → {t.mondUnter}</span></div>
                  <div className="tt-zeile"><span>Bahn</span><span>{t.aufstieg}</span></div>
                  {w && k && (
                    <div className="tt-zeile"><span>Wetter</span><span>{wetterKlasseLabel(k)} · {w.niederschlagMm.toFixed(1)} mm</span></div>
                  )}
                  {t.knoten && <div className="tt-zeile tt-warn">Mondknoten</div>}
                </div>
              )}
            </div>
            );
          });
        })()}
      </div>
      <div className="monat-legende">
        <div className="legende-zeile">
          {(['wurzel', 'blatt', 'bluete', 'frucht'] as const).map(t => (
            <span key={t} className="legende-item">
              <span className="legende-punkt" style={{ background: thunTypFarbe(t) }} />
              {thunTypLabel(t)}
            </span>
          ))}
          <span className="legende-item">∅ Mondknoten</span>
          <span className="legende-item">★ Phasenwechsel</span>
        </div>
      </div>
    </div>
  );
}

interface MonatZelle {
  day: number | null;
  color: string | null;
  thunTypFull: 'wurzel' | 'blatt' | 'bluete' | 'frucht' | null;
  zeichenSymbol: string | null;
  zeichenName: string | null;
  zeichenWechsel: boolean;
  illumination: number | null;
  waxing: boolean | null;
  phaseLabelText: string | null;
  knoten: boolean;
  isToday: boolean;
  aufstieg: string | null;
  phaseEvent: boolean;
  phaseEventKey: string | null;
  phaseEventLabel: string | null;
  phaseEventZeit: string | null;
  sonneAuf: string | null;
  sonneUnter: string | null;
  sonneHoch: string | null;
  tagesLaenge: string | null;
  mondAuf: string | null;
  mondUnter: string | null;
}

function buildMonthDays(jahr: number, monat: number, ort: { lat: number; lon: number; name: string }): MonatZelle[] {
  const heute = new Date();
  const first = new Date(jahr, monat, 1);
  const dayOfWeek = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(jahr, monat + 1, 0).getDate();

  const empty: MonatZelle = {
    day: null, color: null, thunTypFull: null, zeichenSymbol: null, zeichenName: null, zeichenWechsel: false,
    illumination: null, waxing: null, phaseLabelText: null, knoten: false, isToday: false,
    aufstieg: null, phaseEvent: false, phaseEventKey: null, phaseEventLabel: null, phaseEventZeit: null,
    sonneAuf: null, sonneUnter: null, sonneHoch: null, tagesLaenge: null,
    mondAuf: null, mondUnter: null,
  };
  const cells: MonatZelle[] = [];
  for (let i = 0; i < dayOfWeek; i++) cells.push(empty);

  let letztesZeichen: string | null = null;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(jahr, monat, d);
    const m = mondTag(date);
    const h = tagesHimmel(date, ort);
    const evt = findPhaseAtDay(date);
    const wechsel = letztesZeichen !== null && letztesZeichen !== m.zeichen.name;
    letztesZeichen = m.zeichen.name;
    const tlMin = h.tagesLaengeMin;
    const tlH = tlMin != null ? Math.floor(tlMin / 60) : null;
    const tlM = tlMin != null ? tlMin % 60 : null;
    cells.push({
      day: d,
      color: thunTypFarbe(m.thunTyp),
      thunTypFull: m.thunTyp,
      zeichenSymbol: m.zeichen.symbol,
      zeichenName: m.zeichen.name,
      zeichenWechsel: wechsel,
      illumination: m.illumination,
      waxing: m.waxing,
      phaseLabelText: phaseLabel(m.phase),
      knoten: m.knotenTag,
      isToday: date.toDateString() === heute.toDateString(),
      aufstieg: m.aufstieg,
      phaseEvent: !!evt,
      phaseEventKey: evt ? evt.event : null,
      phaseEventLabel: evt ? phaseEventLabel(evt.event) : null,
      phaseEventZeit: evt ? formatZeit(evt.zeit) : null,
      sonneAuf: formatZeit(h.sonnenaufgang),
      sonneUnter: formatZeit(h.sonnenuntergang),
      sonneHoch: formatZeit(h.sonnenHoechststand),
      tagesLaenge: tlH != null ? `${tlH} h ${(tlM ?? 0).toString().padStart(2, '0')} min` : '—',
      mondAuf: formatZeit(h.mondaufgang),
      mondUnter: formatZeit(h.monduntergang),
    });
  }
  while (cells.length % 7 !== 0) cells.push(empty);
  return cells;
}
