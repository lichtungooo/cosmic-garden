// Startseite — Magazin-Landingpage mit Hero, Heute-Karte, Werkzeugen, Saison-Empfehlungen, Welten.
// Klick fuehrt jeweils direkt in die Action.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStandort } from '../lib/standort';
import { mondTag, thunTypFarbe, thunTypLabel, phaseLabel } from '../lib/moon';
import {
  pflanzen as allePflanzen,
  type Pflanze,
} from '../lib/pflanzen';
import { WELTEN, type WeltId } from '../lib/welten';
import { useDetailNav } from '../lib/detail-navigation';
import type { MondPhase } from '../lib/moon';
import { useWetter, findeWetterFuerDatum, klasse as wetterKlasse, klasseLabel as wetterKlasseLabel } from '../lib/wetter';
import { WetterSymbol } from '../components/WetterSymbol';
import { tagesHimmel, formatZeit } from '../lib/himmel';

const WT_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE_LANG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

interface Werkzeug {
  id: 'kalender' | 'jahreskreis' | 'karte' | 'gemeinschaft' | 'tagebuch' | 'mitgestalten';
  name: string;
  symbol: string;
  beschreibung: string;
  farbe: string;
  pfad: string;
}

const WERKZEUGE: Werkzeug[] = [
  { id: 'kalender',     name: 'Kalender',           symbol: '☷', pfad: '/kalender',           farbe: '#4a8a3a', beschreibung: 'Tag für Tag durchs Jahr. Tagestypen nach Maria Thun, Mondphasen, Sonnenzeiten, Wetter.' },
  { id: 'jahreskreis',  name: 'Jahreskreis',        symbol: '◯', pfad: '/kalender',           farbe: '#d4a542', beschreibung: 'Das ganze Jahr als runder Kreis. Sonnwenden, Tagundnachtgleichen, der Tierkreis von oben.' },
  { id: 'karte',        name: 'Karte',              symbol: '⌖', pfad: '/karte',              farbe: '#3b4b6b', beschreibung: 'Gärtner in der Nachbarschaft, Pins für Pflanztreffs, Gärten, Märkte. Begegnung in der realen Welt.' },
  { id: 'gemeinschaft', name: 'Gemeinschaftsgärten', symbol: '❀', pfad: '/welt/gemeinschaft',  farbe: '#d4783a', beschreibung: 'Allmende, Stadtgärten, Schulgärten. Wo Erde, Hände und Menschen zusammenkommen.' },
  { id: 'tagebuch',     name: 'Tagebuch',           symbol: '✎', pfad: '/tagebuch',           farbe: '#5b3a8a', beschreibung: 'Eigene Notizen, Ernten, Beobachtungen. Was du im Garten erlebst, bleibt mit dir.' },
  { id: 'mitgestalten', name: 'Mitgestalten',       symbol: '✚', pfad: '/wunschliste/app',    farbe: '#8b6f47', beschreibung: 'Was fehlt dir? Was würde dir den Garten leichter machen? Trag deine Ideen und Wünsche ein.' },
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
  onWelt: (id: WeltId) => void;
  onTag: () => void;
}

export function StartView({ onWelt, onTag }: Props) {
  const ort = useStandort();
  const nav = useDetailNav();
  const navigate = useNavigate();
  const [aktiverTag, setAktiverTag] = useState(() => new Date());
  const tagKey = `${aktiverTag.getFullYear()}-${aktiverTag.getMonth()}-${aktiverTag.getDate()}`;
  const istHeute = useMemo(() => {
    const j = new Date();
    return j.getFullYear() === aktiverTag.getFullYear()
      && j.getMonth() === aktiverTag.getMonth()
      && j.getDate() === aktiverTag.getDate();
  }, [tagKey]);

  function einenTagWeiter(richtung: -1 | 1) {
    const naechster = new Date(aktiverTag);
    naechster.setDate(naechster.getDate() + richtung);
    setAktiverTag(naechster);
  }
  function zuHeute() {
    setAktiverTag(new Date());
  }

  // Alle abgeleiteten Werte aus dem aktiven Tag berechnet — gleiche Logik
  // wie KalenderView/TagView, damit Startseite und Kalender immer im Gleichlauf sind.
  const mond = useMemo(() => mondTag(aktiverTag), [tagKey]);
  const wetterDaten = useWetter(ort);
  const wetterHeute = useMemo(() => findeWetterFuerDatum(wetterDaten, aktiverTag), [wetterDaten, tagKey]);
  const himmel = useMemo(() => tagesHimmel(aktiverTag, ort), [ort.lat, ort.lon, tagKey]);

  // Drei Pflanzen-Portraits passend zum heutigen Tagestyp.
  // Auswahl deterministisch nach Tag — wechselt taeglich, bleibt aber bei mehrfachem Render gleich.
  const portraits = useMemo(() => {
    const passend = allePflanzen.filter(p => p.thunTyp === mond.thunTyp);
    if (passend.length === 0) return [];
    // Tagesschluessel als Seed fuer pseudo-zufaellige Auswahl
    const seed = aktiverTag.getFullYear() * 1000 + aktiverTag.getMonth() * 50 + aktiverTag.getDate();
    const indices = new Set<number>();
    let i = 0;
    while (indices.size < Math.min(3, passend.length) && i < 100) {
      indices.add((seed + i * 17) % passend.length);
      i++;
    }
    return Array.from(indices).map(idx => passend[idx]);
  }, [mond.thunTyp, tagKey]);

  const tagestypFarbe = thunTypFarbe(mond.thunTyp);
  const tagestypName = thunTypLabel(mond.thunTyp);

  function oeffnePflanze(p: Pflanze) {
    nav.oeffne({ kind: 'pflanze', id: p.id });
  }

  const wetterKl = wetterHeute ? wetterKlasse(wetterHeute.wettercode) : null;

  return (
    <div className="start-view">
      <header className="start-hero">
        <img src="/logo.svg" alt="Mein kosmischer Garten" className="start-hero-logo" />
        <p className="start-hero-eyebrow">Sonne, Mond und Sterne</p>
      </header>

      <section className="start-heute">
        <div className="start-heute-grid">
          <div className="start-heute-card start-heute-haupt" style={{ ['--karte-farbe' as string]: tagestypFarbe }}>
            <div className="start-heute-card-kopf">
              <span className="start-heute-label">{istHeute ? 'Heute am Himmel' : 'Am Himmel'}</span>
              <span className="start-heute-datumzeile">
                <button
                  type="button"
                  className="start-heute-pfeil"
                  onClick={() => einenTagWeiter(-1)}
                  aria-label="Einen Tag zurück"
                  title="Einen Tag zurück"
                >‹</button>
                <span className="start-heute-datum">
                  {WT_LANG[aktiverTag.getDay()]}, {aktiverTag.getDate()}. {MONATE_LANG[aktiverTag.getMonth()]} {aktiverTag.getFullYear()}
                </span>
                <button
                  type="button"
                  className="start-heute-pfeil"
                  onClick={() => einenTagWeiter(1)}
                  aria-label="Einen Tag weiter"
                  title="Einen Tag weiter"
                >›</button>
                {!istHeute && (
                  <button
                    type="button"
                    className="start-heute-heute"
                    onClick={zuHeute}
                    title="Zurück zu heute"
                  >Heute</button>
                )}
                <span className="start-heute-trenner" aria-hidden="true" />
                <span className="start-heute-ort">{ort.name}</span>
              </span>
            </div>
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
            <button
              type="button"
              className="start-heute-link start-heute-link-knopf"
              onClick={onTag}
            >Zur Tag-Ansicht →</button>
          </div>
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
              onClick={() => navigate(w.pfad)}
            >
              <span className="start-werkzeug-symbol">{w.symbol}</span>
              <span className="start-werkzeug-name">{w.name}</span>
              <p className="start-werkzeug-beschreibung">{w.beschreibung}</p>
            </button>
          ))}
        </div>
      </section>

      {portraits.length > 0 && (
        <section className="start-portraits">
          <h2 className="start-section-titel">Heute im Portrait — drei {tagestypName}-Pflanzen</h2>
          <div className="start-portraits-grid">
            {portraits.map(p => (
              <button
                key={p.id}
                className="start-portrait-karte"
                onClick={() => oeffnePflanze(p)}
                style={{ ['--karte-farbe' as string]: tagestypFarbe }}
              >
                <span className="start-portrait-name">{p.name}</span>
                <span className="start-portrait-lateinisch">{p.lateinisch}</span>
                <span className="start-portrait-familie">{p.familie}</span>
                {p.tipps && <p className="start-portrait-text">{p.tipps}</p>}
                <span className="start-portrait-link">Zum Steckbrief →</span>
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

      <section className="start-traeger">
        <div className="start-traeger-text">
          <h2 className="start-section-titel">Aus der Mitte heraus</h2>
          <p className="start-traeger-lead">
            Mein kosmischer Garten wird getragen vom Verein{' '}
            <strong>Kollektiv Lichtung e.V.</strong> — gegründet 2019,
            gemeinnützig anerkannt. <em>Lichtungen sind Orte der Begegnung</em> —
            zur Erdung des Projekts.
          </p>
          <p className="start-traeger-absatz">
            Das Werk ist Teil des <strong>Real Life Network</strong>. Seit über
            drei Jahren bauen wir an einem Netzwerk für echte Begegnung in der
            realen Welt — Vertrauen über das Web of Trust, Selbstbestimmung statt
            zentrale Server, von Mensch zu Mensch.
          </p>
          <div className="start-traeger-links">
            <a
              href="https://lichtung.ooo"
              target="_blank"
              rel="noopener noreferrer"
              className="start-traeger-link"
            >Lichtung →</a>
            <a
              href="https://web-of-trust.de"
              target="_blank"
              rel="noopener noreferrer"
              className="start-traeger-link"
            >Web of Trust →</a>
            <a
              href="https://real-life.network"
              target="_blank"
              rel="noopener noreferrer"
              className="start-traeger-link"
            >Real Life Network →</a>
          </div>
        </div>

        <div className="start-traeger-spende">
          <h3>Unterstütze das Projekt</h3>
          <p className="start-traeger-spende-lead">
            Wenn dir der Garten etwas gibt — schenk uns etwas zurück. Jeder Beitrag
            hält das Werk lebendig.
          </p>

          <a
            href="https://www.paypal.com/donate?hosted_button_id=KOLLEKTIV_LICHTUNG"
            target="_blank"
            rel="noopener noreferrer"
            className="start-traeger-paypal"
          >
            <span className="start-traeger-paypal-icon">🌱</span>
            <span>Mit PayPal spenden</span>
          </a>

          <p className="start-traeger-spende-info">
            Einmal oder monatlich. Spendenquittung auf Anfrage.
          </p>

          <details className="start-traeger-konto">
            <summary>Lieber per Überweisung</summary>
            <div className="start-traeger-konto-inhalt">
              <div><span>Empfänger</span><strong>Kollektiv Lichtung e.V.</strong></div>
              <div><span>IBAN</span><code>DE.. .... .... .... .... ..</code></div>
              <div><span>BIC</span><code>...</code></div>
              <div><span>Verwendungszweck</span><strong>Spende kosmischer Garten</strong></div>
            </div>
          </details>
        </div>
      </section>

    </div>
  );
}
