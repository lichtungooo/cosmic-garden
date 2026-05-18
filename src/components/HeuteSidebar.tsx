import { useMemo } from 'react';
import { mondTag, thunTypFarbe, thunTypLabel, phaseLabel, type ThunTyp, type MondPhase } from '../lib/moon';
import { tagesHimmel, formatZeit, formatDauer, findPhaseAtDay, phaseEventLabel } from '../lib/himmel';
import { useStandort } from '../lib/standort';
import { mayaDatum } from '../lib/maya';
import { MondSymbol } from './MondSymbol';
import { InfoIcon } from './InfoIcon';
import { useTagebuch, eintraegeFuerTag, artFarbe, artLabel } from '../lib/tagebuch';
import { heuteRelevanteEintraege, type AstroKontext } from '../lib/datenbank-suche';
import { useDetailNav, refAusId } from '../lib/detail-navigation';
import type { Eintrag, EintragsTyp, Jahreszeit, Mondphase } from '../lib/datenbank';

const VS_TEXT = String.fromCharCode(0xFE0E);
const WT_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE_LANG = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

interface Props {
  datum: Date;
  setDatum: (d: Date) => void;
}

const TYP_FARBE: Record<EintragsTyp, string> = {
  pflanze: '#4a7c3a',
  arbeit:  '#5b3a8a',
  wissen:  '#3b4b6b',
  frage:   '#c89b3a',
  antwort: '#a8423a',
};

const TYP_LABEL: Record<EintragsTyp, string> = {
  pflanze: 'Pflanze',
  arbeit:  'Arbeit',
  wissen:  'Wissen',
  frage:   'Frage',
  antwort: 'Antwort',
};

function jahreszeitFuer(monat: number): Jahreszeit {
  if (monat >= 3 && monat <= 5) return 'fruehling';
  if (monat >= 6 && monat <= 8) return 'sommer';
  if (monat >= 9 && monat <= 11) return 'herbst';
  return 'winter';
}

function mondphaseFuerKontext(p: MondPhase): Mondphase | undefined {
  // moon.ts hat 6 Phasen — wir mappen auf die 4 des Datenbank-Schemas
  if (p === 'neumond') return 'neumond';
  if (p === 'vollmond') return 'vollmond';
  if (p === 'zunehmend' || p === 'halbmond-zu') return 'zunehmend';
  if (p === 'abnehmend' || p === 'halbmond-ab') return 'abnehmend';
  return undefined;
}

function tagestypEmpfehlung(typ: ThunTyp): string {
  return {
    wurzel: 'Wurzelgemuese saeen, ernten, lagern. Boden lockern.',
    blatt:  'Blattgemuese, Kraeuter. Giessen wirkt heute besonders.',
    bluete: 'Bluetenpflanzen, Brokkoli, Heilkraeuter, Bienen besuchen.',
    frucht: 'Tomate, Bohne, Kuerbis. Auch Veredelung an Obstbaeumen.',
  }[typ];
}

export function HeuteSidebar({ datum, setDatum }: Props) {
  const ort = useStandort();
  const mond = useMemo(() => mondTag(datum), [datum]);
  const himmel = useMemo(() => tagesHimmel(datum, ort), [datum, ort]);
  const phaseEvent = useMemo(() => findPhaseAtDay(datum), [datum]);
  const maya = useMemo(() => mayaDatum(datum), [datum]);
  const { eintraege } = useTagebuch();
  const tagebuchHeute = useMemo(() => eintraegeFuerTag(eintraege, datum), [eintraege, datum]);
  const detailNav = useDetailNav();

  const heute = new Date();
  const istHeute = heute.toDateString() === datum.toDateString();
  const farbe = thunTypFarbe(mond.thunTyp);
  const zeichenId = mond.zeichen.name.toLowerCase();

  const passend = useMemo(() => {
    const kontext: AstroKontext = {
      monat: datum.getMonth() + 1,
      tagestyp: mond.thunTyp,
      jahreszeit: jahreszeitFuer(datum.getMonth() + 1),
      mondphase: mondphaseFuerKontext(mond.phase),
    };
    return heuteRelevanteEintraege(kontext, 3).slice(0, 8);
  }, [datum, mond.thunTyp, mond.phase]);

  function nav(delta: number) {
    const d = new Date(datum);
    d.setDate(d.getDate() + delta);
    setDatum(d);
  }

  return (
    <aside className="heute-sidebar">
      <header className="heute-kopf">
        <div className="heute-wt">{WT_LANG[datum.getDay()]}</div>
        <div className="heute-datum">{datum.getDate()}. {MONATE_LANG[datum.getMonth()]}</div>
        <div className="heute-jahr">{datum.getFullYear()}</div>
        {!istHeute && (
          <button className="heute-zu-heute" onClick={() => setDatum(new Date())}>Zu heute</button>
        )}
      </header>

      <section className="heute-block" style={{ borderTopColor: farbe }}>
        <header className="heute-block-kopf">
          <h3>Tagestyp</h3>
          <InfoIcon sektionId="tierkreis" eintragId={zeichenId} titel={`Mehr ueber ${mond.zeichen.name}`} />
        </header>
        <div className="heute-thun" style={{ background: farbe }}>{thunTypLabel(mond.thunTyp)}</div>
        <div className="heute-zeichen">
          <span className="zodiak-glyph heute-zeichen-symbol">{mond.zeichen.symbol + VS_TEXT}</span>
          <span>{mond.zeichen.name}</span>
        </div>
        <p className="heute-empfehlung">{tagestypEmpfehlung(mond.thunTyp)}</p>
        {mond.knotenTag && (
          <div className="heute-warn">
            ∅ Mondknoten — Pause halten
            <InfoIcon sektionId="mond" eintragId="mondknoten" titel="Mondknoten erklaert" />
          </div>
        )}
      </section>

      <section className="heute-block">
        <header className="heute-block-kopf">
          <h3>Mond</h3>
          <InfoIcon sektionId="mond" eintragId="synodischer-monat" titel="Mondphasen erklaert" />
        </header>
        <div className="heute-mond-zeile">
          <MondSymbol illumination={mond.illumination} waxing={mond.waxing} size={22} />
          <div className="heute-mond-text">
            <div>{phaseLabel(mond.phase)}</div>
            <div className="heute-meta">{Math.round(mond.illumination * 100)}% · {mond.aufstieg}</div>
          </div>
        </div>
        {phaseEvent && (
          <div className="heute-phase-event" style={{ color: 'var(--accent)' }}>
            {phaseEventLabel(phaseEvent.event)} · {formatZeit(phaseEvent.zeit)}
          </div>
        )}
        <div className="heute-meta-grid">
          <span>↑ {formatZeit(himmel.mondaufgang)}</span>
          <span>↓ {formatZeit(himmel.monduntergang)}</span>
        </div>
      </section>

      <section className="heute-block">
        <header className="heute-block-kopf">
          <h3>Sonne</h3>
          <InfoIcon sektionId="sonne" eintragId="sonnenhoechststand" titel="Sonnenhoechststand" />
        </header>
        <div className="heute-sonne-zeile">
          <span>↑ {formatZeit(himmel.sonnenaufgang)}</span>
          <span className="heute-mittag">☀ {formatZeit(himmel.sonnenHoechststand)}</span>
          <span>↓ {formatZeit(himmel.sonnenuntergang)}</span>
        </div>
        <div className="heute-meta">{formatDauer(himmel.tagesLaengeMin)} Tag</div>
      </section>

      <section className="heute-block">
        <header className="heute-block-kopf">
          <h3>Maya</h3>
          <InfoIcon sektionId="maya" eintragId="tzolkin-tiefe" titel="Tzolkin erklaert" />
        </header>
        <div className="heute-maya-zeile">
          <span className="heute-maya-tzolkin">{maya.tzolkinStr}</span>
          <span className="heute-maya-haab">{maya.haabStr}</span>
        </div>
        <div className="heute-meta mono">{maya.longCountStr}</div>
      </section>

      <section className="heute-block">
        <header className="heute-block-kopf">
          <h3>Passend heute</h3>
          <span className="heute-meta">{passend.length}</span>
        </header>
        {passend.length === 0 ? (
          <p className="heute-leer">Heute ruht das Werk.</p>
        ) : (
          <ul className="heute-passend-liste">
            {passend.map(p => {
              const ref = refAusId(p.eintrag.id);
              if (!ref) return null;
              const e: Eintrag = p.eintrag;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className="heute-passend-eintrag"
                    style={{ borderLeftColor: TYP_FARBE[e.typ] }}
                    onClick={() => detailNav.oeffne(ref)}
                  >
                    <span className="heute-passend-typ" style={{ color: TYP_FARBE[e.typ] }}>
                      {TYP_LABEL[e.typ]}
                    </span>
                    <span className="heute-passend-titel">
                      {e.symbol && <span className="zodiak-glyph">{e.symbol} </span>}
                      {e.titel}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="heute-block">
        <header className="heute-block-kopf">
          <h3>Tagebuch</h3>
          <span className="heute-meta">{tagebuchHeute.length} {tagebuchHeute.length === 1 ? 'Eintrag' : 'Eintraege'}</span>
        </header>
        {tagebuchHeute.length === 0 ? (
          <p className="heute-leer">Heute noch keine Notiz.</p>
        ) : (
          <ul className="heute-tagebuch-liste">
            {tagebuchHeute.slice(0, 3).map(e => (
              <li key={e.id} className="heute-tagebuch-eintrag" style={{ borderLeftColor: artFarbe(e.art) }}>
                <span className="heute-tagebuch-art" style={{ color: artFarbe(e.art) }}>{artLabel(e.art)}</span>
                <span className="heute-tagebuch-text">{e.text.length > 60 ? e.text.slice(0, 60) + '…' : e.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="heute-nav">
        <button className="heute-nav-btn" onClick={() => nav(-1)} title="Gestern">‹</button>
        <span className="heute-nav-label">{istHeute ? 'Heute' : 'Tag wechseln'}</span>
        <button className="heute-nav-btn" onClick={() => nav(1)} title="Morgen">›</button>
      </footer>
    </aside>
  );
}
