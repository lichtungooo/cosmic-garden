// Lookup- und Such-Funktionen ueber die einheitliche Datenbank.
// Mit MiniSearch-Index fuer Volltext + Tag-Filter (Phase 4 erledigt 16.05.2026).

import MiniSearch from 'minisearch';
import type {
  Eintrag,
  EintragsTyp,
  Tagestyp,
  Jahreszeit,
  Mondphase,
  BeziehungsArt,
  BacklinkEintrag,
} from './datenbank';
import { ladeDatenbank } from './datenbank-adapter';

// === Einzel-Lookup ===

export function findeEintrag(id: string): Eintrag | undefined {
  return ladeDatenbank().eintraege.find(e => e.id === id);
}

export function findeMehrere(ids: string[]): Eintrag[] {
  const db = ladeDatenbank();
  return ids
    .map(id => db.eintraege.find(e => e.id === id))
    .filter((e): e is Eintrag => e != null);
}

// === Sammlungen nach Typ ===

export function alleEintraege(): Eintrag[] {
  return ladeDatenbank().eintraege;
}

export function eintraegeNachTyp(typ: EintragsTyp): Eintrag[] {
  return ladeDatenbank().eintraege.filter(e => e.typ === typ);
}

export function eintraegeNachKategorie(kategoriePraefix: string): Eintrag[] {
  return ladeDatenbank().eintraege.filter(e => e.kategorie.startsWith(kategoriePraefix));
}

// === Tag-Filter ===

export function eintraegeMitTag(tag: string): Eintrag[] {
  return ladeDatenbank().eintraege.filter(e => e.tags.includes(tag));
}

export function eintraegeMitAllenTags(tags: string[]): Eintrag[] {
  return ladeDatenbank().eintraege.filter(e => tags.every(t => e.tags.includes(t)));
}

export function eintraegeMitEinemTag(tags: string[]): Eintrag[] {
  return ladeDatenbank().eintraege.filter(e => tags.some(t => e.tags.includes(t)));
}

// === Beziehungen / Backlinks ===

export function backlinksFuer(id: string): BacklinkEintrag[] {
  return ladeDatenbank().backlinks.get(id) ?? [];
}

export function beziehungenVon(id: string, art?: BeziehungsArt): Eintrag[] {
  const e = findeEintrag(id);
  if (!e) return [];
  const ziele = e.beziehungen.filter(b => art == null || b.art === art);
  return findeMehrere(ziele.map(b => b.zielId));
}

// === MiniSearch-Index (lazy-init) ===

interface IndexDocument {
  id: string;
  titel: string;
  untertitel: string;
  kurz: string;
  inhalt: string;
  tagText: string;        // Tags als Text fuer Suche
  typ: EintragsTyp;
  kategorie: string;
  tags: string[];
  bloeckeTitel: string;
}

let suchIndex: MiniSearch<IndexDocument> | null = null;
let dokumente: Map<string, IndexDocument> | null = null;

function buildIndex() {
  const db = ladeDatenbank();
  const docs: IndexDocument[] = db.eintraege.map(e => ({
    id: e.id,
    titel: e.titel,
    untertitel: e.untertitel ?? '',
    kurz: e.kurz,
    inhalt: e.bloecke.map(b => b.text).join(' '),
    bloeckeTitel: e.bloecke.map(b => b.titel).join(' '),
    tagText: e.tags.join(' '),
    typ: e.typ,
    kategorie: e.kategorie,
    tags: e.tags,
  }));

  const idx = new MiniSearch<IndexDocument>({
    idField: 'id',
    fields: ['titel', 'untertitel', 'kurz', 'inhalt', 'bloeckeTitel', 'tagText'],
    storeFields: ['id', 'typ', 'tags', 'kategorie'],
    searchOptions: {
      boost: { titel: 4, untertitel: 3, kurz: 2, tagText: 2 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
    },
  });
  idx.addAll(docs);

  suchIndex = idx;
  dokumente = new Map(docs.map(d => [d.id, d]));
}

function ensureIndex() {
  if (!suchIndex || !dokumente) buildIndex();
}

// === Volltextsuche mit MiniSearch ===

export interface SuchTreffer {
  eintrag: Eintrag;
  punkte: number;
}

export interface SuchOptionen {
  typen?: EintragsTyp[];
  tags?: string[];
  kategoriePraefix?: string;
}

export function sucheVolltext(query: string, optionen: SuchOptionen = {}): SuchTreffer[] {
  ensureIndex();
  const q = query.trim();
  if (q.length < 2) return [];

  const ergebnisse = suchIndex!.search(q, {
    filter: result => {
      if (optionen.typen && optionen.typen.length > 0) {
        if (!optionen.typen.includes(result.typ as EintragsTyp)) return false;
      }
      if (optionen.tags && optionen.tags.length > 0) {
        const docTags = result.tags as string[];
        if (!optionen.tags.every(t => docTags.includes(t))) return false;
      }
      if (optionen.kategoriePraefix) {
        if (!(result.kategorie as string).startsWith(optionen.kategoriePraefix)) return false;
      }
      return true;
    },
  });

  return ergebnisse
    .map(r => {
      const e = findeEintrag(r.id);
      return e ? { eintrag: e, punkte: r.score } : null;
    })
    .filter((x): x is SuchTreffer => x != null);
}

// Vorschlaege fuer Auto-Complete
export function sucheVorschlaege(query: string, anzahl = 8): string[] {
  ensureIndex();
  const q = query.trim();
  if (q.length < 1) return [];
  const vorschlaege = suchIndex!.autoSuggest(q, { fuzzy: 0.2 });
  return vorschlaege.slice(0, anzahl).map(v => v.suggestion);
}

// Cache invalidieren, falls Daten geaendert wurden (kommt spaeter relevant)
export function indexNeuAufbauen() {
  suchIndex = null;
  dokumente = null;
}

// === Kontextuelle "Heute relevant"-Filterung ===

export interface AstroKontext {
  monat: number;          // 1..12
  tagestyp: Tagestyp;
  jahreszeit: Jahreszeit;
  mondphase?: Mondphase;
}

export function relevanzPunkte(e: Eintrag, kontext: AstroKontext): number {
  const t = e.zeitbezug;
  if (!t) return 0;
  let punkte = 0;
  if (t.monate?.includes(kontext.monat))                punkte += 3;
  if (t.tagestypen?.includes(kontext.tagestyp))         punkte += 2;
  if (t.jahreszeiten?.includes(kontext.jahreszeit))     punkte += 1;
  if (kontext.mondphase && t.mondphasen?.includes(kontext.mondphase)) punkte += 2;
  return punkte;
}

export interface HeuteRelevant {
  eintrag: Eintrag;
  punkte: number;
}

export function heuteRelevanteEintraege(kontext: AstroKontext, mindestPunkte = 2): HeuteRelevant[] {
  const out: HeuteRelevant[] = [];
  for (const e of ladeDatenbank().eintraege) {
    const punkte = relevanzPunkte(e, kontext);
    if (punkte >= mindestPunkte) out.push({ eintrag: e, punkte });
  }
  return out.sort((a, b) => b.punkte - a.punkte);
}

// === Statistik ===

export function statistik() {
  const db = ladeDatenbank();
  const alle = db.eintraege;
  const proTyp: Record<EintragsTyp, number> = {
    pflanze: 0, arbeit: 0, wissen: 0, frage: 0, antwort: 0,
  };
  for (const e of alle) proTyp[e.typ]++;

  const alleTags = new Set<string>();
  for (const e of alle) for (const t of e.tags) alleTags.add(t);

  return {
    anzahlEintraege: alle.length,
    proTyp,
    anzahlTags: alleTags.size,
    anzahlBacklinks: db.backlinks.size,
  };
}
