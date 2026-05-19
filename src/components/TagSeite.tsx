// Tag-Filter-Seite: zeigt alle Einträge, die einen bestimmten Tag tragen.
// Gruppiert nach Welt und Typ. Klick auf Eintrag legt ihn auf den Stack.

import { useMemo } from 'react';
import { alleEintraege } from '../lib/datenbank-suche';
import { vokabular } from '../lib/datenbank-adapter';
import { WELTEN, weltAusKategorie, type WeltId } from '../lib/welten';
import type { Eintrag, EintragsTyp } from '../lib/datenbank';
import { useDetailNav, refAusId } from '../lib/detail-navigation';

const GRUPPEN_LABEL: Record<string, string> = {
  tagestyp:     'Tagestyp (Maria Thun)',
  mondphase:    'Mondphase',
  mondbahn:     'Mondbahn',
  jahreszeit:   'Jahreszeit',
  anbau:        'Anbau',
  praxis:       'Praxis',
  keimung:      'Keimung',
  pflanzentyp:  'Pflanzenart',
  schule:       'Garten-Schule',
  maya:         'Maya-Kalender',
  astrologie:   'Astrologie',
  schaedling:   'Schädlinge',
  krankheit:    'Krankheiten',
  wildpflanze:  'Wildpflanze',
  mittel:       'Mittel',
};

const TYP_LABEL: Record<EintragsTyp, string> = {
  pflanze: 'Pflanze',
  arbeit:  'Arbeit',
  wissen:  'Wissen',
  frage:   'Frage',
  antwort: 'Antwort',
};

const TYP_FARBE: Record<EintragsTyp, string> = {
  pflanze: '#4a7c3a',
  arbeit:  '#5b3a8a',
  wissen:  '#3b4b6b',
  frage:   '#c89b3a',
  antwort: '#a8423a',
};

interface Props {
  tag: string;
}

export function TagSeite({ tag }: Props) {
  const nav = useDetailNav();
  const def = vokabular.kuratiert[tag];

  const treffer = useMemo(() => {
    return alleEintraege()
      .filter(e => e.tags.includes(tag))
      .sort((a, b) => a.titel.localeCompare(b.titel));
  }, [tag]);

  // Gruppieren nach Welt
  const proWelt = useMemo(() => {
    const map = new Map<WeltId | 'unbekannt', Eintrag[]>();
    for (const e of treffer) {
      const w = weltAusKategorie(e.kategorie) ?? 'unbekannt';
      const liste = map.get(w) ?? [];
      liste.push(e);
      map.set(w, liste);
    }
    return map;
  }, [treffer]);

  function oeffnen(e: Eintrag) {
    const ref = refAusId(e.id);
    if (ref) nav.oeffne(ref);
  }

  return (
    <article className="tag-seite">
      <header className="tag-kopf">
        <span className="tag-kopf-symbol">#</span>
        <div>
          <h1>{def?.name ?? tag}</h1>
          {def && (
            <p className="tag-kopf-meta">
              <span className="tag-kopf-gruppe">{GRUPPEN_LABEL[def.gruppe] ?? def.gruppe}</span>
            </p>
          )}
          {def?.beschreibung && <p className="tag-kopf-beschreibung">{def.beschreibung}</p>}
        </div>
      </header>

      {treffer.length === 0 && (
        <p className="tag-leer">Kein Eintrag traegt dieses Zeichen.</p>
      )}

      {WELTEN.map(w => {
        const liste = proWelt.get(w.id) ?? [];
        if (liste.length === 0) return null;
        return (
          <section key={w.id} className="tag-welt-block">
            <header className="tag-welt-kopf" style={{ borderLeftColor: w.farbe }}>
              <span className="tag-welt-symbol" style={{ color: w.farbe }}>{w.symbol}</span>
              <h2 style={{ color: w.farbe }}>{w.name}</h2>
            </header>
            <div className="tag-grid">
              {liste.map(e => (
                <button
                  key={e.id}
                  type="button"
                  className="tag-karte"
                  style={{ borderLeftColor: TYP_FARBE[e.typ] }}
                  onClick={() => oeffnen(e)}
                >
                  <div className="tag-karte-meta">
                    <span className="tag-karte-typ" style={{ color: TYP_FARBE[e.typ] }}>
                      {TYP_LABEL[e.typ]}
                    </span>
                  </div>
                  <div className="tag-karte-titel-zeile">
                    {e.symbol && <span className="tag-karte-symbol zodiak-glyph">{e.symbol}</span>}
                    <span className="tag-karte-titel">{e.titel}</span>
                  </div>
                  <span className="tag-karte-kurz">{e.kurz}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </article>
  );
}
