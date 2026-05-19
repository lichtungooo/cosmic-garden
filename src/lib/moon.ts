// Mondberechnung mit vereinfachten Meeus-Formeln.
// Genauigkeit ca. 0.3 Grad — ausreichend für Maria-Thun-Kalender.
// Siderischer Tierkreis (Lahiri-Ayanamsa) wie in der biodynamischen Tradition.

export type ThunTyp = 'wurzel' | 'blatt' | 'bluete' | 'frucht';
export type Element = 'erde' | 'wasser' | 'luft' | 'feuer';
export type MondPhase = 'neumond' | 'zunehmend' | 'halbmond-zu' | 'vollmond' | 'halbmond-ab' | 'abnehmend';
export type Aufstieg = 'aufsteigend' | 'absteigend';

export interface TierkreisZeichen {
  name: string;
  symbol: string;
  element: Element;
  thunTyp: ThunTyp;
}

export const TIERKREIS: TierkreisZeichen[] = [
  { name: 'Widder',     symbol: '♈', element: 'feuer',  thunTyp: 'frucht' },
  { name: 'Stier',      symbol: '♉', element: 'erde',   thunTyp: 'wurzel' },
  { name: 'Zwillinge',  symbol: '♊', element: 'luft',   thunTyp: 'bluete' },
  { name: 'Krebs',      symbol: '♋', element: 'wasser', thunTyp: 'blatt' },
  { name: 'Loewe',      symbol: '♌', element: 'feuer',  thunTyp: 'frucht' },
  { name: 'Jungfrau',   symbol: '♍', element: 'erde',   thunTyp: 'wurzel' },
  { name: 'Waage',      symbol: '♎', element: 'luft',   thunTyp: 'bluete' },
  { name: 'Skorpion',   symbol: '♏', element: 'wasser', thunTyp: 'blatt' },
  { name: 'Schuetze',   symbol: '♐', element: 'feuer',  thunTyp: 'frucht' },
  { name: 'Steinbock',  symbol: '♑', element: 'erde',   thunTyp: 'wurzel' },
  { name: 'Wassermann', symbol: '♒', element: 'luft',   thunTyp: 'bluete' },
  { name: 'Fische',     symbol: '♓', element: 'wasser', thunTyp: 'blatt' },
];

const DEG = Math.PI / 180;

function julianDay(date: Date): number {
  // Julianisches Datum für 0h UT
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60) / 24;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

function lahiriAyanamsa(jd: number): number {
  // Lineare Naeherung Lahiri-Ayanamsa, gut für 2000-2050.
  const T = (jd - 2451545.0) / 36525;
  return 23.85 + 1.39 * T;
}

function normalizeAngle(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

function moonTropicalLongitude(jd: number): number {
  // Vereinfachte Meeus-Formeln, sechs Hauptterme.
  const T = (jd - 2451545.0) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D  = 297.8501921 + 445267.1114034 * T;
  const M  = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T;

  const lon = Lp
    + 6.289  * Math.sin(Mp * DEG)
    - 1.274  * Math.sin((Mp - 2 * D) * DEG)
    + 0.658  * Math.sin(2 * D * DEG)
    - 0.186  * Math.sin(M * DEG)
    - 0.059  * Math.sin((2 * Mp - 2 * D) * DEG)
    - 0.057  * Math.sin((Mp + M - 2 * D) * DEG)
    + 0.053  * Math.sin((Mp + 2 * D) * DEG)
    + 0.046  * Math.sin((2 * D - M) * DEG)
    + 0.041  * Math.sin((Mp - M) * DEG)
    - 0.035  * Math.sin(D * DEG)
    - 0.031  * Math.sin((Mp + M) * DEG);

  return normalizeAngle(lon);
}

function sunTropicalLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L = 280.46646 + 36000.76983 * T;
  const M = (357.52911 + 35999.05029 * T) * DEG;
  const C = (1.914602 - 0.004817 * T) * Math.sin(M)
          + 0.019993 * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  return normalizeAngle(L + C);
}

function moonAscendingNode(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return normalizeAngle(125.04452 - 1934.136261 * T);
}

export interface MondTag {
  datum: Date;
  longitudeSiderisch: number;
  zeichen: TierkreisZeichen;
  thunTyp: ThunTyp;
  element: Element;
  phase: MondPhase;
  illumination: number;
  waxing: boolean;
  aufstieg: Aufstieg;
  knotenTag: boolean;
}

export function mondTag(date: Date): MondTag {
  // Wir nehmen 12:00 MEZ als Tagesreferenz (mittag, klassisch für Garten-Kalender).
  const reference = new Date(date);
  reference.setUTCHours(11, 0, 0, 0);
  const jd = julianDay(reference);

  const moonTrop = moonTropicalLongitude(jd);
  const ayan = lahiriAyanamsa(jd);
  const moonSid = normalizeAngle(moonTrop - ayan);

  const zeichenIndex = Math.floor(moonSid / 30) % 12;
  const zeichen = TIERKREIS[zeichenIndex];

  const sunTrop = sunTropicalLongitude(jd);
  const elongation = normalizeAngle(moonTrop - sunTrop);
  const illumination = (1 - Math.cos(elongation * DEG)) / 2;
  const phase = derivePhase(elongation, illumination);
  const waxing = elongation < 180;

  // Aufsteigender Mond: Wenn Mond in Schuetze, Steinbock, Wassermann, Fische, Widder, Stier oder Zwillinge.
  // Absteigender Mond: Krebs, Loewe, Jungfrau, Waage, Skorpion.
  const aufsteigendeZeichen = ['Schuetze', 'Steinbock', 'Wassermann', 'Fische', 'Widder', 'Stier', 'Zwillinge'];
  const aufstieg: Aufstieg = aufsteigendeZeichen.includes(zeichen.name) ? 'aufsteigend' : 'absteigend';

  // Knoten-Tag: Mond steht nahe (innerhalb 12 Grad) am auf- oder absteigenden Knoten.
  const node = moonAscendingNode(jd);
  const distToAscNode = Math.min(
    Math.abs(normalizeAngle(moonTrop - node)),
    360 - Math.abs(normalizeAngle(moonTrop - node))
  );
  const distToDescNode = Math.min(
    Math.abs(normalizeAngle(moonTrop - (node + 180))),
    360 - Math.abs(normalizeAngle(moonTrop - (node + 180)))
  );
  const knotenTag = distToAscNode < 8 || distToDescNode < 8;

  return {
    datum: new Date(date),
    longitudeSiderisch: moonSid,
    zeichen,
    thunTyp: zeichen.thunTyp,
    element: zeichen.element,
    phase,
    illumination,
    waxing,
    aufstieg,
    knotenTag,
  };
}

function derivePhase(elongation: number, illumination: number): MondPhase {
  if (illumination < 0.03) return 'neumond';
  if (illumination > 0.97) return 'vollmond';
  if (elongation < 90 - 7) return 'zunehmend';
  if (elongation < 90 + 7) return 'halbmond-zu';
  if (elongation < 180 - 7) return 'zunehmend';
  if (elongation < 270 - 7) return 'abnehmend';
  if (elongation < 270 + 7) return 'halbmond-ab';
  return 'abnehmend';
}

export function thunTypLabel(typ: ThunTyp): string {
  return { wurzel: 'Wurzeltag', blatt: 'Blatttag', bluete: 'Bluetentag', frucht: 'Fruchttag' }[typ];
}

export function thunTypFarbe(typ: ThunTyp): string {
  return {
    wurzel: '#8a6438',
    blatt:  '#4a8a3a',
    bluete: '#d4a542',
    frucht: '#c0432f',
  }[typ];
}

export function phaseLabel(phase: MondPhase): string {
  return {
    'neumond': 'Neumond',
    'zunehmend': 'zunehmend',
    'halbmond-zu': 'erstes Viertel',
    'vollmond': 'Vollmond',
    'halbmond-ab': 'letztes Viertel',
    'abnehmend': 'abnehmend',
  }[phase];
}

export function phaseSymbol(phase: MondPhase): string {
  return {
    'neumond': '\u{1F311}',
    'zunehmend': '\u{1F312}',
    'halbmond-zu': '\u{1F313}',
    'vollmond': '\u{1F315}',
    'halbmond-ab': '\u{1F317}',
    'abnehmend': '\u{1F318}',
  }[phase];
}
