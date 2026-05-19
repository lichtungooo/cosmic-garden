import { useState, useMemo } from 'react';
import { TzolkinRad } from '../components/TzolkinRad';
import { HaabRad } from '../components/HaabRad';
import { LongCountAnsicht } from '../components/LongCountAnsicht';
import { VenusRad } from '../components/VenusRad';
import { mayaDatum, venus, TZOLKIN_BEDEUTUNG, HAAB_BEDEUTUNG, VENUS_PHASEN, naechsterPhasenWechsel } from '../lib/maya';
import { InfoIcon } from '../components/InfoIcon';

type Maya = 'tzolkin' | 'haab' | 'longcount' | 'venus';

const SUB_LABELS: { id: Maya; label: string }[] = [
  { id: 'tzolkin',   label: 'Tzolkin' },
  { id: 'haab',      label: 'Haab' },
  { id: 'longcount', label: 'Long Count' },
  { id: 'venus',     label: 'Venus' },
];

interface Props {
  datum: Date;
  setDatum: (d: Date) => void;
}

const MONATE_KURZ = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function fmtDatum(d: Date): string {
  return `${d.getDate()}. ${MONATE_KURZ[d.getMonth()]} ${d.getFullYear()}`;
}

export function MayaView({ datum, setDatum }: Props) {
  const [welche, setWelche] = useState<Maya>('tzolkin');
  const maya = useMemo(() => mayaDatum(datum), [datum]);
  const venusJetzt = useMemo(() => venus(datum), [datum]);

  // Klick im Rad: nur Datum aendern, Info-Panel rechts/links zeigt die Details
  const radSetDatum = setDatum;

  return (
    <div className="maya-view">
      <div className="maya-toolbar">
        <div className="switch-group">
          {SUB_LABELS.map(s => (
            <button
              key={s.id}
              className={`switch ${welche === s.id ? 'switch-active' : ''}`}
              onClick={() => setWelche(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="maya-inhalt">
        {welche === 'tzolkin' && (
          <div className="maya-rad-wrap">
            <aside className="maya-info-panel maya-info-links">
              <h3>
                Tzolkin
                <InfoIcon sektionId="maya" eintragId="tzolkin-tiefe" titel="Tzolkin im Detail" />
              </h3>
              <p className="maya-info-lead">
                Der heilige Kalender. 260 Tage, 13 Zahlen mal 20 Glyphen.
                Verwurzelt in der Schwangerschaft (~266 Tage) und im Maisanbau-Zyklus.
              </p>
              <div className="maya-info-aktuell">
                <div className="maya-info-zeile"><span>Heute</span><span className="maya-akzent">{maya.tzolkinStr}</span></div>
                <div className="maya-info-zeile"><span>Tag</span><span>{maya.tzolkin.position} / 260</span></div>
                <div className="maya-info-zeile"><span>Zahl</span><span>{maya.tzolkin.zahl}</span></div>
                <div className="maya-info-zeile"><span>Glyphe</span><span>{maya.tzolkin.name}</span></div>
              </div>
            </aside>
            <TzolkinRad datum={datum} setDatum={radSetDatum} />
            <aside className="maya-info-panel maya-info-rechts">
              <h4>Bedeutung</h4>
              <p className="maya-info-bedeutung">{TZOLKIN_BEDEUTUNG[maya.tzolkin.name]}</p>
              <p className="maya-info-fuss">
                Die Zahl misst die Energie-Intensitaet — 1 sanft, 7 ausgeglichen, 13 vollendet.
                Die Glyphe traegt das Wesen des Tages.
              </p>
            </aside>
          </div>
        )}

        {welche === 'haab' && (
          <div className="maya-rad-wrap">
            <aside className="maya-info-panel maya-info-links">
              <h3>
                Haab
                <InfoIcon sektionId="maya" eintragId="mayazivilisation" titel="Mehr über die Mayazivilisation" />
              </h3>
              <p className="maya-info-lead">
                Der Sonnenkalender. 365 Tage, 18 Monate je 20 Tage plus 5 namenlose Tage (Wayeb).
                Landwirtschaftlicher Rhythmus, geerdet in der Sonne.
              </p>
              <div className="maya-info-aktuell">
                <div className="maya-info-zeile"><span>Heute</span><span className="maya-akzent">{maya.haabStr}</span></div>
                <div className="maya-info-zeile"><span>Monat</span><span>{maya.haab.monat}{maya.haab.istWayeb ? ' (Wayeb)' : ''}</span></div>
                <div className="maya-info-zeile"><span>Tag</span><span>{maya.haab.tagImMonat}</span></div>
              </div>
            </aside>
            <HaabRad datum={datum} setDatum={radSetDatum} />
            <aside className="maya-info-panel maya-info-rechts">
              <h4>Bedeutung</h4>
              <p className="maya-info-bedeutung">{HAAB_BEDEUTUNG[maya.haab.monat]}</p>
              <p className="maya-info-fuss">
                In Wayeb (den fuenf Tagen) ruhten viele Arbeiten. Die Mayas hielten sich still,
                schuetzten ihre Häuser, fasteten — die Schwelle zwischen den Jahren.
              </p>
            </aside>
          </div>
        )}

        {welche === 'longcount' && (
          <div className="maya-rad-wrap">
            <aside className="maya-info-panel maya-info-links">
              <h3>
                Long Count
                <InfoIcon sektionId="maya" eintragId="2012-wahrheit" titel="21.12.2012 — was wirklich war" />
              </h3>
              <p className="maya-info-lead">
                Der grosse Zeitstrom. Lineare Tageszaehlung ab dem Maya-Schoepfungstag
                11.8.3114 v.Chr.
              </p>
              <div className="maya-info-aktuell">
                <div className="maya-info-zeile"><span>Heute</span><span className="maya-akzent mono">{maya.longCountStr}</span></div>
                <div className="maya-info-zeile"><span>Tage seit Schöpfung</span><span>{maya.tageSeitNullpunkt.toLocaleString('de-DE')}</span></div>
              </div>
            </aside>
            <LongCountAnsicht datum={datum} />
            <aside className="maya-info-panel maya-info-rechts">
              <h4>Einheiten</h4>
              <dl className="maya-einheiten">
                <dt>K'in</dt><dd>1 Tag</dd>
                <dt>Winal</dt><dd>20 K'in = 20 Tage</dd>
                <dt>Tun</dt><dd>18 Winal = 360 Tage</dd>
                <dt>K'atun</dt><dd>20 Tun = 7.200 Tage (~20 Jahre)</dd>
                <dt>Bak'tun</dt><dd>20 K'atun = 144.000 Tage (~394 Jahre)</dd>
              </dl>
              <p className="maya-info-fuss">
                Der 13. Bak'tun begann am <strong>21.12.2012</strong>. Kein Weltuntergang —
                ein neuer Zyklus von ~5125 Jahren.
              </p>
            </aside>
          </div>
        )}

        {welche === 'venus' && (
          <div className="maya-rad-wrap">
            <aside className="maya-info-panel maya-info-links">
              <h3>
                Venus
                <InfoIcon sektionId="maya" eintragId="venus-codex" titel="Venus-Tafeln des Dresden Codex" />
              </h3>
              <p className="maya-info-lead">
                Der Stern der Wandlung. 584 Tage, vier Phasen — untere Konjunktion, Morgenstern,
                obere Konjunktion, Abendstern.
              </p>
              <div className="maya-info-aktuell">
                <div className="maya-info-zeile"><span>Heute</span><span className="maya-akzent">{venusJetzt.phase.name}</span></div>
                <div className="maya-info-zeile"><span>Tag in der Phase</span><span>{venusJetzt.tagInPhase + 1} / {venusJetzt.phase.ende - venusJetzt.phase.start}</span></div>
                <div className="maya-info-zeile"><span>Tag im Zyklus</span><span>{venusJetzt.tagImZyklus + 1} / 584</span></div>
                <div className="maya-info-zeile"><span>Zyklus seit 2012</span><span>{venusJetzt.zyklusNummer}.</span></div>
              </div>
            </aside>
            <VenusRad datum={datum} setDatum={radSetDatum} />
            <aside className="maya-info-panel maya-info-rechts">
              <h4>Naechste Wechsel</h4>
              <div className="maya-info-aktuell">
                {VENUS_PHASEN.map(p => (
                  <div key={p.id} className="maya-info-zeile">
                    <span>{p.name}</span>
                    <span style={{ color: p.farbe }}>{fmtDatum(naechsterPhasenWechsel(datum, p.id))}</span>
                  </div>
                ))}
              </div>
              <h4>Bedeutung</h4>
              <p className="maya-info-bedeutung">{venusJetzt.phase.bedeutung}</p>
              <p className="maya-info-fuss">
                <strong>5 Venus-Zyklen = 8 Sonnenjahre</strong>. Für die Mayas war Venus
                Quetzalcoatl/Kukulkan — der gefiederte Schlangengott.
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
