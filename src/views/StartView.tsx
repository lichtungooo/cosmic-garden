// Startseite — Magazin-Landingpage mit Hero, Heute-Karte, Werkzeugen, Saison-Empfehlungen, Welten.
// Klick fuehrt jeweils direkt in die Action.

import { useMemo } from 'react';
import { useStandort } from '../lib/standort';
import { mondTag, thunTypFarbe, thunTypLabel, phaseLabel } from '../lib/moon';
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
import { useWetter, findeWetterFuerDatum, klasse as wetterKlasse, klasseLabel as wetterKlasseLabel } from '../lib/wetter';
import { WetterSymbol } from '../components/WetterSymbol';
import { tagesHimmel, formatZeit } from '../lib/himmel';

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

interface TagestypHinweis {
  kurz: string;
  punkte: string[];
}

const TAGESTYP_HINWEISE: Record<string, TagestypHinweis> = {
  Wurzeltag: {
    kurz: 'Heute steht die Wurzel im Mittelpunkt — alles, was unter der Erde wächst und reift, profitiert von den Kräften des Tages.',
    punkte: [
      'Möhre, Rote Bete, Pastinake, Schwarzwurzel, Kartoffel, Zwiebel, Knoblauch — säen, pflanzen, ernten.',
      'Boden lockern, hacken, harken — die Erde atmet jetzt am tiefsten.',
      'Kompost ausbringen, mit Steinmehl aufdüngen, Mulch nachlegen.',
      'Wurzelgemüse einlagern — heute geerntete Knollen halten am längsten.',
    ],
  },
  Blatttag: {
    kurz: 'Heute zieht das Wasser in das Blatt — alles Grün, was als Salat, Kohl oder Kraut wachsen soll, hat seinen besten Tag.',
    punkte: [
      'Kopfsalat, Pflücksalat, Spinat, Mangold, Kohl, Petersilie, Schnittlauch — säen und auspflanzen.',
      'Gießen wirkt heute am stärksten — Beete einmal gründlich durchwässern.',
      'Brennnessel- oder Beinwell-Jauche ansetzen, Kräuter pflanzen.',
      'Blätter und Salate ernten für den Sofort-Verzehr (verlieren rasch an Frische).',
    ],
  },
  Blütentag: {
    kurz: 'Heute zeigt der Tierkreis das Licht-Element — alle blühenden Pflanzen, Schnittblumen und Heilkräuter sind in ihrem Element.',
    punkte: [
      'Brokkoli, Blumenkohl, Sonnenblume, Tagetes, Ringelblume, Kapuzinerkresse — säen und pflanzen.',
      'Heilkräuter ernten (Kamille, Lavendel, Schafgarbe) — das ätherische Öl ist am Mittag am stärksten.',
      'Bienenweiden besuchen, Schnittblumen für die Vase schneiden.',
      'Veredeln und okulieren an Rosen — Blütentag günstig für Rosen-Arbeiten.',
    ],
  },
  Fruchttag: {
    kurz: 'Heute trägt das Feuer-Element — alles Frucht-bildende profitiert: Tomate, Bohne, Kürbis und alle Obstbäume.',
    punkte: [
      'Tomate, Paprika, Aubergine, Gurke, Zucchini, Kürbis, Bohne, Erbse, Mais — säen und auspflanzen.',
      'Obstbäume pflanzen, veredeln, schneiden — Wundheilung verläuft heute am ruhigsten.',
      'Beerensträucher pflegen, Erdbeer-Ableger setzen.',
      'Tomaten ausgeizen, Tomaten- und Kürbisbeete mulchen.',
    ],
  },
};

function hinweisFuerTag(typ: string): TagestypHinweis {
  return TAGESTYP_HINWEISE[typ] ?? { kurz: 'Heute im Garten unterwegs sein.', punkte: [] };
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
  const wetterDaten = useWetter(ort);
  const wetterHeute = useMemo(() => findeWetterFuerDatum(wetterDaten, heute), [wetterDaten]);
  const himmel = useMemo(() => tagesHimmel(heute, ort), [ort.lat, ort.lon]);

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

  const wetterKl = wetterHeute ? wetterKlasse(wetterHeute.wettercode) : null;

  return (
    <div className="start-view">
      <header className="start-hero">
        <h1 className="start-hero-titel">Mein kosmischer Garten</h1>
        <p className="start-hero-eyebrow">Sonne, Mond und Sterne</p>
      </header>

      <section className="start-heute" style={{ borderTopColor: tagestypFarbe }}>
        <div className="start-heute-datumzeile">
          <div className="start-heute-datum-gross">
            {WT_LANG[heute.getDay()]}, {heute.getDate()}. {MONATE_LANG[heute.getMonth()]} {heute.getFullYear()}
          </div>
          <div className="start-heute-ort-zeile">in {ort.name}</div>
        </div>
        <div className="start-heute-grid">
          <button className="start-heute-card start-heute-haupt" onClick={onTag} style={{ ['--karte-farbe' as string]: tagestypFarbe }}>
            <span className="start-heute-label">Heute am Himmel</span>
            <span className="start-heute-tagestyp">{tagestypName}</span>
            <span className="start-heute-zeichen">
              <span className="zodiak-glyph">{mond.zeichen.symbol}</span> Mond in {mond.zeichen.name}
            </span>
            <p className="start-heute-empfehlung">{hinweisFuerTag(tagestypName).kurz}</p>
            {hinweisFuerTag(tagestypName).punkte.length > 0 && (
              <ul className="start-heute-punkte">
                {hinweisFuerTag(tagestypName).punkte.map(p => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            <span className="start-heute-link">Zur Tag-Ansicht →</span>
          </button>
          <div className="start-heute-neben">
            <div className="start-heute-kachel">
              <span className="start-heute-kachel-label">Mond</span>
              <span className="start-heute-kachel-wert">{phaseLabel(mond.phase)}</span>
              <span className="start-heute-kachel-sub">{Math.round(mond.illumination * 100)}% · {mond.aufstieg}</span>
            </div>
            <div className="start-heute-kachel">
              <span className="start-heute-kachel-label">Sonne</span>
              <span className="start-heute-kachel-wert">{formatZeit(himmel.sonnenaufgang)} – {formatZeit(himmel.sonnenuntergang)}</span>
              {himmel.tagesLaengeMin != null && (
                <span className="start-heute-kachel-sub">{Math.floor(himmel.tagesLaengeMin / 60)} h {(himmel.tagesLaengeMin % 60).toString().padStart(2, '0')} min Tag</span>
              )}
            </div>
            {wetterHeute && wetterKl && (
              <div className="start-heute-kachel start-heute-wetter">
                <span className="start-heute-kachel-label">Wetter</span>
                <span className="start-heute-kachel-wert start-heute-wetter-wert">
                  <WetterSymbol klasse={wetterKl} size={20} title={wetterKlasseLabel(wetterKl)} />
                  {Math.round(wetterHeute.tMin)}° – {Math.round(wetterHeute.tMax)}°
                </span>
                <span className="start-heute-kachel-sub">
                  {wetterKlasseLabel(wetterKl)}
                  {wetterHeute.niederschlagMm > 0.5 && ` · ${wetterHeute.niederschlagMm.toFixed(1)} mm Regen`}
                </span>
              </div>
            )}
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
        <p>Mein kosmischer Garten · Werkzeug für zyklisches Gärtnern · {heute.getFullYear()}</p>
      </footer>
    </div>
  );
}
