// Mega-Menue fuer die fuenf Welten — breit, kategorisiert, mit "Alle anzeigen".
// Zeigt Sub-Sektionen wo vorhanden, sonst direkt Eintraege.

import { useEffect, useMemo } from 'react';
import { WELTEN, type WeltId } from '../lib/welten';
import { alleEintraege } from '../lib/datenbank-suche';
import type { Eintrag, EintragsTyp } from '../lib/datenbank';
import { refAusId, type DetailRef } from '../lib/detail-navigation';

interface SubSektion {
  pfad: string;          // z.B. "kosmos/tierkreis"
  name: string;
  anzahl: number;
}

interface Props {
  onWelt: (id: WeltId) => void;
  onEintrag: (ref: DetailRef) => void;
  onSchliessen: () => void;
}

const MAX_PRO_SPALTE = 10;

const SEKTIONS_LABEL: Record<string, string> = {
  tierkreis: 'Tierkreis',
  mond: 'Mond',
  sonne: 'Sonne',
  kalender: 'Kalender-Systeme',
  maya: 'Maya',
  bruecken: 'Bruecken',
  frucht: 'Fruchtgemuese',
  blatt: 'Blattgemuese',
  wurzel: 'Wurzelgemuese',
  bluete: 'Bluetenpflanzen',
  kraut: 'Kraeuter',
  baum: 'Obstbaeume',
  beere: 'Beerenobst',
  schnitt: 'Schnitt',
  veredelung: 'Veredelung',
  boden: 'Boden',
  rasen: 'Rasen',
  pflanzung: 'Pflanzung',
  pflege: 'Pflege',
  ernte: 'Ernte',
  winterschutz: 'Winterschutz',
  planung: 'Planung',
  wissen: 'Methoden',
  pilze: 'Pilze',
  indoor: 'Indoor-Anbau',
  saatgut: 'Saatgut',
  schaedlinge: 'Schaedlinge',
  traditionen: 'Traditionen',
  naturmagier: 'Naturmagier',
  gemeinschaft: 'Gemeinschaft',
};

const TYP_FARBE: Record<EintragsTyp, string> = {
  pflanze: '#4a7c3a',
  arbeit:  '#5b3a8a',
  wissen:  '#3b4b6b',
  frage:   '#c89b3a',
  antwort: '#a8423a',
};

function sektionsLabel(id: string): string {
  return SEKTIONS_LABEL[id] ?? (id.charAt(0).toUpperCase() + id.slice(1));
}

interface WeltDaten {
  welt: typeof WELTEN[number];
  anzahl: number;
  modus: 'sub' | 'eintraege';
  subs: SubSektion[];
  eintraege: Eintrag[];
}

export function ThemenMega({ onWelt, onEintrag, onSchliessen }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onSchliessen();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSchliessen]);

  const weltDaten: WeltDaten[] = useMemo(() => {
    const alle = alleEintraege() as Eintrag[];
    return WELTEN.map(w => {
      const proWelt = alle.filter(e => e.kategorie.split('/')[0] === w.id);
      const subMap = new Map<string, { name: string; anzahl: number }>();
      let hatSubs = false;
      for (const e of proWelt) {
        const teile = e.kategorie.split('/');
        if (teile.length >= 2) {
          hatSubs = true;
          const pfad = `${teile[0]}/${teile[1]}`;
          const eintrag = subMap.get(pfad) ?? { name: sektionsLabel(teile[1]), anzahl: 0 };
          eintrag.anzahl++;
          subMap.set(pfad, eintrag);
        }
      }
      if (hatSubs) {
        const subs = Array.from(subMap.entries())
          .map(([pfad, { name, anzahl }]) => ({ pfad, name, anzahl }))
          .sort((a, b) => a.name.localeCompare(b.name));
        return { welt: w, anzahl: proWelt.length, modus: 'sub' as const, subs, eintraege: [] };
      }
      // Keine Sub-Sektionen — Eintraege direkt zeigen
      const eintraege = proWelt
        .slice()
        .sort((a, b) => a.titel.localeCompare(b.titel));
      return { welt: w, anzahl: proWelt.length, modus: 'eintraege' as const, subs: [], eintraege };
    });
  }, []);

  return (
    <>
      <div className="themen-mega-backdrop" onClick={onSchliessen} />
      <div className="themen-mega" role="menu">
        <div className="themen-mega-spalten">
          {weltDaten.map(({ welt: w, anzahl, modus, subs, eintraege }) => (
            <div key={w.id} className="themen-mega-spalte">
              <button
                type="button"
                className="themen-mega-welt"
                onClick={() => onWelt(w.id)}
                style={{ ['--welt-farbe' as string]: w.farbe }}
              >
                <span className="themen-mega-symbol">{w.symbol}</span>
                <span className="themen-mega-titel">{w.name}</span>
              </button>

              {modus === 'sub' && subs.length > 0 && (
                <ul className="themen-mega-liste">
                  {subs.slice(0, MAX_PRO_SPALTE).map(s => (
                    <li key={s.pfad}>
                      <button
                        type="button"
                        className="themen-mega-sub"
                        onClick={() => onWelt(w.id)}
                      >
                        <span>{s.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {modus === 'eintraege' && eintraege.length > 0 && (
                <ul className="themen-mega-liste">
                  {eintraege.slice(0, MAX_PRO_SPALTE).map(e => {
                    const ref = refAusId(e.id);
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          className="themen-mega-eintrag"
                          onClick={() => ref && onEintrag(ref)}
                          style={{ borderLeftColor: TYP_FARBE[e.typ] }}
                        >
                          {e.symbol && <span className="themen-mega-eintrag-symbol zodiak-glyph">{e.symbol}</span>}
                          <span className="themen-mega-eintrag-titel">{e.titel}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {anzahl > MAX_PRO_SPALTE && (
                <button
                  type="button"
                  className="themen-mega-alle"
                  onClick={() => onWelt(w.id)}
                >
                  Alle anzeigen →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
