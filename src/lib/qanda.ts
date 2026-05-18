// Q&A-Storage in localStorage — Fragen, Antworten, Votes.
// Schema lehnt sich an FrageEintrag/AntwortEintrag in datenbank.ts an, aber lebt unabhaengig.

import { nutzerId, nutzerName } from './user';

export type FrageStatus = 'offen' | 'beantwortet' | 'umstritten';

export interface Vote {
  benutzerId: string;
  zeitstempel: number;
}

export interface Frage {
  id: string;
  titel: string;
  text: string;
  pflanzenIds?: string[];
  status: FrageStatus;
  erstellt: number;
  autorId: string;
  autorName: string;
}

export interface Antwort {
  id: string;
  frageId: string;
  autorId: string;
  autorName: string;
  was: string;
  womit?: string;
  wann?: string;
  ergebnis: string;
  kontext?: string;
  votes: Vote[];
  erstellt: number;
}

const FRAGEN_KEY = 'garten.qanda.fragen';
const ANTWORTEN_KEY = 'garten.qanda.antworten';
const SEED_KEY = 'garten.qanda.geseeded';

function lade<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function speicher<T>(key: string, daten: T[]): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(daten)); } catch { /* leise */ }
}

function neueId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// === Seed (Beispieldaten beim ersten Mal) ===

function seedWennNoetig(): void {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(SEED_KEY)) return;
  const vorhandeneFragen = lade<Frage>(FRAGEN_KEY);
  if (vorhandeneFragen.length > 0) {
    // Bereits eigene Fragen — kein Seeding mehr
    localStorage.setItem(SEED_KEY, '1');
    return;
  }
  // Lazy-Import, damit das Seed-Modul nicht im normalen Flow geladen wird
  import('../data/fragen-seed').then(({ generiereSeedDaten }) => {
    const { fragen, antworten } = generiereSeedDaten();
    speicher(FRAGEN_KEY, fragen);
    speicher(ANTWORTEN_KEY, antworten);
    localStorage.setItem(SEED_KEY, '1');
    // Eigenes Event, damit UI sich neu rendert
    window.dispatchEvent(new Event('qanda-seed'));
  });
}

// === Fragen ===

export function alleFragen(): Frage[] {
  seedWennNoetig();
  return lade<Frage>(FRAGEN_KEY)
    .slice()
    .sort((a, b) => b.erstellt - a.erstellt);
}

export function findeFrage(id: string): Frage | undefined {
  return lade<Frage>(FRAGEN_KEY).find(f => f.id === id);
}

export function speichereFrage(
  titel: string,
  text: string,
  pflanzenIds: string[] = [],
): Frage {
  const fragen = lade<Frage>(FRAGEN_KEY);
  const frage: Frage = {
    id: neueId('frage'),
    titel: titel.trim(),
    text: text.trim(),
    pflanzenIds: pflanzenIds.length > 0 ? pflanzenIds : undefined,
    status: 'offen',
    erstellt: Date.now(),
    autorId: nutzerId(),
    autorName: nutzerName(),
  };
  fragen.push(frage);
  speicher(FRAGEN_KEY, fragen);
  return frage;
}

export function aktualisiereFrageStatus(id: string, status: FrageStatus): void {
  const fragen = lade<Frage>(FRAGEN_KEY);
  const f = fragen.find(x => x.id === id);
  if (f) {
    f.status = status;
    speicher(FRAGEN_KEY, fragen);
  }
}

export function loescheFrage(id: string): void {
  const fragen = lade<Frage>(FRAGEN_KEY).filter(f => f.id !== id);
  speicher(FRAGEN_KEY, fragen);
  const antworten = lade<Antwort>(ANTWORTEN_KEY).filter(a => a.frageId !== id);
  speicher(ANTWORTEN_KEY, antworten);
}

// === Antworten ===

export function antwortenZuFrage(frageId: string): Antwort[] {
  return lade<Antwort>(ANTWORTEN_KEY)
    .filter(a => a.frageId === frageId)
    .sort((a, b) => herzAnzahl(b.votes) - herzAnzahl(a.votes) || a.erstellt - b.erstellt);
}

export function speichereAntwort(
  frageId: string,
  was: string,
  ergebnis: string,
  womit?: string,
  wann?: string,
  kontext?: string,
): Antwort {
  const antworten = lade<Antwort>(ANTWORTEN_KEY);
  const antwort: Antwort = {
    id: neueId('antwort'),
    frageId,
    autorId: nutzerId(),
    autorName: nutzerName(),
    was: was.trim(),
    ergebnis: ergebnis.trim(),
    womit: womit?.trim() || undefined,
    wann: wann?.trim() || undefined,
    kontext: kontext?.trim() || undefined,
    votes: [],
    erstellt: Date.now(),
  };
  antworten.push(antwort);
  speicher(ANTWORTEN_KEY, antworten);
  return antwort;
}

export function loescheAntwort(id: string): void {
  const antworten = lade<Antwort>(ANTWORTEN_KEY).filter(a => a.id !== id);
  speicher(ANTWORTEN_KEY, antworten);
}

// === Herzen ===

export function herzAnzahl(votes: Vote[]): number {
  return votes.length;
}

export function meinHerz(votes: Vote[]): boolean {
  const id = nutzerId();
  return votes.some(v => v.benutzerId === id);
}

export function toggleHerz(antwortId: string): void {
  const antworten = lade<Antwort>(ANTWORTEN_KEY);
  const a = antworten.find(x => x.id === antwortId);
  if (!a) return;
  const id = nutzerId();
  const idx = a.votes.findIndex(v => v.benutzerId === id);
  if (idx >= 0) {
    a.votes.splice(idx, 1);
  } else {
    a.votes.push({ benutzerId: id, zeitstempel: Date.now() });
  }
  speicher(ANTWORTEN_KEY, antworten);
}

// === Hilfen ===

export function antwortAnzahl(frageId: string): number {
  return lade<Antwort>(ANTWORTEN_KEY).filter(a => a.frageId === frageId).length;
}

export function statusLabel(s: FrageStatus): string {
  return { offen: 'offen', beantwortet: 'beantwortet', umstritten: 'umstritten' }[s];
}

export function statusFarbe(s: FrageStatus): string {
  return { offen: '#c89b3a', beantwortet: '#4a8a3a', umstritten: '#a8423a' }[s];
}
