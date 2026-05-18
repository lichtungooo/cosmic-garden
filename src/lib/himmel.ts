// Sonnen- und Mondzeiten und Mondphasen-Ereigniszeiten.
// Algorithmen nach Meeus, vereinfacht. Genauigkeit ~1-2 Minuten.
import type { Ort } from './standort';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function julianDay(date: Date): number {
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

function norm360(x: number): number { const r = x % 360; return r < 0 ? r + 360 : r; }

interface EquatorialPos { ra: number; dec: number; }

function sunPosition(jd: number): EquatorialPos {
  const T = (jd - 2451545.0) / 36525;
  const L = norm360(280.46646 + 36000.76983 * T);
  const M = (357.52911 + 35999.05029 * T) * DEG;
  const C = (1.914602 - 0.004817 * T) * Math.sin(M)
          + 0.019993 * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  const lambda = (L + C) * DEG;
  const eps = (23.439 - 0.0000004 * (jd - 2451545.0)) * DEG;
  return {
    ra:  norm360(Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) * RAD),
    dec: Math.asin(Math.sin(eps) * Math.sin(lambda)) * RAD,
  };
}

function moonPosition(jd: number): EquatorialPos {
  const T = (jd - 2451545.0) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D  = 297.8501921 + 445267.1114034 * T;
  const M  = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T;
  const F  =  93.2720950 + 483202.0175233 * T;
  const lon = Lp
    + 6.289 * Math.sin(Mp * DEG)
    - 1.274 * Math.sin((Mp - 2 * D) * DEG)
    + 0.658 * Math.sin(2 * D * DEG)
    - 0.186 * Math.sin(M * DEG)
    - 0.059 * Math.sin((2 * Mp - 2 * D) * DEG)
    - 0.057 * Math.sin((Mp + M - 2 * D) * DEG);
  const lat =
    + 5.128 * Math.sin(F * DEG)
    + 0.281 * Math.sin((Mp + F) * DEG)
    + 0.278 * Math.sin((Mp - F) * DEG)
    + 0.173 * Math.sin((2 * D - F) * DEG);
  const lambda = lon * DEG;
  const beta = lat * DEG;
  const eps = 23.4397 * DEG;
  return {
    ra: norm360(Math.atan2(
      Math.sin(lambda) * Math.cos(eps) - Math.tan(beta) * Math.sin(eps),
      Math.cos(lambda)
    ) * RAD),
    dec: Math.asin(
      Math.sin(beta) * Math.cos(eps) + Math.cos(beta) * Math.sin(eps) * Math.sin(lambda)
    ) * RAD,
  };
}

function moonEclipticLongitudeTrop(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D  = 297.8501921 + 445267.1114034 * T;
  const M  = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T;
  return norm360(Lp
    + 6.289 * Math.sin(Mp * DEG)
    - 1.274 * Math.sin((Mp - 2 * D) * DEG)
    + 0.658 * Math.sin(2 * D * DEG)
    - 0.186 * Math.sin(M * DEG)
    - 0.059 * Math.sin((2 * Mp - 2 * D) * DEG)
    - 0.057 * Math.sin((Mp + M - 2 * D) * DEG));
}

function sunEclipticLongitudeTrop(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L = 280.46646 + 36000.76983 * T;
  const M = (357.52911 + 35999.05029 * T) * DEG;
  const C = (1.914602 - 0.004817 * T) * Math.sin(M)
          + 0.019993 * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  return norm360(L + C);
}

function siderealTimeDeg(jd: number, lonEast: number): number {
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
           + 0.000387933 * T * T;
  gmst = norm360(gmst);
  return norm360(gmst + lonEast);
}

function altitudeAt(jd: number, lat: number, lonEast: number, body: 'sun' | 'moon'): number {
  const pos = body === 'sun' ? sunPosition(jd) : moonPosition(jd);
  const lst = siderealTimeDeg(jd, lonEast);
  const H = norm360(lst - pos.ra) * DEG;
  const phi = lat * DEG;
  const dec = pos.dec * DEG;
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) * RAD;
}

function findEvent(date: Date, ort: Ort, body: 'sun' | 'moon', hCutoff: number, direction: 'rise' | 'set'): Date | null {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  let prevJd = julianDay(start);
  let prevAlt = altitudeAt(prevJd, ort.lat, ort.lon, body) - hCutoff;
  const stepMin = 5;
  for (let i = 1; i <= (24 * 60) / stepMin; i++) {
    const jd = prevJd + (stepMin / (24 * 60));
    const alt = altitudeAt(jd, ort.lat, ort.lon, body) - hCutoff;
    const isRise = prevAlt < 0 && alt >= 0;
    const isSet  = prevAlt > 0 && alt <= 0;
    if ((direction === 'rise' && isRise) || (direction === 'set' && isSet)) {
      const frac = Math.abs(prevAlt) / (Math.abs(prevAlt) + Math.abs(alt));
      return new Date(start.getTime() + (i - 1 + frac) * stepMin * 60 * 1000);
    }
    prevJd = jd;
    prevAlt = alt;
  }
  return null;
}

export interface TagesHimmel {
  sonnenaufgang: Date | null;
  sonnenuntergang: Date | null;
  sonnenHoechststand: Date | null;
  sonnenHoeheGrad: number | null;
  mondaufgang: Date | null;
  monduntergang: Date | null;
  tagesLaengeMin: number | null;
}

export function tagesHimmel(date: Date, ort: Ort): TagesHimmel {
  const sa = findEvent(date, ort, 'sun', -0.833, 'rise');
  const su = findEvent(date, ort, 'sun', -0.833, 'set');
  const ma = findEvent(date, ort, 'moon', 0.125, 'rise');
  const mu = findEvent(date, ort, 'moon', 0.125, 'set');
  const tagesLaengeMin = sa && su ? Math.round((su.getTime() - sa.getTime()) / 60000) : null;
  const hoch = (sa && su) ? new Date((sa.getTime() + su.getTime()) / 2) : null;
  const hoehe = hoch ? altitudeAt(julianDay(hoch), ort.lat, ort.lon, 'sun') : null;
  return {
    sonnenaufgang: sa,
    sonnenuntergang: su,
    sonnenHoechststand: hoch,
    sonnenHoeheGrad: hoehe,
    mondaufgang: ma,
    monduntergang: mu,
    tagesLaengeMin,
  };
}

// ===== Mondphasen-Ereigniszeiten =====

export type PhaseEvent = 'neumond' | 'erstes-viertel' | 'vollmond' | 'letztes-viertel';

interface PhaseDef { event: PhaseEvent; targetElong: number; }
const PHASEN: PhaseDef[] = [
  { event: 'neumond',         targetElong: 0   },
  { event: 'erstes-viertel',  targetElong: 90  },
  { event: 'vollmond',        targetElong: 180 },
  { event: 'letztes-viertel', targetElong: 270 },
];

function elongation(jd: number): number {
  return norm360(moonEclipticLongitudeTrop(jd) - sunEclipticLongitudeTrop(jd));
}

// Findet Sonnenstand 0/90/180/270 Grad ekliptische Laenge (Fruehling/Sommer/Herbst/Winter-Sonnwende)
export function sonnwende(jahr: number, target: 0 | 90 | 180 | 270): Date {
  const richtwerte = { 0: [3, 20], 90: [6, 21], 180: [9, 22], 270: [12, 21] } as const;
  const [m, t] = richtwerte[target];
  const start = new Date(Date.UTC(jahr, m - 1, t - 3, 0, 0, 0));
  const ende = new Date(Date.UTC(jahr, m - 1, t + 3, 0, 0, 0));
  const jdStart = julianDay(start);
  const jdEnde = julianDay(ende);
  function diff(jd: number) {
    let d = sunEclipticLongitudeTrop(jd) - target;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }
  let lo = jdStart, hi = jdEnde;
  let dLo = diff(lo);
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const dMid = diff(mid);
    if (Math.abs(dMid) < 0.0001) {
      const ms = (mid - 2440587.5) * 86400000;
      return new Date(ms);
    }
    if (Math.sign(dMid) === Math.sign(dLo)) { lo = mid; dLo = dMid; } else { hi = mid; }
  }
  const ms = ((lo + hi) / 2 - 2440587.5) * 86400000;
  return new Date(ms);
}

// Findet exakten Zeitpunkt einer Phase im Bereich (jd0, jd1).
// Voraussetzung: elong(jd0) - target und elong(jd1) - target wechseln das Vorzeichen.
function bisectPhase(jdStart: number, jdEnde: number, target: number): number | null {
  function diff(jd: number): number {
    let d = elongation(jd) - target;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }
  let lo = jdStart, hi = jdEnde;
  let dLo = diff(lo), dHi = diff(hi);
  if (Math.sign(dLo) === Math.sign(dHi)) return null;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const dMid = diff(mid);
    if (Math.abs(dMid) < 0.001) return mid;
    if (Math.sign(dMid) === Math.sign(dLo)) { lo = mid; dLo = dMid; } else { hi = mid; dHi = dMid; }
  }
  return (lo + hi) / 2;
}

export interface PhaseTimestamp {
  event: PhaseEvent;
  zeit: Date;
}

// Findet alle Phasen-Ereignisse im Monat des gegebenen Datums.
export function phasenImMonat(refDate: Date): PhaseTimestamp[] {
  const jahr = refDate.getFullYear();
  const monat = refDate.getMonth();
  const start = new Date(jahr, monat, 1);
  const ende = new Date(jahr, monat + 1, 1);
  return phasenZwischen(start, ende);
}

export function phasenZwischen(von: Date, bis: Date): PhaseTimestamp[] {
  const out: PhaseTimestamp[] = [];
  // Sample taeglich, finde Vorzeichenwechsel pro Phase
  const stepHours = 6;
  const stepDays = stepHours / 24;
  const samples: { jd: number; date: Date; elong: number }[] = [];
  const startMs = von.getTime();
  const endMs = bis.getTime();
  for (let t = startMs; t <= endMs; t += stepHours * 3600 * 1000) {
    const d = new Date(t);
    const jd = julianDay(d);
    samples.push({ jd, date: d, elong: elongation(jd) });
  }
  for (const phaseDef of PHASEN) {
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1], b = samples[i];
      const dA = ((a.elong - phaseDef.targetElong + 540) % 360) - 180;
      const dB = ((b.elong - phaseDef.targetElong + 540) % 360) - 180;
      if (Math.sign(dA) !== Math.sign(dB) && Math.abs(dA) < 30 && Math.abs(dB) < 30) {
        const jd = bisectPhase(a.jd, b.jd, phaseDef.targetElong);
        if (jd != null) {
          const ms = (jd - 2440587.5) * 86400000;
          const zeit = new Date(ms);
          if (zeit >= von && zeit < bis) {
            out.push({ event: phaseDef.event, zeit });
          }
        }
      }
    }
  }
  return out.sort((a, b) => a.zeit.getTime() - b.zeit.getTime());
}

export function findPhaseAtDay(date: Date): PhaseTimestamp | null {
  const startDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endDay = new Date(startDay.getTime() + 86400000);
  // suche mit 1 Tag drumherum
  const window = phasenZwischen(new Date(startDay.getTime() - 86400000), new Date(endDay.getTime() + 86400000));
  return window.find(p => p.zeit >= startDay && p.zeit < endDay) ?? null;
}

export function phaseEventLabel(e: PhaseEvent): string {
  return {
    'neumond':         'Neumond',
    'erstes-viertel':  'erstes Viertel',
    'vollmond':        'Vollmond',
    'letztes-viertel': 'letztes Viertel',
  }[e];
}

export function formatZeit(d: Date | null): string {
  if (!d) return '—';
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatDauer(min: number | null): string {
  if (min == null) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h} h ${m.toString().padStart(2, '0')} min`;
}
