import { longCount, mayaTageSeitNullpunkt } from '../lib/maya';

interface Props {
  datum: Date;
}

interface Einheit {
  name: string;
  wert: number;
  max: number;  // 20 für alle ausser Winal (18)
  tage: number; // Anzahl Tage pro Einheit
}

export function LongCountAnsicht({ datum }: Props) {
  const lc = longCount(datum);
  const tageGesamt = mayaTageSeitNullpunkt(datum);

  const einheiten: Einheit[] = [
    { name: "Bak'tun", wert: lc.baktun, max: 13, tage: 144000 },
    { name: "K'atun",  wert: lc.katun,  max: 20, tage: 7200 },
    { name: "Tun",     wert: lc.tun,    max: 20, tage: 360 },
    { name: "Winal",   wert: lc.winal,  max: 18, tage: 20 },
    { name: "K'in",    wert: lc.kin,    max: 20, tage: 1 },
  ];

  return (
    <div className="longcount-ansicht">
      <div className="lc-grosse-zahl">
        {lc.baktun}<span className="lc-trenner">.</span>{lc.katun}<span className="lc-trenner">.</span>{lc.tun}<span className="lc-trenner">.</span>{lc.winal}<span className="lc-trenner">.</span>{lc.kin}
      </div>
      <div className="lc-untertitel">
        Bak'tun · K'atun · Tun · Winal · K'in
      </div>

      <div className="lc-einheiten-liste">
        {einheiten.map(e => (
          <div key={e.name} className="lc-einheit">
            <div className="lc-einheit-name">{e.name}</div>
            <div className="lc-einheit-wert">{e.wert}</div>
            <div className="lc-einheit-balken">
              <span className="lc-balken-fuellung" style={{ width: `${(e.wert / e.max) * 100}%` }} />
            </div>
            <div className="lc-einheit-meta">
              von {e.max} · {e.tage.toLocaleString('de-DE')} Tage
            </div>
          </div>
        ))}
      </div>

      <div className="lc-zaehler">
        <div className="lc-zaehler-zeile">
          <span>Tage seit der Schöpfung</span>
          <span className="lc-zahl">{tageGesamt.toLocaleString('de-DE')}</span>
        </div>
        <div className="lc-zaehler-zeile">
          <span>Sonnenjahre seit der Schöpfung</span>
          <span className="lc-zahl">{(tageGesamt / 365.2422).toFixed(2)}</span>
        </div>
        <div className="lc-zaehler-zeile">
          <span>Tage bis zum 14. Bak'tun</span>
          <span className="lc-zahl">{((13 * 144000) - tageGesamt).toLocaleString('de-DE')}</span>
        </div>
      </div>

      <div className="lc-zeitstrahl">
        <div className="lc-strahl">
          <span className="lc-strahl-marker lc-strahl-anfang" style={{ left: '0%' }}>
            <span className="lc-strahl-label">13.0.0.0.0</span>
            <span className="lc-strahl-datum">21.12.2012</span>
          </span>
          <span className="lc-strahl-marker lc-strahl-jetzt" style={{ left: `${(tageGesamt - 13 * 144000) / 144000 * 100}%` }}>
            <span className="lc-strahl-label">heute</span>
            <span className="lc-strahl-datum">{lc.baktun}.{lc.katun}.{lc.tun}.{lc.winal}.{lc.kin}</span>
          </span>
          <span className="lc-strahl-marker lc-strahl-ende" style={{ right: '0%' }}>
            <span className="lc-strahl-label">14.0.0.0.0</span>
            <span className="lc-strahl-datum">~ März 4407</span>
          </span>
        </div>
        <div className="lc-strahl-untertitel">
          Der jetzige Welt-Zyklus: 13. Bak'tun · 5125 Jahre
        </div>
      </div>
    </div>
  );
}
