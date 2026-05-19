import { createContext, useContext } from 'react';

export interface Ort {
  name: string;
  lat: number;
  lon: number;
}

export const ORTE: Ort[] = [
  { name: 'Kassel',     lat: 51.3127, lon: 9.4797 },
  { name: 'Hamburg',    lat: 53.5511, lon: 9.9937 },
  { name: 'Berlin',     lat: 52.5200, lon: 13.4050 },
  { name: 'Köln',      lat: 50.9375, lon: 6.9603 },
  { name: 'Frankfurt',  lat: 50.1109, lon: 8.6821 },
  { name: 'München',   lat: 48.1351, lon: 11.5820 },
  { name: 'Stuttgart',  lat: 48.7758, lon: 9.1829 },
  { name: 'Leipzig',    lat: 51.3397, lon: 12.3731 },
  { name: 'Bremen',     lat: 53.0793, lon: 8.8017 },
  { name: 'Hannover',   lat: 52.3759, lon: 9.7320 },
  { name: 'Göttingen', lat: 51.5413, lon: 9.9158 },
  { name: 'Erfurt',     lat: 50.9787, lon: 11.0328 },
];

export const STANDARD_ORT = ORTE[0];

export const StandortContext = createContext<Ort>(STANDARD_ORT);
export const useStandort = () => useContext(StandortContext);

const STORAGE_KEY = 'garten.standort';

export function ladeStandort(): Ort {
  if (typeof window === 'undefined') return STANDARD_ORT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return STANDARD_ORT;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === 'number' && typeof parsed?.lon === 'number' && typeof parsed?.name === 'string') {
      return parsed;
    }
  } catch {
    /* leise weitergehen */
  }
  return STANDARD_ORT;
}

export function speicherStandort(ort: Ort) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ort));
  } catch {
    /* leise weitergehen */
  }
}
