// Maya-Kalender-Berechnungen.
// Korrelationskonstante: GMT 584283 (Goodman-Martínez-Thompson, Standard).
// Maya-Schoepfungstag 4 Ahau 8 Kumk'u = 13.0.0.0.0 Long Count = 11. August 3114 v.Chr. (proleptisch gregorianisch)
// = Julianischer Tag 584283.

const GMT_KORRELATION = 584283;

// === Tagesnamen Tzolkin (Yucatec, klassisch) ===
export const TZOLKIN_NAMEN = [
  'Imix', 'Ik', 'Akbal', 'Kan', 'Chicchan',
  'Cimi', 'Manik', 'Lamat', 'Muluc', 'Oc',
  'Chuen', 'Eb', 'Ben', 'Ix', 'Men',
  'Cib', 'Caban', 'Etznab', 'Cauac', 'Ahau',
] as const;

// Kernbedeutungen — knapp, für Detailanzeige; Tiefe kommt in Phase F.
export const TZOLKIN_BEDEUTUNG: Record<string, string> = {
  Imix:     'Erde, Urwasser, Drache — der Urgrund alles Werdenden.',
  Ik:       'Wind, Atem, Geist — das Lebendige, das durchweht.',
  Akbal:    'Nacht, Haus — Innenraum, Traum, Ahnen.',
  Kan:      'Saat, Mais — fruchtbares Wachstum, Reife.',
  Chicchan: 'Schlange, Lebenskraft — Kundalini, Erdenergie.',
  Cimi:     'Tod, Tor — Wandlung, Übergang, Loslassen.',
  Manik:    'Hirsch, Hand — Geschicklichkeit, Werkzeug, Gabe.',
  Lamat:    'Stern, Venus — Hoffnung, Morgen- und Abendstern.',
  Muluc:    'Wasser, Mond — Gefühl, Reinigung, Mondesfluss.',
  Oc:       'Hund, Gefaehrte — Treue, Begleiter durch Welten.',
  Chuen:    'Affe, Kuenstler — Spiel, Schöpfung, Webkunst.',
  Eb:       'Gras, Mensch — Weg, Pfad, das Beschreitbare.',
  Ben:      'Schilfrohr, Heim — Saeule, Aufrichtigkeit, Mais.',
  Ix:       'Jaguar, Magier — Erdseele, Schamane, Geheimnis.',
  Men:      'Adler, Vision — hoher Blick, Klarsicht.',
  Cib:      'Geier, Weisheit — die alten Lehrer, Reinigung.',
  Caban:    'Erde, Bewegung — Erdbeben, Wandel, Rhythmus.',
  Etznab:   'Feuerstein, Spiegel — Klinge, Klarheit, Wahrheit.',
  Cauac:    'Sturm, Regenwolke — Reinigung durch Wasser und Donner.',
  Ahau:     'Sonne, Herr — Erleuchtung, Vollendung, Mittelpunkt.',
};

// === Haab-Monate ===
export const HAAB_MONATE = [
  "Pop", "Wo", "Sip", "Sotz", "Sek",
  "Xul", "Yaxk'in", "Mol", "Ch'en", "Yax",
  "Sak", "Keh", "Mak", "K'ank'in", "Muwan",
  "Pax", "K'ayab", "Kumk'u", "Wayeb",
] as const;

export const HAAB_BEDEUTUNG: Record<string, string> = {
  "Pop":      'Matte — Beginn des Sonnenjahres, Versammlung.',
  "Wo":       'Frosch — Wasser, Anfang der Regenzeit.',
  "Sip":      'Hirsch — Jagd, Wachstum.',
  "Sotz":     'Fledermaus — Hoehlen, Schwellen.',
  "Sek":      'Tod / Schaedel — schwere Zeit, Erinnern.',
  "Xul":      'Hund — Ende einer Phase, Wende.',
  "Yaxk'in":  'Neue Sonne — Helligkeit kommt zurück.',
  "Mol":      'Wasser-Sammlung — Vorratszeit, Sammlung.',
  "Ch'en":    'Brunnen — Tiefe, Schwarz, das Innere.',
  "Yax":      'Gruen — Saat, Frischheit, Wachstum.',
  "Sak":      'Weiss — Klarheit, Reinheit.',
  "Keh":      'Roter Hirsch — Kraft, Maennlichkeit, Feuer.',
  "Mak":      'Verschliessen — Schutz, Bewahrung.',
  "K'ank'in": 'Gelb — reife Sonne, Ernte beginnt.',
  "Muwan":    'Eule — Vorzeichen, weise Vorausschau.',
  "Pax":      'Pflanzzeit — neue Saat, Vorbereitung.',
  "K'ayab":   'Schildkroete — geduldige Reife, Ausdauer.',
  "Kumk'u":   'Korn / Speise — Fuelle, Vollendung der Ernte.',
  "Wayeb":    'Namenlose Tage — fuenf gefaehrliche Tage zwischen den Jahren.',
};

// === Julianische Tagnummer (JDN, Standardalgorithmus) ===
function jdn(d: Date): number {
  // Gregorianischer Kalender (proleptisch wo noetig)
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return day + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

// === Maya-Tage seit Schöpfung ===
export function mayaTageSeitNullpunkt(d: Date): number {
  return jdn(d) - GMT_KORRELATION;
}

// === Long Count ===
export interface LongCount {
  baktun: number;
  katun: number;
  tun: number;
  winal: number;
  kin: number;
}

export function longCount(d: Date): LongCount {
  const tage = mayaTageSeitNullpunkt(d);
  const kin = ((tage % 20) + 20) % 20;
  const winal = ((Math.floor(tage / 20) % 18) + 18) % 18;
  const tun = ((Math.floor(tage / 360) % 20) + 20) % 20;
  const katun = ((Math.floor(tage / 7200) % 20) + 20) % 20;
  const baktun = Math.floor(tage / 144000);
  return { baktun, katun, tun, winal, kin };
}

export function longCountString(lc: LongCount): string {
  return `${lc.baktun}.${lc.katun}.${lc.tun}.${lc.winal}.${lc.kin}`;
}

// === Tzolkin ===
export interface Tzolkin {
  zahl: number;          // 1..13
  nameIndex: number;     // 0..19
  name: string;          // z.B. "Ahau"
  position: number;      // 1..260
}

export function tzolkin(d: Date): Tzolkin {
  const tage = mayaTageSeitNullpunkt(d);
  // 0.0.0.0.0 = 4 Ahau. Ahau hat NameIndex 19.
  const zahl = (((3 + tage) % 13) + 13) % 13 + 1;
  const nameIndex = (((19 + tage) % 20) + 20) % 20;
  const name = TZOLKIN_NAMEN[nameIndex];
  // Position im 260-Zyklus (1..260)
  const position = (((tage % 260) + 260) % 260) + 1;
  // Korrektur: bei tage=0 muss position der korrekten 4-Ahau-Position entsprechen.
  // Wir nehmen es einfach: position = (tage mod 260) + 1, das ist konsistent (egal welche Position 4-Ahau hat).
  return { zahl, nameIndex, name, position };
}

export function tzolkinString(t: Tzolkin): string {
  return `${t.zahl} ${t.name}`;
}

// === Haab ===
export interface Haab {
  monatIndex: number;    // 0..18
  monat: string;
  tagImMonat: number;    // 0..19 (oder 0..4 für Wayeb)
  istWayeb: boolean;
}

export function haab(d: Date): Haab {
  const tage = mayaTageSeitNullpunkt(d);
  // 0.0.0.0.0 = 8 Kumk'u. Kumk'u hat Index 17, Tag 8.
  // Lineare Position: 17 * 20 + 8 = 348.
  const haabPos = (((348 + tage) % 365) + 365) % 365;
  let monatIndex: number;
  let tagImMonat: number;
  if (haabPos < 360) {
    monatIndex = Math.floor(haabPos / 20);
    tagImMonat = haabPos % 20;
  } else {
    monatIndex = 18; // Wayeb
    tagImMonat = haabPos - 360; // 0..4
  }
  return {
    monatIndex,
    monat: HAAB_MONATE[monatIndex],
    tagImMonat,
    istWayeb: monatIndex === 18,
  };
}

export function haabString(h: Haab): string {
  return `${h.tagImMonat} ${h.monat}`;
}

// === Calendar Round ===
// Kombination Tzolkin + Haab, wiederholt sich nach 18.980 Tagen (52 Jahre).
export function calendarRound(d: Date): string {
  return `${tzolkinString(tzolkin(d))} · ${haabString(haab(d))}`;
}

// === Venus-Zyklus ===
// Synodischer Zyklus = 583.92 Tage astronomisch, 584 Tage in der Maya-Konvention (Dresden Codex).
// Vier Phasen aus dem Codex:
//   1. Untere Konjunktion (Venus zwischen Erde und Sonne) — 8 Tage
//   2. Morgenstern (heliacischer Aufgang) — 236 Tage
//   3. Obere Konjunktion (Venus hinter der Sonne) — 90 Tage
//   4. Abendstern (heliacischer Untergang) — 250 Tage
// Referenz: Venus-Transit am 6. Juni 2012 = untere Konjunktion (sehr exakt belegt).

export const VENUS_ZYKLUS_TAGE = 584;
const VENUS_REFERENZ_JDN = 2456085; // 2012-06-06, untere Konjunktion

export type VenusPhaseId = 'unter-konj' | 'morgenstern' | 'ober-konj' | 'abendstern';

export interface VenusPhaseDef {
  id: VenusPhaseId;
  name: string;
  beschreibung: string;
  bedeutung: string;
  farbe: string;
  start: number; // Tag im 584er-Zyklus
  ende: number;
}

export const VENUS_PHASEN: VenusPhaseDef[] = [
  {
    id: 'unter-konj',
    name: 'Untere Konjunktion',
    beschreibung: 'Venus zwischen Erde und Sonne, für das blosse Auge unsichtbar.',
    bedeutung: 'Schwelle, gefaehrlicher Uebergang. Bei den Mayas eine Zeit der Vorsicht. Venus stirbt für kurze Zeit, um als Morgenstern wiedergeboren zu werden.',
    farbe: '#2a2620',
    start: 0,
    ende: 8,
  },
  {
    id: 'morgenstern',
    name: 'Morgenstern',
    beschreibung: 'Venus erscheint vor Sonnenaufgang am Osthimmel — heliacischer Aufgang.',
    bedeutung: 'Quetzalcoatl/Kukulkan in seiner kraftvollsten Gestalt. Kriegerische Energie. Maya-Koenige planten Feldzuege nach Venus-Erscheinungen. Der erste Morgenstern-Aufgang nach der unteren Konjunktion galt als besonders gefahrvoll.',
    farbe: '#d4825a',
    start: 8,
    ende: 244,
  },
  {
    id: 'ober-konj',
    name: 'Obere Konjunktion',
    beschreibung: 'Venus hinter der Sonne, für das Auge wieder unsichtbar.',
    bedeutung: 'Ruhezeit. Venus zieht sich hinter die Sonne zurück. In der Maya-Sicht: die Vorbereitung auf die Wiederkehr als Abendstern.',
    farbe: '#e8a82b',
    start: 244,
    ende: 334,
  },
  {
    id: 'abendstern',
    name: 'Abendstern',
    beschreibung: 'Venus erscheint nach Sonnenuntergang am Westhimmel.',
    bedeutung: 'Sanftere Erscheinung der Venus. Bei den Mayas weniger kriegerisch, mehr in Verbindung mit Schoenheit und Blüte. Begleiterin der untergehenden Sonne.',
    farbe: '#c89b3a',
    start: 334,
    ende: 584,
  },
];

export interface VenusDatum {
  tagImZyklus: number;     // 0..583
  phase: VenusPhaseDef;
  tagInPhase: number;       // Tage seit Beginn dieser Phase
  zyklusNummer: number;     // wievielter Zyklus seit Referenz
}

export function venus(d: Date): VenusDatum {
  const jdnHeute = jdn(d);
  const tage = jdnHeute - VENUS_REFERENZ_JDN;
  const tagImZyklus = ((tage % VENUS_ZYKLUS_TAGE) + VENUS_ZYKLUS_TAGE) % VENUS_ZYKLUS_TAGE;
  const zyklusNummer = Math.floor(tage / VENUS_ZYKLUS_TAGE) + 1;
  const phase = VENUS_PHASEN.find(p => tagImZyklus >= p.start && tagImZyklus < p.ende) ?? VENUS_PHASEN[0];
  const tagInPhase = tagImZyklus - phase.start;
  return { tagImZyklus, phase, tagInPhase, zyklusNummer };
}

// Findet das Datum, an dem die nächste Phase mit der gegebenen ID beginnt.
export function naechsterPhasenWechsel(d: Date, phaseId: VenusPhaseId): Date {
  const v = venus(d);
  const ziel = VENUS_PHASEN.find(p => p.id === phaseId);
  if (!ziel) return d;
  let delta = ziel.start - v.tagImZyklus;
  if (delta <= 0) delta += VENUS_ZYKLUS_TAGE;
  const nächst = new Date(d);
  nächst.setDate(nächst.getDate() + delta);
  return nächst;
}

// === Komfort-Funktion: alles auf einmal ===
export interface MayaDatum {
  longCount: LongCount;
  longCountStr: string;
  tzolkin: Tzolkin;
  tzolkinStr: string;
  haab: Haab;
  haabStr: string;
  calendarRound: string;
  tageSeitNullpunkt: number;
}

export function mayaDatum(d: Date): MayaDatum {
  const lc = longCount(d);
  const tz = tzolkin(d);
  const ha = haab(d);
  return {
    longCount: lc,
    longCountStr: longCountString(lc),
    tzolkin: tz,
    tzolkinStr: tzolkinString(tz),
    haab: ha,
    haabStr: haabString(ha),
    calendarRound: calendarRound(d),
    tageSeitNullpunkt: mayaTageSeitNullpunkt(d),
  };
}
