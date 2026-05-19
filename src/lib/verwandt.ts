// Verwandt-Logik: für einen Eintrag die thematisch verbundenen Einträge finden.
// Drei Quellen werden zusammengefuehrt:
//   1. Explizite Beziehungen (handgesetzt in e.beziehungen)
//   2. Backlinks (andere zeigen auf diesen Eintrag)
//   3. Tag-Resonanz (Einträge mit ueberlappenden Tags)

import type { Eintrag, BeziehungsArt } from './datenbank';
import { alleEintraege, backlinksFuer, findeEintrag } from './datenbank-suche';

export interface VerwandtTreffer {
  eintrag: Eintrag;
  punkte: number;          // höher = naeher verwandt
  quellen: VerwandtQuelle[];
  art?: BeziehungsArt;     // erste passende Beziehungsart (für Label)
}

export type VerwandtQuelle = 'explizit' | 'backlink' | 'tags';

export interface VerwandtOptionen {
  maxTreffer?: number;
  mindestPunkte?: number;
  eigenenAusschliessen?: boolean;     // Pflanze in Pflanzen-Welt etc.
}

const PUNKTE_EXPLIZIT = 10;
const PUNKTE_BACKLINK = 7;
const PUNKTE_TAG_GEMEINSAM = 2;

export function verwandtFuer(id: string, optionen: VerwandtOptionen = {}): VerwandtTreffer[] {
  const { maxTreffer = 12, mindestPunkte = 1 } = optionen;
  const quelle = findeEintrag(id);
  if (!quelle) return [];

  const treffer = new Map<string, { punkte: number; quellen: Set<VerwandtQuelle>; art?: BeziehungsArt }>();

  function plus(zielId: string, p: number, q: VerwandtQuelle, art?: BeziehungsArt) {
    if (zielId === id) return;
    const t = treffer.get(zielId) ?? { punkte: 0, quellen: new Set(), art };
    t.punkte += p;
    t.quellen.add(q);
    if (art && !t.art) t.art = art;
    treffer.set(zielId, t);
  }

  // 1. Explizite Beziehungen
  for (const b of quelle.beziehungen) {
    plus(b.zielId, PUNKTE_EXPLIZIT, 'explizit', b.art);
  }

  // 2. Backlinks
  for (const bl of backlinksFuer(id)) {
    plus(bl.vonId, PUNKTE_BACKLINK, 'backlink', bl.art);
  }

  // 3. Tag-Resonanz
  if (quelle.tags.length > 0) {
    const meineTags = new Set(quelle.tags);
    for (const other of alleEintraege()) {
      if (other.id === id) continue;
      let gemeinsam = 0;
      for (const t of other.tags) {
        if (meineTags.has(t)) gemeinsam++;
      }
      if (gemeinsam > 0) {
        plus(other.id, gemeinsam * PUNKTE_TAG_GEMEINSAM, 'tags');
      }
    }
  }

  // In Treffer-Liste umwandeln
  const liste: VerwandtTreffer[] = [];
  for (const [zielId, t] of treffer) {
    if (t.punkte < mindestPunkte) continue;
    const e = findeEintrag(zielId);
    if (!e) continue;
    liste.push({
      eintrag: e,
      punkte: t.punkte,
      quellen: Array.from(t.quellen),
      art: t.art,
    });
  }

  liste.sort((a, b) => b.punkte - a.punkte || a.eintrag.titel.localeCompare(b.eintrag.titel));
  return liste.slice(0, maxTreffer);
}

// Einträge mit gleichem Tag finden (für klickbare Tag-Chips)
export function eintraegeMitTag(tag: string, ausserId?: string): Eintrag[] {
  return alleEintraege()
    .filter(e => e.tags.includes(tag) && e.id !== ausserId)
    .sort((a, b) => a.titel.localeCompare(b.titel));
}

// Label für die Beziehungs-Art
export function beziehungsLabel(art?: BeziehungsArt): string {
  if (!art) return 'Verwandt';
  return ({
    'verwandt':      'Verwandt',
    'praxis-fuer':   'Praxis für',
    'wirkt-an':      'Wirkt an',
    'tradition-von': 'Tradition von',
    'gehoert-zu':    'Gehoert zu',
    'antwort-zu':    'Antwort zu',
    'erwaehnt':      'Erwaehnt',
    'begleiter':     'Begleiter',
    'gegner':        'Mischkultur-Gegner',
  } as Record<BeziehungsArt, string>)[art];
}
