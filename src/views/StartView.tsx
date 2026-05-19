// Startseite — Magazin-Landingpage mit Hero, Heute-Karte, Werkzeugen, Saison-Empfehlungen, Welten.
// Klick fuehrt jeweils direkt in die Action.

import { useMemo } from 'react';
import { useStandort } from '../lib/standort';
import { mondTag, thunTypFarbe, thunTypLabel, phaseLabel } from '../lib/moon';
import { mayaDatum } from '../lib/maya';
import {
  pflanzenZumAuspflanzen,
  pflanzenZurErnte,
  pflanzenZurVorzucht,
  arbeitenImMonat,
  type Pflanze,
  type Gartenarbeit,
} from '../lib/pflanzen';
import { WELTEN, type WeltId } from '../lib/welten';
import { useDetailNav, refAusId } from '../lib/detail-navigation';
import {
  heuteRelevanteEintraege,
  type AstroKontext,
} from '../lib/datenbank-suche';
import type { Jahreszeit, Mondphase } from '../lib/datenbank';
import type { MondPhase } from '../lib/moon';

const WT_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE_LANG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

interface Werkzeug {
  id: 'kalender' | 'jahreskreis' | 'maya' | 'tagebuch';
  name: string;
  symbol: string;
  beschreibung: string;
  farbe: string;
}

const WERKZEUGE: Werkzeug[] = [
  { id: 'kalender',    name: 'Kalender',     symbol: '☷', beschreibung: 'Tag für Tag durchs Jahr. Tagestypen nach Maria Thun, Mondphasen, Sonnenzeiten, Wetter.', farbe: '#4a8a3a' },
  { id: 'jahreskreis', name: 'Jahreskreis',  symbol: '◯', beschreibung: 'Das ganze Jahr als runder Kreis. Sonnwenden, Tagundnachtgleichen, der Tierkreis von oben.', farbe: '#d4a542' },
  { id: 'maya',        name: 'Maya-Kalender',symbol: '✶', beschreibung: 'Tzolkin, Haab, Long Count — die drei Maya-Kalender, die immer noch laufen. Plus Venus.', farbe: '#c0432f' },
  { id: 'tagebuch',    name: 'Tagebuch',     symbol: '✎', beschreibung: 'Eigene Notizen, Ernten, Beobachtungen. Was du im Garten erlebst, bleibt mit dir.', farbe: '#5b3a8a' },
];

function jahreszeitFuer(monat: number): Jahreszeit {
  if (monat >= 3 && monat <= 5) return 'fruehling';
  if (monat >= 6 && monat <= 8) return 'sommer';
  if (monat >= 9 && monat <= 11) return 'herbst';
  return 'winter';
}

function mondphaseFuerKontext(p: MondPhase): Mondphase | undefined {
  if (p === 'neumond') return 'neumond';
  if (p === 'vollmond') return 'vollmond';
  if (p === 'zunehmend' || p === 'halbmond-zu') return 'zunehmend';
  if (p === 'abnehmend' || p === 'halbmond-ab') return 'abnehmend';
  return undefined;
}

function tagestypEmpfehlung(typ: ReturnType<typeof thunTypLabel> extends string ? string : string): string {
  return {
    Wurzeltag: 'Wurzelgemuese säen, ernten, lagern. Boden lockern, Kompost ausbringen.',
    Blatttag:  'Salat, Kohl, Spinat, Kraeuter. Giessen wirkt heute besonders.',
    Bluetentag:'Brokkoli, Heilkraeuter, Schnittblumen. Bienen besuchen.',
    Fruchttag: 'Tomate, Bohne, Kürbis, Obstbaeume. Veredelung an Fruchttraegern.',
  }[typ] ?? 'Heute im Garten unterwegs sein.';
}

interface Props {
  onWerkzeug: (id: 'kalender' | 'tagebuch') => void;
  onJahreskreis: () => void;
  onMaya: () => void;
  onWelt: (id: WeltId) => void;
  onTag: () => void;
}

export function StartView({ onWerkzeug, onJahreskreis, onMaya, onWelt, onTag }: Props) {
  const ort = useStandort();
  const heute = new Date();
  const nav = useDetailNav();
  const mond = useMemo(() => mondTag(heute), []);
  const maya = useMemo(() => mayaDatum(heute), []);

  const monat = heute.getMonth() + 1;
  const tag = heute.getDate();

  const auspflanzen = useMemo(() => pflanzenZumAuspflanzen(monat, tag).slice(0, 6), [monat, tag]);
  const ernte = useMemo(() => pflanzenZurErnte(monat, tag).slice(0, 6), [monat, tag]);
  const vorzucht = useMemo(() => pflanzenZurVorzucht(monat, tag).slice(0, 4), [monat, tag]);
  const arbeiten = useMemo(() => arbeitenImMonat(monat).filter(a => a.thunEmpfehlung === mond.thunTyp).slice(0, 4), [monat, mond.thunTyp]);

  const wissensEmpfehlung = useMemo(() => {
    const kontext: AstroKontext = {
      monat,
      tagestyp: mond.thunTyp,
      jahreszeit: jahreszeitFuer(monat),
      mondphase: mondphaseFuerKontext(mond.phase),
    };
    return heuteRelevanteEintraege(kontext, 4)
      .filter(t => t.eintrag.typ === 'wissen')
      .slice(0, 3);
  }, [monat, mond.thunTyp, mond.phase]);

  const tagestypFarbe = thunTypFarbe(mond.thunTyp);
  const tagestypName = thunTypLabel(mond.thunTyp);

  function oeffnePflanze(p: Pflanze) {
    nav.oeffne({ kind: 'pflanze', id: p.id });
  }
  function oeffneArbeit(a: Gartenarbeit) {
    nav.oeffne({ kind: 'arbeit', id: a.id });
  }
  function oeffneWissen(id: string) {
    const ref = refAusId(id);
    if (ref) nav.oeffne(ref);
  }

  return (
    <div className="start-view">
      <header className="start-hero">
        <p className="start-hero-eyebrow">Garten im Rhythmus von Sonne, Mond und Sternen</p>
        <h1 className="start-hero-titel">Mein kosmischer Garten</h1>
        <p className="start-hero-lead">
          Was heute waechst, was heute zu tun ist, was heute am Himmel steht — verbunden in einem Werk.
          87 Pflanzen, 22 Arbeiten, 89 Wissens-Einträge. Maria Thun, Maya-Kalender, samenfeste Sorten,
          Gemeinschaft. Ein Werkzeug für den, der wissen will, was die Erde traegt.
        </p>
      </header>

      <section className="start-heute" style={{ borderTopColor: tagestypFarbe }}>
        <div className="start-heute-meta">
          <span className="start-heute-datum">{WT_LANG[heute.getDay()]}, {heute.getDate()}. {MONATE_LANG[heute.getMonth()]}</span>
          <span className="start-heute-ort">{ort.name}</span>
        </div>
        <div className="start-heute-grid">
          <button className="start-heute-card start-heute-haupt" onClick={onTag} style={{ ['--karte-farbe' as string]: tagestypFarbe }}>
            <span className="start-heute-label">Heute</span>
            <span className="start-heute-tagestyp">{tagestypName}</span>
            <span className="start-heute-zeichen">
              <span className="zodiak-glyph">{mond.zeichen.symbol}</span> {mond.zeichen.name}
            </span>
            <p className="start-heute-empfehlung">{tagestypEmpfehlung(tagestypName)}</p>
            <span className="start-heute-link">Zur Tag-Ansicht →</span>
          </button>
          <div className="start-heute-neben">
            <div className="start-heute-kachel">
              <span className="start-heute-kachel-label">Mond</span>
              <span className="start-heute-kachel-wert">{phaseLabel(mond.phase)}</span>
              <span className="start-heute-kachel-sub">{Math.round(mond.illumination * 100)}% · {mond.aufstieg}</span>
            </div>
            <div className="start-heute-kachel">
              <span className="start-heute-kachel-label">Maya</span>
              <span className="start-heute-kachel-wert">{maya.tzolkinStr}</span>
              <span className="start-heute-kachel-sub">{maya.haabStr}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="start-werkzeuge">
        <h2 className="start-section-titel">Werkzeuge</h2>
        <div className="start-werkzeuge-grid">
          {WERKZEUGE.map(w => (
            <button
              key={w.id}
              className="start-werkzeug-karte"
              style={{ ['--karte-farbe' as string]: w.farbe }}
              onClick={() => {
                if (w.id === 'kalender' || w.id === 'tagebuch') onWerkzeug(w.id);
                else if (w.id === 'jahreskreis') onJahreskreis();
                else if (w.id === 'maya') onMaya();
              }}
            >
              <span className="start-werkzeug-symbol">{w.symbol}</span>
              <span className="start-werkzeug-name">{w.name}</span>
              <p className="start-werkzeug-beschreibung">{w.beschreibung}</p>
            </button>
          ))}
        </div>
      </section>

      {(auspflanzen.length > 0 || ernte.length > 0 || vorzucht.length > 0 || arbeiten.length > 0) && (
        <section className="start-saison">
          <h2 className="start-section-titel">Diese Tage besonders</h2>
          <div className="start-saison-grid">
            {auspflanzen.length > 0 && (
              <div className="start-saison-block">
                <h3>Jetzt aussäen / auspflanzen</h3>
                <ul className="start-saison-liste">
                  {auspflanzen.map(p => (
                    <li key={p.id}>
                      <button onClick={() => oeffnePflanze(p)}>
                        <span className="start-saison-name">{p.name}</span>
                        <span className="start-saison-sub">{p.familie}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ernte.length > 0 && (
              <div className="start-saison-block">
                <h3>Jetzt ernten</h3>
                <ul className="start-saison-liste">
                  {ernte.map(p => (
                    <li key={p.id}>
                      <button onClick={() => oeffnePflanze(p)}>
                        <span className="start-saison-name">{p.name}</span>
                        <span className="start-saison-sub">{p.familie}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {vorzucht.length > 0 && (
              <div className="start-saison-block">
                <h3>Vorzucht im Haus</h3>
                <ul className="start-saison-liste">
                  {vorzucht.map(p => (
                    <li key={p.id}>
                      <button onClick={() => oeffnePflanze(p)}>
                        <span className="start-saison-name">{p.name}</span>
                        <span className="start-saison-sub">{p.familie}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {arbeiten.length > 0 && (
              <div className="start-saison-block">
                <h3>Heute passende Arbeiten</h3>
                <ul className="start-saison-liste">
                  {arbeiten.map(a => (
                    <li key={a.id}>
                      <button onClick={() => oeffneArbeit(a)}>
                        <span className="start-saison-name">{a.name}</span>
                        <span className="start-saison-sub">{a.kategorie}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {wissensEmpfehlung.length > 0 && (
        <section className="start-wissen">
          <h2 className="start-section-titel">Heute lesenswert</h2>
          <div className="start-wissen-grid">
            {wissensEmpfehlung.map(t => (
              <button key={t.eintrag.id} className="start-wissen-karte" onClick={() => oeffneWissen(t.eintrag.id)}>
                <span className="start-wissen-bildplatz">
                  {t.eintrag.symbol && <span className="zodiak-glyph">{t.eintrag.symbol}</span>}
                </span>
                <div className="start-wissen-text">
                  <h3>{t.eintrag.titel}</h3>
                  {t.eintrag.untertitel && <p className="start-wissen-untertitel">{t.eintrag.untertitel}</p>}
                  <p className="start-wissen-kurz">{t.eintrag.kurz}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="start-welten">
        <h2 className="start-section-titel">Die fuenf Welten</h2>
        <div className="start-welten-grid">
          {WELTEN.map(w => (
            <button
              key={w.id}
              className="start-welt-karte"
              style={{ ['--welt-farbe' as string]: w.farbe }}
              onClick={() => onWelt(w.id)}
            >
              <span className="start-welt-symbol">{w.symbol}</span>
              <span className="start-welt-name">{w.name}</span>
              <p className="start-welt-kurz">{w.kurz}</p>
            </button>
          ))}
        </div>
      </section>

      <footer className="start-fuss">
        <p>Mein kosmischer Garten · Werkzeug für zyklisches Gaertnern · {heute.getFullYear()}</p>
      </footer>
    </div>
  );
}
