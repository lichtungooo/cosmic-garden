// Wetterdaten von Open-Meteo (kostenlos, kein API-Key).
import { useEffect, useState } from 'react';
import type { Ort } from './standort';

export interface WetterTag {
  datum: string; // YYYY-MM-DD
  niederschlagMm: number;
  wettercode: number;
  tMin: number;
  tMax: number;
}

export interface WetterDaten {
  ort: string;
  tage: WetterTag[];
  geladen: Date;
}

const CACHE_KEY = 'garten.wetter';
const CACHE_MAX_AGE_MS = 3 * 3600 * 1000; // 3 Stunden

interface Cached { ort: string; lat: number; lon: number; tage: WetterTag[]; geladen: number; }

async function ladeWetter(ort: Ort): Promise<WetterDaten | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${ort.lat}&longitude=${ort.lon}` +
      `&daily=weathercode,precipitation_sum,temperature_2m_max,temperature_2m_min` +
      `&past_days=21&forecast_days=10&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const tage: WetterTag[] = data.daily.time.map((datum: string, i: number) => ({
      datum,
      niederschlagMm: data.daily.precipitation_sum[i] ?? 0,
      wettercode: data.daily.weathercode[i] ?? 0,
      tMin: data.daily.temperature_2m_min[i] ?? 0,
      tMax: data.daily.temperature_2m_max[i] ?? 0,
    }));
    const wetter: WetterDaten = { ort: ort.name, tage, geladen: new Date() };
    const cached: Cached = { ort: ort.name, lat: ort.lat, lon: ort.lon, tage, geladen: Date.now() };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cached)); } catch {}
    return wetter;
  } catch {
    return null;
  }
}

function ladeAusCache(ort: Ort): WetterDaten | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c: Cached = JSON.parse(raw);
    if (c.ort !== ort.name) return null;
    if (Date.now() - c.geladen > CACHE_MAX_AGE_MS) return null;
    return { ort: c.ort, tage: c.tage, geladen: new Date(c.geladen) };
  } catch {
    return null;
  }
}

export function useWetter(ort: Ort): WetterDaten | null {
  const [wetter, setWetter] = useState<WetterDaten | null>(() => ladeAusCache(ort));

  useEffect(() => {
    let aktiv = true;
    const cached = ladeAusCache(ort);
    if (cached) setWetter(cached);
    else setWetter(null);
    ladeWetter(ort).then(w => { if (aktiv && w) setWetter(w); });
    return () => { aktiv = false; };
  }, [ort.name]);

  return wetter;
}

// Wettercode-Klassen (WMO)
export type WetterKlasse = 'klar' | 'wolkig' | 'nebel' | 'regen' | 'schauer' | 'gewitter' | 'schnee';

export function klasse(code: number): WetterKlasse {
  if (code === 0) return 'klar';
  if (code <= 3) return 'wolkig';
  if (code <= 48) return 'nebel';
  if (code <= 67) return 'regen';
  if (code <= 77) return 'schnee';
  if (code <= 82) return 'schauer';
  if (code <= 86) return 'schnee';
  return 'gewitter';
}

export function klasseLabel(k: WetterKlasse): string {
  return {
    'klar': 'klar',
    'wolkig': 'wolkig',
    'nebel': 'Nebel',
    'regen': 'Regen',
    'schauer': 'Schauer',
    'gewitter': 'Gewitter',
    'schnee': 'Schnee',
  }[k];
}

export function findeWetterFuerDatum(wetter: WetterDaten | null, date: Date): WetterTag | null {
  if (!wetter) return null;
  const iso = date.toISOString().slice(0, 10);
  return wetter.tage.find(t => t.datum === iso) ?? null;
}

// Berechnet ob Giessen angesagt ist: 3+ Tage Niederschlag <2mm UND kein nennenswerter Regen morgen.
export function giessenEmpfohlen(wetter: WetterDaten | null, refDate: Date = new Date()): boolean {
  if (!wetter) return false;
  const heute = refDate.toISOString().slice(0, 10);
  const idx = wetter.tage.findIndex(t => t.datum === heute);
  if (idx < 3) return false;
  const letzte3 = wetter.tage.slice(idx - 3, idx);
  const summe3 = letzte3.reduce((s, t) => s + t.niederschlagMm, 0);
  const morgen = wetter.tage[idx + 1];
  const regenMorgen = morgen ? morgen.niederschlagMm : 0;
  return summe3 < 4 && regenMorgen < 2;
}
