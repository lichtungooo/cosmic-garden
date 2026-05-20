import { useMemo } from 'react';
import { mondTag, thunTypFarbe, thunTypLabel, phaseLabel } from '../lib/moon';
import { tagesHimmel, formatZeit, findPhaseAtDay, phaseEventLabel } from '../lib/himmel';
import { useStandort } from '../lib/standort';
import { pflanzenZurVorzucht, pflanzenZumAuspflanzen, pflanzenZurErnte, arbeitenImMonat, type Pflanze, type Gartenarbeit } from '../lib/pflanzen';
import { MondSymbol, SonneSymbol } from './MondSymbol';

const WT_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const WT_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONATE_KURZ = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

interface Props {
  datum: Date;
  fokus: boolean;
  istHeute: boolean;
  onClick?: () => void;
  onPflanze: (p: Pflanze) => void;
  onArbeit: (a: Gartenarbeit) => void;
  variante: 'woche' | 'tag';
}

export function TagSpalte({ datum, fokus, istHeute, onClick, onPflanze, onArbeit, variante }: Props) {
  const ort = useStandort();
  const mond = useMemo(() => mondTag(datum), [datum]);
  const himmel = useMemo(() => tagesHimmel(datum, ort), [datum, ort]);
  const phaseEvent = useMemo(() => findPhaseAtDay(datum), [datum]);

  const monat = datum.getMonth() + 1;
  const tag = datum.getDate();
  const vorzucht = useMemo(() => pflanzenZurVorzucht(monat, tag), [monat, tag]);
  const auspflanzen = useMemo(() => pflanzenZumAuspflanzen(monat, tag), [monat, tag]);
  const ernte = useMemo(() => pflanzenZurErnte(monat, tag), [monat, tag]);
  const arbeiten = useMemo(() => arbeitenImMonat(monat).sort((a, b) => {
    const aMatch = a.thunEmpfehlung === mond.thunTyp ? 0 : 1;
    const bMatch = b.thunEmpfehlung === mond.thunTyp ? 0 : 1;
    return aMatch - bMatch;
  }), [monat, mond.thunTyp]);

  const farbe = thunTypFarbe(mond.thunTyp);
  const wtLabel = variante === 'tag' ? WT_LANG[datum.getDay()] : WT_KURZ[datum.getDay()];

  return (
    <article
      className={`tag-spalte ${fokus ? 'fokus' : ''} ${istHeute ? 'heute' : ''} ${variante === 'tag' ? 'breit' : ''}`}
      onClick={onClick}
    >
      <header className="spalte-kopf">
        <div className="kopf-zeile">
          <span className="kopf-wt">{wtLabel}</span>
          <span className="kopf-datum">{tag}. {MONATE_KURZ[datum.getMonth()]}</span>
        </div>
        <div className="kopf-marker">
          <span className="kopf-zeichen" title={`${mond.zeichen.name} (${thunTypLabel(mond.thunTyp)})`}>
            {mond.zeichen.symbol + String.fromCharCode(0xFE0E)}
          </span>
          <span className="kopf-mond" title={`${phaseLabel(mond.phase)} · ${Math.round(mond.illumination * 100)}%`}>
            <MondSymbol illumination={mond.illumination} waxing={mond.waxing} size={14} />
          </span>
          {mond.knotenTag && <span className="kopf-warn" title="Mondknoten">∅</span>}
        </div>
        <div className="kopf-thun" style={{ background: farbe }}>{thunTypLabel(mond.thunTyp)}</div>
        {phaseEvent && (
          <div className="kopf-phase-event">
            {phaseEventLabel(phaseEvent.event)} {formatZeit(phaseEvent.zeit)}
          </div>
        )}
      </header>

      <div className="spalte-himmel">
        <div className="himmel-row" title={`Sonnenaufgang ${formatZeit(himmel.sonnenaufgang)} · Untergang ${formatZeit(himmel.sonnenuntergang)}`}>
          <SonneSymbol size={12} />
          <span>{formatZeit(himmel.sonnenaufgang)}</span>
          <span className="himmel-pfeil">→</span>
          <span>{formatZeit(himmel.sonnenuntergang)}</span>
        </div>
        <div className="himmel-row" title={`Mondaufgang ${formatZeit(himmel.mondaufgang)} · Untergang ${formatZeit(himmel.monduntergang)}`}>
          <MondSymbol illumination={mond.illumination} waxing={mond.waxing} size={12} />
          <span>{formatZeit(himmel.mondaufgang)}</span>
          <span className="himmel-pfeil">→</span>
          <span>{formatZeit(himmel.monduntergang)}</span>
        </div>
      </div>

      <div className="spalte-body">
        {vorzucht.length > 0 && (
          <Block titel="Vorzucht" farbe="#7a4d2b" pflanzen={vorzucht} onPflanze={onPflanze} />
        )}
        {auspflanzen.length > 0 && (
          <Block titel="Saat / Auspflanzen" farbe="#4a7c3a" pflanzen={auspflanzen} onPflanze={onPflanze} />
        )}
        {ernte.length > 0 && (
          <Block titel="Ernte" farbe="#a8423a" pflanzen={ernte} onPflanze={onPflanze} />
        )}
        {arbeiten.length > 0 && (
          <div className="spalte-block">
            <h5 className="spalte-h5" style={{ color: '#5b3a8a' }}>Arbeiten ({arbeiten.length})</h5>
            <ul className="spalte-arbeiten">
              {arbeiten.map(a => {
                const passend = a.thunEmpfehlung === mond.thunTyp;
                return (
                  <li
                    key={a.id}
                    className={passend ? 'passend' : ''}
                    onClick={e => { e.stopPropagation(); onArbeit(a); }}
                    title={a.tipps}
                  >
                    <span className="punkt" style={{ background: thunTypFarbe(a.thunEmpfehlung) }} />
                    <span>{a.name}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {vorzucht.length === 0 && auspflanzen.length === 0 && ernte.length === 0 && arbeiten.length === 0 && (
          <p className="spalte-leer">Ruhetag.</p>
        )}
      </div>
    </article>
  );
}

function Block({ titel, farbe, pflanzen, onPflanze }: {
  titel: string;
  farbe: string;
  pflanzen: Pflanze[];
  onPflanze: (p: Pflanze) => void;
}) {
  return (
    <div className="spalte-block">
      <h5 className="spalte-h5" style={{ color: farbe }}>{titel} ({pflanzen.length})</h5>
      <ul className="spalte-pflanzen">
        {pflanzen.map(p => (
          <li
            key={p.id}
            onClick={e => { e.stopPropagation(); onPflanze(p); }}
            style={{ borderLeftColor: farbe }}
          >
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
