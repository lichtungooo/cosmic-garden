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

// === Werte-Listen fuer den Steckbrief ===

export type Lichtbedarf = 'sonnig' | 'halbschattig' | 'schattig';
export type Naehrstoffbedarf = 'schwach' | 'mittel' | 'stark';
export type Wasserbedarf = 'gering' | 'mittel' | 'hoch';
export type Lebenszyklus = 'einjaehrig' | 'zweijaehrig' | 'mehrjaehrig';
export type Anfaelligkeit = 'robust' | 'mittel' | 'empfindlich';
export type Sortenempfehlung = 'samenfest' | 'F1' | 'beides';
export type AussaatMethode = 'direktsaat' | 'vorzucht' | 'steckling' | 'knolle' | 'wurzelteilung' | 'pfropfen';
export type MondPhaseEmpfehlung = 'zunehmend' | 'abnehmend' | 'vollmond' | 'neumond';
export type Mondrichtung = 'aufsteigend' | 'absteigend';

export interface Pflanze {
  // === BASIS (Pflicht) ===
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

  // === ERWEITERTE INHALTE (alle optional, Markdown erlaubt wo Texte) ===

  // --- 1. WESEN ---
  herkunft?: string;             // "Anden, Suedamerika"
  lebenszyklus?: Lebenszyklus;
  wuchsform?: string;            // "buschig", "kletternd", "Rosette"
  hoehe?: string;                // "60–180 cm"

  // --- 2. STANDORT & BODEN ---
  licht?: Lichtbedarf;
  bodenart?: string[];           // ["humos", "lehmig", "durchlaessig"]
  phBereich?: string;            // "6.0–7.0 (leicht sauer bis neutral)"
  naehrstoffbedarf?: Naehrstoffbedarf;
  frosthaerte?: string;          // "frostempfindlich" oder "winterhart bis -25°C"

  // --- 3. KOSMISCHER BEZUG (optional bei Zierpflanzen) ---
  aussaatMondphase?: MondPhaseEmpfehlung;
  ernteMondphase?: MondPhaseEmpfehlung;
  mondrichtungAussaat?: Mondrichtung;
  planetenbezug?: string;        // "Mars (Steiner: Frucht-Kraft)"

  // --- 4. AUSSAAT & VORZUCHT (zusaetzlich zu den Pflicht-Feldern) ---
  aussaatMethode?: AussaatMethode;
  vorkulturDauer?: string;       // "6–8 Wochen"
  reihenabstandCm?: number;
  saatzeitNotiz?: string;        // "nach den Eisheiligen ins Freiland"

  // --- 5. PFLEGE ---
  wasserbedarf?: Wasserbedarf;
  duengung?: string;             // "alle 14 Tage Brennnesseljauche waehrend der Fruchtbildung"
  stuetzung?: string;            // "Stab oder Schnur ab 30 cm Höhe"
  rueckschnitt?: string;         // "Geiztriebe woechentlich entfernen"
  mulchen?: string;              // "Strohmulch ab Juni, haelt feucht + warm"
  spezialpflege?: string;        // "Blüten nicht überkopf waessern — Krautfäule"

  // --- 6. ERNTE (zusaetzlich zu ernteVon/Bis) ---
  reifezeichen?: string;         // "tiefrot, weicher Druck"
  erntemethode?: string;         // "von Hand, mit Stielansatz"
  mehrfachernte?: boolean;
  ernteTagestyp?: ThunTyp;       // optimaler Maria-Thun-Tag fuer die Ernte

  // --- 7. VERARBEITUNG & LAGERUNG ---
  trocknung?: string;            // "Schatten, luftig, max. 35°C"
  verarbeitung?: string;         // "Einkochen, Trocknen, Fermentieren"
  lagerung?: string;             // "kuehl + dunkel, 8–12°C, haelt 2 Wochen"
  saatgutGewinnung?: string;     // "Reife Frucht 3 Tage gaeren, ausspuelen, trocknen"

  // --- 8. VERWENDUNG (kompakt) ---
  kueche?: string;               // "roh, gekocht, getrocknet, eingelegt"
  heilkundeKurz?: string;        // ein, zwei Saetze — Tiefe lebt in heil-depot.de

  // --- 9. SCHUTZ & STAERKUNG ---
  schaedlinge?: string[];        // Eintrag-IDs aus wissen_schaedlinge
  krankheiten?: string[];        // Eintrag-IDs aus wissen_schaedlinge
  anfaelligkeit?: Anfaelligkeit;
  staerkungJauche?: string[];    // Eintrag-IDs aus wissen_schaedlinge (Brennnessel, Schachtelhalm, ...)
  vermeiden?: string;            // "keinen frischen Mist — foerdert Krautfäule"
  schutzbegleiter?: string[];    // Pflanzen-IDs (z.B. ["tagetes", "basilikum"])

  // --- 10. SORTEN ---
  sortenempfehlung?: Sortenempfehlung;
  alteSorten?: string[];         // Namen alter samenfester Sorten
  regionenEignung?: string;      // "Norddeutschland im Gewaechshaus, Sueden Freiland"

  // === BESTEHENDE FREITEXT-FELDER (Markdown) ===
  geschichte?: string;           // Herkunft, Wege, Kulturgeschichte
  wirkung?: string;              // Heilwirkung, Naehrwert, Geschmack (knapp halten)
  praxis?: string;               // detaillierte Pflege jenseits der Tipps
  mythos?: string;               // kulturelle/spirituelle Bedeutung
  mischkultur?: Mischkultur;
  bezuege?: string[];            // zusaetzliche Wissens-/Arbeits-Bezuege
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
    bluete: 'Blüte',
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
  // Fenster über Jahreswechsel (z.B. Grünkohl-Ernte)
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
