import pflanzenData from '../data/pflanzen.json';
import arbeitenData from '../data/gartenarbeiten.json';
import type { ThunTyp } from './moon';

export type Kategorie = 'frucht' | 'blatt' | 'wurzel' | 'bluete' | 'kraut' | 'baum' | 'beere';
export type KeimerTyp = 'hell' | 'dunkel' | 'indifferent';

export interface Mischkultur {
  gut?: string[];           // pflanzen-ids, die als Begleiter wirken
  schlecht?: string[];      // pflanzen-ids, die als Gegner wirken
  notiz?: string;           // freier Hinweis (Markdown)
}

export interface Pflanze {
  id: string;
  name: string;
  lateinisch: string;
  familie: string;
  kategorie: Kategorie;
  thunTyp: ThunTyp;
  vorzuchtVon: string | null;
  vorzuchtBis: string | null;
  auspflanzenVon: string;
  auspflanzenBis: string;
  ernteVon: string;
  ernteBis: string;
  saattiefeCm: number;
  keimerTyp: KeimerTyp;
  keimtempC: string;
  keimdauerTage: string;
  pflanzabstandCm: number;
  tipps: string;
  vorzucht: boolean;
  // Tiefe Inhalte (alle optional, Texte als Markdown):
  geschichte?: string;      // Herkunft, Wege, Kulturgeschichte
  wirkung?: string;         // Heilwirkung, Naehrwert, Geschmack
  praxis?: string;          // detaillierte Pflege jenseits der Tipps
  mythos?: string;          // kulturelle/spirituelle Bedeutung
  mischkultur?: Mischkultur;
  bezuege?: string[];       // zusaetzliche Wissens-/Arbeits-Bezuege (Format: "wissen:sektion:id" oder "arbeit:id")
}

export interface Gartenarbeit {
  id: string;
  name: string;
  kategorie: string;
  vonMonat: number;
  bisMonat: number;
  thunEmpfehlung: ThunTyp;
  mondPhase: string;
  tipps: string;
  // Tiefe Inhalte (optional, alles Markdown):
  geschichte?: string;      // Tradition, Werkzeugkunde, Herkunft der Methode
  wirkung?: string;         // was die Arbeit bewirkt — Boden, Pflanze, Ertrag
  praxis?: string;          // detaillierte Anleitung jenseits der knappen Tipps
  mythos?: string;          // kulturelle/spirituelle Bedeutung der Handlung
  bezuege?: string[];       // zusaetzliche Wissens-/Pflanzen-Bezuege
}

export const pflanzen = pflanzenData as Pflanze[];
export const gartenarbeiten = arbeitenData as Gartenarbeit[];

export function kategorieLabel(k: Kategorie): string {
  return {
    frucht: 'Frucht',
    blatt: 'Blatt',
    wurzel: 'Wurzel',
    bluete: 'Bluete',
    kraut: 'Kraut',
    baum: 'Baum',
    beere: 'Beere',
  }[k];
}

export function keimerLabel(k: KeimerTyp): string {
  return { hell: 'Lichtkeimer', dunkel: 'Dunkelkeimer', indifferent: 'indifferent' }[k];
}

function inWindow(monat: number, tag: number, von: string | null, bis: string | null): boolean {
  if (!von || !bis) return false;
  const [vM, vT] = von.split('-').map(Number);
  const [bM, bT] = bis.split('-').map(Number);
  const d = monat * 100 + tag;
  const vD = vM * 100 + vT;
  const bD = bM * 100 + bT;
  if (vD <= bD) return d >= vD && d <= bD;
  // Fenster ueber Jahreswechsel (z.B. Gruenkohl-Ernte)
  return d >= vD || d <= bD;
}

export function pflanzenZurVorzucht(monat: number, tag: number = 15): Pflanze[] {
  return pflanzen.filter(p => p.vorzucht && inWindow(monat, tag, p.vorzuchtVon, p.vorzuchtBis));
}

export function pflanzenZumAuspflanzen(monat: number, tag: number = 15): Pflanze[] {
  return pflanzen.filter(p => inWindow(monat, tag, p.auspflanzenVon, p.auspflanzenBis));
}

export function pflanzenZurErnte(monat: number, tag: number = 15): Pflanze[] {
  return pflanzen.filter(p => inWindow(monat, tag, p.ernteVon, p.ernteBis));
}

export function arbeitenImMonat(monat: number): Gartenarbeit[] {
  return gartenarbeiten.filter(a => {
    if (a.vonMonat <= a.bisMonat) return monat >= a.vonMonat && monat <= a.bisMonat;
    return monat >= a.vonMonat || monat <= a.bisMonat;
  });
}
