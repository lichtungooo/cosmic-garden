import { useMemo, useState } from 'react';
import { alleEintraege } from '../lib/datenbank-suche';
import type { Eintrag, EintragsTyp } from '../lib/datenbank';
import { useDetailNav, refAusId } from '../lib/detail-navigation';

interface BaumKnoten {
  name: string;
  pfad: string;
  unterknoten: Map<string, BaumKnoten>;
  eintraege: Eintrag[];
}

function baueBaum(eintraege: Eintrag[]): BaumKnoten {
  const wurzel: BaumKnoten = {
    name: '',
    pfad: '',
    unterknoten: new Map(),
    eintraege: [],
  };
  for (const e of eintraege) {
    const teile = e.kategorie.split('/');
    let aktuell = wurzel;
    for (let i = 0; i < teile.length; i++) {
      const t = teile[i];
      if (!aktuell.unterknoten.has(t)) {
        aktuell.unterknoten.set(t, {
          name: t,
          pfad: teile.slice(0, i + 1).join('/'),
          unterknoten: new Map(),
          eintraege: [],
        });
      }
      aktuell = aktuell.unterknoten.get(t)!;
    }
    aktuell.eintraege.push(e);
  }
  return wurzel;
}

const KATEGORIE_LABEL: Record<string, string> = {
  kosmos:    'Kosmos',
  pflanzen:  'Pflanzen',
  praxis:    'Praxis',
  schulen:   'Schulen',
  gemeinschaft: 'Gemeinschaft',
  frucht: 'Frucht',
  blatt: 'Blatt',
  wurzel: 'Wurzel',
  bluete: 'Bluete',
  kraut: 'Kraut',
  baum: 'Baum',
  beere: 'Beere',
  tierkreis: 'Tierkreis',
  mond: 'Mond',
  sonne: 'Sonne',
  kalender: 'Kalender',
  maya: 'Maya',
  bruecken: 'Bruecken',
  pilze: 'Pilze',
  indoor: 'Indoor',
  naturmagier: 'Naturmagier',
  saatgut: 'Saatgut',
  schaedlinge: 'Schaedlinge',
  schnitt: 'Schnitt',
  veredelung: 'Veredelung',
  boden: 'Boden',
  rasen: 'Rasen',
  pflanzung: 'Pflanzung',
  pflege: 'Pflege',
  ernte: 'Ernte',
  winterschutz: 'Winterschutz',
  planung: 'Planung',
};

function knotenLabel(name: string): string {
  return KATEGORIE_LABEL[name] ?? (name.charAt(0).toUpperCase() + name.slice(1));
}

const TYP_FARBE: Record<EintragsTyp, string> = {
  pflanze:  '#4a7c3a',
  arbeit:   '#5b3a8a',
  wissen:   '#3b4b6b',
  frage:    '#c89b3a',
  antwort:  '#a8423a',
};

export function NavBaum() {
  const [filter, setFilter] = useState('');
  const [ausgeklappt, setAusgeklappt] = useState<Set<string>>(() => {
    return new Set(['kosmos', 'pflanzen', 'praxis', 'schulen']);
  });
  const nav = useDetailNav();

  const baum = useMemo(() => {
    const alle = alleEintraege();
    if (!filter.trim()) return baueBaum(alle);
    const q = filter.toLowerCase().trim();
    const gefiltert = alle.filter(e =>
      e.titel.toLowerCase().includes(q) ||
      e.kurz.toLowerCase().includes(q) ||
      e.tags.some(t => t.includes(q))
    );
    return baueBaum(gefiltert);
  }, [filter]);

  function toggle(pfad: string) {
    setAusgeklappt(prev => {
      const next = new Set(prev);
      if (next.has(pfad)) next.delete(pfad);
      else next.add(pfad);
      return next;
    });
  }

  function oeffneEintrag(e: Eintrag) {
    const ref = refAusId(e.id);
    if (ref) nav.oeffne(ref);
  }

  // Wenn Filter aktiv ist, klappe alles auf
  const istGefiltert = filter.trim().length > 0;

  function renderKnoten(knoten: BaumKnoten, tiefe: number): React.ReactNode {
    const offen = istGefiltert || ausgeklappt.has(knoten.pfad);
    const hatUnterknoten = knoten.unterknoten.size > 0;
    const hatEintraege = knoten.eintraege.length > 0;
    const gesamt = zaehleEintraege(knoten);

    if (gesamt === 0) return null;

    return (
      <li key={knoten.pfad} className="baum-knoten">
        <button
          type="button"
          className={`baum-kategorie tiefe-${tiefe}`}
          onClick={() => toggle(knoten.pfad)}
        >
          <span className="baum-pfeil">{offen ? '▾' : '▸'}</span>
          <span className="baum-name">{knotenLabel(knoten.name)}</span>
          <span className="baum-zahl">{gesamt}</span>
        </button>
        {offen && (
          <ul className="baum-kinder">
            {hatUnterknoten &&
              Array.from(knoten.unterknoten.values()).map(k => renderKnoten(k, tiefe + 1))}
            {hatEintraege &&
              knoten.eintraege
                .slice()
                .sort((a, b) => a.titel.localeCompare(b.titel))
                .map(e => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className={`baum-eintrag tiefe-${tiefe + 1}`}
                      onClick={() => oeffneEintrag(e)}
                      style={{ borderLeftColor: TYP_FARBE[e.typ] }}
                    >
                      {e.symbol && <span className="baum-eintrag-symbol zodiak-glyph">{e.symbol}</span>}
                      <span className="baum-eintrag-titel">{e.titel}</span>
                    </button>
                  </li>
                ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="nav-baum">
      <input
        type="search"
        className="nav-baum-suche"
        placeholder="Im Baum suchen..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      <ul className="baum-wurzel">
        {Array.from(baum.unterknoten.values()).map(k => renderKnoten(k, 0))}
      </ul>
    </div>
  );
}

function zaehleEintraege(knoten: BaumKnoten): number {
  let n = knoten.eintraege.length;
  for (const k of knoten.unterknoten.values()) n += zaehleEintraege(k);
  return n;
}
