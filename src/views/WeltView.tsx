import { useMemo, useState } from 'react';
import { eintraegeNachKategorie } from '../lib/datenbank-suche';
import { welt, type WeltId } from '../lib/welten';
import type { Eintrag, EintragsTyp } from '../lib/datenbank';
import { useDetailNav, refAusId } from '../lib/detail-navigation';

interface Props {
  weltId: WeltId;
}

interface Gruppe {
  pfad: string;            // z.B. "kosmos/tierkreis"
  label: string;
  eintraege: Eintrag[];
}

const TYP_FARBE: Record<EintragsTyp, string> = {
  pflanze: '#4a7c3a',
  arbeit:  '#5b3a8a',
  wissen:  '#3b4b6b',
  frage:   '#c89b3a',
  antwort: '#a8423a',
};

const KATEGORIE_LABEL: Record<string, string> = {
  // Kosmos
  tierkreis: 'Tierkreis',
  mond:      'Mond',
  sonne:     'Sonne',
  kalender:  'Kalender-Systeme',
  maya:      'Maya',
  bruecken:  'Bruecken',
  pilze:     'Pilze',
  indoor:    'Indoor-Anbau',
  naturmagier: 'Naturmagier',
  saatgut:   'Saatgut & Sortenerhalt',
  schaedlinge: 'Schädlinge & Bekämpfung',
  // Pflanzen
  frucht: 'Fruchtgemüse',
  blatt:  'Blattgemüse',
  wurzel: 'Wurzelgemüse',
  bluete: 'Blütenpflanzen',
  kraut:  'Kräuter',
  baum:   'Obstbäume',
  beere:  'Beerenobst',
  // Praxis (Arbeiten-Kategorien)
  schnitt:      'Schnitt',
  veredelung:   'Veredelung',
  boden:        'Boden',
  rasen:        'Rasen',
  pflanzung:    'Pflanzung',
  pflege:       'Pflege',
  ernte:        'Ernte',
  winterschutz: 'Winterschutz',
  planung:      'Planung',
  wissen:       'Methoden & Wissen',
};

function gruppenLabel(pfad: string): string {
  const teile = pfad.split('/');
  const letzter = teile[teile.length - 1];
  return KATEGORIE_LABEL[letzter] ?? (letzter.charAt(0).toUpperCase() + letzter.slice(1));
}

export function WeltView({ weltId }: Props) {
  const w = welt(weltId);
  const nav = useDetailNav();
  // Lokale Suche entfernt — die globale Suche oben im Header gilt für alle Welten.
  const filter = '';

  const alle = useMemo(() => eintraegeNachKategorie(`${weltId}/`).concat(
    // Einträge deren Kategorie genau die Welt ist (z.B. "schulen" flach)
    eintraegeNachKategorie(weltId).filter(e => e.kategorie === weltId)
  ), [weltId]);

  const gefiltert = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return alle;
    return alle.filter(e =>
      e.titel.toLowerCase().includes(q) ||
      e.untertitel?.toLowerCase().includes(q) ||
      e.kurz.toLowerCase().includes(q) ||
      e.tags.some(t => t.includes(q))
    );
  }, [alle, filter]);

  const gruppen: Gruppe[] = useMemo(() => {
    const map = new Map<string, Eintrag[]>();
    for (const e of gefiltert) {
      // Untergruppe = zweite Ebene oder "alles" wenn nur Welt
      const teile = e.kategorie.split('/');
      const pfad = teile.length >= 2 ? `${teile[0]}/${teile[1]}` : teile[0];
      const liste = map.get(pfad) ?? [];
      liste.push(e);
      map.set(pfad, liste);
    }
    return Array.from(map.entries())
      .map(([pfad, eintraege]) => ({
        pfad,
        label: gruppenLabel(pfad),
        eintraege: eintraege.slice().sort((a, b) => a.titel.localeCompare(b.titel)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [gefiltert]);

  function oeffnen(e: Eintrag) {
    const ref = refAusId(e.id);
    if (ref) nav.oeffne(ref);
  }

  function gruppenAnker(pfad: string): string {
    return `welt-${pfad.replace(/\//g, '-')}`;
  }

  function springeZu(pfad: string) {
    const el = document.getElementById(gruppenAnker(pfad));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="welt-view">
      <header className="welt-hero">
        <span className="welt-hero-eyebrow">Welt · {w.name}</span>
        <h1 className="welt-hero-titel">{w.name}</h1>
        <p className="welt-hero-lead">{w.beschreibung}</p>
        <div className="welt-kopf-meta">
          <span className="welt-zaehler">{gefiltert.length} Einträge</span>
        </div>
      </header>

      {gruppen.length > 1 && (
        <nav className="welt-kategorien-leiste">
          {gruppen.map(g => (
            <button
              key={g.pfad}
              type="button"
              className="welt-kategorie-link"
              onClick={() => springeZu(g.pfad)}
            >
              {g.label}
            </button>
          ))}
        </nav>
      )}

      {gruppen.length === 0 ? (
        <p className="welt-leer">Keine Einträge.</p>
      ) : (
        gruppen.map(g => (
          <section key={g.pfad} id={gruppenAnker(g.pfad)} className="welt-gruppe">
            <header className="welt-gruppe-kopf">
              <h2>{g.label}</h2>
              <span className="welt-gruppe-zahl">{g.eintraege.length}</span>
            </header>
            <div className="welt-grid">
              {g.eintraege.map(e => (
                <article
                  key={e.id}
                  className="welt-karte"
                  style={{ borderLeftColor: TYP_FARBE[e.typ] }}
                  onClick={() => oeffnen(e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={ev => { if (ev.key === 'Enter') oeffnen(e); }}
                >
                  <header className="welt-karte-kopf">
                    {e.symbol && <span className="welt-karte-symbol zodiak-glyph">{e.symbol}</span>}
                    <div className="welt-karte-titel">
                      <h3>{e.titel}</h3>
                      {e.untertitel && <span className="welt-karte-untertitel">{e.untertitel}</span>}
                    </div>
                  </header>
                  <p className="welt-karte-kurz">{e.kurz}</p>
                  {e.tags.length > 0 && (
                    <div className="welt-karte-tags">
                      {e.tags.slice(0, 4).map(t => (
                        <span key={t} className="welt-karte-tag">{t}</span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
