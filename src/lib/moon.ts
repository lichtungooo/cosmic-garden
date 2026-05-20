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

// Sternbild-Grenzen in siderischer Laenge (Lahiri-Ayanamsa, Grad).
// Maria Thun (Aussaattage) und Werner Bauer (Astronomischer Kalender Goetheanum)
// nehmen die echten Sternbild-Ausdehnungen — keine gleichmaessige 30°-Aufteilung.
// Stier (Plejaden + Hyaden + Aldebaran) ist ein riesiges Sternbild (~50°),
// Jungfrau ebenso (~46°). Skorpion (~6°) und Waage sind klein.
// Diese Tabelle entspricht der biodynamischen Aussaattage-Tradition (Maria Thun),
// damit der Tagestyp-Wechsel mit den gedruckten Kalendern uebereinstimmt.
// Quelle: Werner Bauer "Sternbild und Tierkreis", Goetheanum.
export const TIERKREIS: (TierkreisZeichen & { startGrad: number })[] = [
  { name: 'Widder',     symbol: '♈', element: 'feuer',  thunTyp: 'frucht', startGrad:   0 },
  { name: 'Stier',      symbol: '♉', element: 'erde',   thunTyp: 'wurzel', startGrad:  27 },
  { name: 'Zwillinge',  symbol: '♊', element: 'luft',   thunTyp: 'bluete', startGrad:  90 },
  { name: 'Krebs',      symbol: '♋', element: 'wasser', thunTyp: 'blatt',  startGrad: 118 },
  { name: 'Löwe',       symbol: '♌', element: 'feuer',  thunTyp: 'frucht', startGrad: 150 },
  { name: 'Jungfrau',   symbol: '♍', element: 'erde',   thunTyp: 'wurzel', startGrad: 174 },
  { name: 'Waage',      symbol: '♎', element: 'luft',   thunTyp: 'bluete', startGrad: 217 },
  { name: 'Skorpion',   symbol: '♏', element: 'wasser', thunTyp: 'blatt',  startGrad: 241 },
  { name: 'Schütze',    symbol: '♐', element: 'feuer',  thunTyp: 'frucht', startGrad: 247 },
  { name: 'Steinbock',  symbol: '♑', element: 'erde',   thunTyp: 'wurzel', startGrad: 282 },
  { name: 'Wassermann', symbol: '♒', element: 'luft',   thunTyp: 'bluete', startGrad: 313 },
  { name: 'Fische',     symbol: '♓', element: 'wasser', thunTyp: 'blatt',  startGrad: 333 },
];

function zeichenFuerLaenge(laenge: number): TierkreisZeichen {
  const l = ((laenge % 360) + 360) % 360;
  for (let i = TIERKREIS.length - 1; i >= 0; i--) {
    if (l >= TIERKREIS[i].startGrad) return TIERKREIS[i];
  }
  return TIERKREIS[0]; // sollte nie passieren weil Widder bei 0° startet
}

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
  // Referenz: 11:00 UTC (Mittag MEZ) am lokalen Datum des Inputs.
  // Wichtig: Wir bauen das Datum aus year/month/day des Inputs neu auf, sonst
  // landen wir bei Inputs wie "new Date(2026, 4, 24)" (00:00 lokal = 22:00 UTC
  // am Vortag) nach setUTCHours(11) auf dem falschen Tag.
  const reference = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    11, 0, 0,
  ));
  const jd = julianDay(reference);

  const moonTrop = moonTropicalLongitude(jd);
  const ayan = lahiriAyanamsa(jd);
  const moonSid = normalizeAngle(moonTrop - ayan);

  const zeichen = zeichenFuerLaenge(moonSid);

  const sunTrop = sunTropicalLongitude(jd);
  const elongation = normalizeAngle(moonTrop - sunTrop);
  const illumination = (1 - Math.cos(elongation * DEG)) / 2;
  const phase = derivePhase(elongation, illumination);
  const waxing = elongation < 180;

  // Aufsteigender Mond: Wenn Mond in Schütze, Steinbock, Wassermann, Fische, Widder, Stier oder Zwillinge.
  // Absteigender Mond: Krebs, Löwe, Jungfrau, Waage, Skorpion.
  const aufsteigendeZeichen = ['Schütze', 'Steinbock', 'Wassermann', 'Fische', 'Widder', 'Stier', 'Zwillinge'];
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
  return { wurzel: 'Wurzeltag', blatt: 'Blatttag', bluete: 'Blütentag', frucht: 'Fruchttag' }[typ];
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
