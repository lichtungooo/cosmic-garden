import { useMemo } from 'react';
import { mondTag, thunTypFarbe, thunTypLabel, phaseLabel } from '../lib/moon';
import { tagesHimmel, formatZeit, formatDauer, findPhaseAtDay, phaseEventLabel } from '../lib/himmel';
import { useStandort } from '../lib/standort';
import { useWetter, findeWetterFuerDatum, klasse as wetterKlasse, klasseLabel as wetterKlasseLabel } from '../lib/wetter';
import { pflanzenZurVorzucht, pflanzenZumAuspflanzen, pflanzenZurErnte, arbeitenImMonat, type Pflanze, type Gartenarbeit } from '../lib/pflanzen';
import { mayaDatum, TZOLKIN_BEDEUTUNG } from '../lib/maya';
import { MondSymbol, SonneSymbol } from '../components/MondSymbol';
import { WetterSymbol } from '../components/WetterSymbol';
import { useDetailNav } from '../lib/detail-navigation';

// Mapping: Tierkreis-Zeichen-Name → Wissens-Eintrag-ID
const ZEICHEN_ZU_ID: Record<string, string> = {
  'Widder': 'widder',
  'Stier': 'stier',
  'Zwillinge': 'zwillinge',
  'Krebs': 'krebs',
  'Loewe': 'loewe',
  'Löwe': 'loewe',
  'Jungfrau': 'jungfrau',
  'Waage': 'waage',
  'Skorpion': 'skorpion',
  'Schuetze': 'schuetze',
  'Schütze': 'schuetze',
  'Steinbock': 'steinbock',
  'Wassermann': 'wassermann',
  'Fische': 'fische',
};

const WT_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

interface Props {
  datum: Date;
  onPflanze: (p: Pflanze) => void;
  onArbeit: (a: Gartenarbeit) => void;
}

export function TagView({ datum, onPflanze, onArbeit }: Props) {
  const ort = useStandort();
  const wetter = useWetter(ort);
  const nav = useDetailNav();

  const mond = useMemo(() => mondTag(datum), [datum]);
  const himmel = useMemo(() => tagesHimmel(datum, ort), [datum, ort]);
  const phaseEvent = useMemo(() => findPhaseAtDay(datum), [datum]);
  const maya = useMemo(() => mayaDatum(datum), [datum]);
  const wetterTag = findeWetterFuerDatum(wetter, datum);
  const wk = wetterTag ? wetterKlasse(wetterTag.wettercode) : null;

  const zeichenId = ZEICHEN_ZU_ID[mond.zeichen.name];

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

  return (
    <div className="tag-voll">
      <header className="tag-voll-kopf" style={{ borderTopColor: farbe }}>
        <div className="tag-kopf-titel">
          <div className="tag-wochentag">{WT_LANG[datum.getDay()]}</div>
          <button
            className="tag-thun tag-thun-link"
            style={{ background: farbe }}
            onClick={() => nav.oeffne({ kind: 'wissen', sektion: 'bruecken', eintrag: 'mond-pflanzen' })}
            title={`${thunTypLabel(mond.thunTyp)} — Maria-Thuns Lehre erklaert`}
          >
            {thunTypLabel(mond.thunTyp)}
          </button>
        </div>

        <button
          className="tag-kopf-zentrum tag-zeichen-link"
          onClick={() => zeichenId && nav.oeffne({ kind: 'wissen', sektion: 'tierkreis', eintrag: zeichenId })}
          disabled={!zeichenId}
          title={`Mehr über ${mond.zeichen.name}`}
        >
          <div className="tag-zeichen-groß">{mond.zeichen.symbol}</div>
          <div className="tag-zeichen-name">{mond.zeichen.name}</div>
          <div className="tag-element">Element {mond.element}</div>
        </button>

        <div className="tag-kopf-rechts">
          <div className="tag-mond-groß">
            <MondSymbol illumination={mond.illumination} waxing={mond.waxing} size={64} />
          </div>
          <div className="tag-mond-text">
            {phaseLabel(mond.phase)} · {Math.round(mond.illumination * 100)}%
          </div>
          {phaseEvent && (
            <div className="tag-mond-event">
              {phaseEventLabel(phaseEvent.event)} {formatZeit(phaseEvent.zeit)}
            </div>
          )}
        </div>
      </header>

      <section className="tag-himmel-zeile">
        <div className="himmel-block">
          <SonneSymbol size={20} />
          <div className="himmel-block-text">
            <strong>Sonne</strong>
            <span>
              <span title="Sonnenaufgang">↑ {formatZeit(himmel.sonnenaufgang)}</span>
              <span className="hoch" title="hoechster Stand">☀ {formatZeit(himmel.sonnenHoechststand)}</span>
              <span title="Sonnenuntergang">↓ {formatZeit(himmel.sonnenuntergang)}</span>
            </span>
            <small>{formatDauer(himmel.tagesLaengeMin)} · {himmel.sonnenHoeheGrad != null ? `${Math.round(himmel.sonnenHoeheGrad)}° Höhe` : ''}</small>
          </div>
        </div>
        <div className="himmel-block">
          <MondSymbol illumination={mond.illumination} waxing={mond.waxing} size={20} />
          <div className="himmel-block-text">
            <strong>Mond</strong>
            <span>
              <span>↑ {formatZeit(himmel.mondaufgang)}</span>
              <span>↓ {formatZeit(himmel.monduntergang)}</span>
            </span>
            <small>{mond.aufstieg} · {ort.name}</small>
          </div>
        </div>
        {wetterTag && wk && (
          <div className="himmel-block">
            <WetterSymbol klasse={wk} size={22} />
            <div className="himmel-block-text">
              <strong>Wetter</strong>
              <span>
                <span>{Math.round(wetterTag.tMin)}° / {Math.round(wetterTag.tMax)}°</span>
                <span>{wetterTag.niederschlagMm.toFixed(1)} mm</span>
              </span>
              <small>{wetterKlasseLabel(wk)}</small>
            </div>
          </div>
        )}
        {mond.knotenTag && (
          <div className="himmel-block knoten-warn">
            <strong>Mondknoten</strong>
            <span>Pause halten. Pflanzen wirken aufgeregt.</span>
          </div>
        )}
      </section>

      <section className="tag-empfehlung-block">
        <h3>{thunTypLabel(mond.thunTyp)} — was heute gut tut</h3>
        <p>{empfehlung(mond.thunTyp)}</p>
        <p className="tag-empfehlung-fuss">
          Maria-Thuns Lehre — vertieft in{' '}
          <button
            type="button"
            className="md-internal-link"
            onClick={() => nav.oeffne({ kind: 'wissen', sektion: 'bruecken', eintrag: 'mond-pflanzen' })}
          >Mond und Pflanzen</button>{' '}
          und bei{' '}
          <button
            type="button"
            className="md-internal-link"
            onClick={() => nav.oeffne({ kind: 'wissen', sektion: 'traditionen', eintrag: 'maria-thun-tradition' })}
          >Maria Thun</button>.
        </p>
      </section>

      <section className="tag-maya-block">
        <h3>Maya — heute in den drei Kalendern</h3>
        <div className="tag-maya-grid">
          <button
            type="button"
            className="tag-maya-karte"
            onClick={() => nav.oeffne({ kind: 'wissen', sektion: 'maya', eintrag: 'tzolkin-tiefe' })}
          >
            <span className="tag-maya-label">Tzolkin</span>
            <span className="tag-maya-wert">{maya.tzolkinStr}</span>
            <span className="tag-maya-fuss">{TZOLKIN_BEDEUTUNG[maya.tzolkin.name]?.slice(0, 70)}{TZOLKIN_BEDEUTUNG[maya.tzolkin.name] && TZOLKIN_BEDEUTUNG[maya.tzolkin.name].length > 70 ? '…' : ''}</span>
          </button>
          <button
            type="button"
            className="tag-maya-karte"
            onClick={() => nav.oeffne({ kind: 'wissen', sektion: 'maya', eintrag: 'mayazivilisation' })}
          >
            <span className="tag-maya-label">Haab</span>
            <span className="tag-maya-wert">{maya.haabStr}</span>
            <span className="tag-maya-fuss">Sonnenkalender, 365 Tage{maya.haab.istWayeb ? ' · Wayeb-Schwelle' : ''}</span>
          </button>
          <button
            type="button"
            className="tag-maya-karte"
            onClick={() => nav.oeffne({ kind: 'wissen', sektion: 'maya', eintrag: '2012-wahrheit' })}
          >
            <span className="tag-maya-label">Long Count</span>
            <span className="tag-maya-wert mono">{maya.longCountStr}</span>
            <span className="tag-maya-fuss">Tag {maya.tageSeitNullpunkt.toLocaleString('de-DE')} seit Schöpfung</span>
          </button>
        </div>
      </section>

      <div className="tag-listen">
        <Pflanzenblock titel="Vorzucht" farbe="#7a4d2b" pflanzen={vorzucht} onPflanze={onPflanze} />
        <Pflanzenblock titel="Saat & Auspflanzen" farbe="#4a7c3a" pflanzen={auspflanzen} onPflanze={onPflanze} />
        <Pflanzenblock titel="Ernte" farbe="#a8423a" pflanzen={ernte} onPflanze={onPflanze} />
        <Arbeitenblock arbeiten={arbeiten} mondTyp={mond.thunTyp} onArbeit={onArbeit} />
      </div>
    </div>
  );
}

interface PflanzenblockProps {
  titel: string;
  farbe: string;
  pflanzen: Pflanze[];
  onPflanze: (p: Pflanze) => void;
}

function Pflanzenblock({ titel, farbe, pflanzen, onPflanze }: PflanzenblockProps) {
  if (pflanzen.length === 0) return null;
  return (
    <section className="liste-block" style={{ borderTopColor: farbe }}>
      <header className="liste-header" style={{ color: farbe }}>
        <h3>{titel}</h3>
        <span className="liste-zaehler">{pflanzen.length}</span>
      </header>
      <div className="liste-grid">
        {pflanzen.map(p => (
          <article key={p.id} className="liste-karte" onClick={() => onPflanze(p)}>
            <h4>{p.name}</h4>
            <span className="latein">{p.lateinisch}</span>
            <p className="liste-tipp">{p.tipps.slice(0, 110)}{p.tipps.length > 110 ? '…' : ''}</p>
            <div className="liste-meta">
              <span>{p.saattiefeCm === 0 ? 'nur andruecken' : `${p.saattiefeCm} cm tief`}</span>
              <span>{p.keimerTyp === 'hell' ? 'Lichtkeimer' : p.keimerTyp === 'dunkel' ? 'Dunkelkeimer' : 'beides'}</span>
              <span>{p.keimtempC}°C · {p.keimdauerTage} Tage</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

interface ArbeitenblockProps {
  arbeiten: Gartenarbeit[];
  mondTyp: 'wurzel' | 'blatt' | 'bluete' | 'frucht';
  onArbeit: (a: Gartenarbeit) => void;
}

function Arbeitenblock({ arbeiten, mondTyp, onArbeit }: ArbeitenblockProps) {
  if (arbeiten.length === 0) return null;
  return (
    <section className="liste-block" style={{ borderTopColor: '#5b3a8a' }}>
      <header className="liste-header" style={{ color: '#5b3a8a' }}>
        <h3>Arbeiten im Garten</h3>
        <span className="liste-zaehler">{arbeiten.length}</span>
      </header>
      <div className="liste-grid">
        {arbeiten.map(a => {
          const passend = a.thunEmpfehlung === mondTyp;
          return (
            <article
              key={a.id}
              className={`liste-karte ${passend ? 'passend' : ''}`}
              onClick={() => onArbeit(a)}
              style={passend ? { borderColor: thunTypFarbe(a.thunEmpfehlung) } : undefined}
            >
              <h4>{a.name}</h4>
              <span className="latein">{a.kategorie} · {a.mondPhase}</span>
              <p className="liste-tipp">{a.tipps.slice(0, 110)}{a.tipps.length > 110 ? '…' : ''}</p>
              {passend && <span className="passend-label" style={{ background: thunTypFarbe(a.thunEmpfehlung) }}>Heute besonders gut</span>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function empfehlung(typ: 'wurzel' | 'blatt' | 'bluete' | 'frucht'): string {
  return {
    wurzel: 'Wurzeltag. Wurzelgemuese säen, ernten, lagern. Boden lockern, Kompost ausbringen. Alles, was unter der Erde Kraft sammelt.',
    blatt:  'Blatttag. Salat, Kohl, Spinat, Kraeuter. Giessen wirkt heute besonders. Saftpflanzen und Blattgemuese.',
    bluete: 'Bluetentag. Brokkoli, Blumenkohl, Heilkraeuter zur Blüte, Schnittblumen. Bienen besuchen, oelhaltige Pflanzen.',
    frucht: 'Fruchttag. Tomate, Paprika, Bohne, Kürbis, Obstbaeume. Alles, was Frucht und Samen traegt. Auch Veredelung.',
  }[typ];
}
