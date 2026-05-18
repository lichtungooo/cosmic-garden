import { useEffect, useState, useCallback } from 'react';
import { mondTag, type ThunTyp } from './moon';

export type TagebuchArt = 'beobachtung' | 'aussaat' | 'pflanzung' | 'ernte' | 'pflege' | 'frage';

export interface TagebuchEintrag {
  id: string;
  datum: string;          // YYYY-MM-DD
  erstellt: number;       // timestamp
  text: string;
  art: TagebuchArt;
  pflanzenIds?: string[]; // bezug zu pflanzen.json
  thunTyp?: ThunTyp;      // welcher Tagestyp galt
  zeichenName?: string;   // welcher Tierkreis
}

const STORAGE_KEY = 'garten.tagebuch';

export function ladeEintraege(): TagebuchEintrag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TagebuchEintrag[];
  } catch {
    return [];
  }
}

export function speichereEintraege(eintraege: TagebuchEintrag[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eintraege));
  } catch {
    // leise weitergehen wenn quota voll
  }
}

export function datumZuKey(d: Date): string {
  const j = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const t = d.getDate().toString().padStart(2, '0');
  return `${j}-${m}-${t}`;
}

export function neuerEintrag(text: string, datum: Date, art: TagebuchArt, pflanzenIds?: string[]): TagebuchEintrag {
  const m = mondTag(datum);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    datum: datumZuKey(datum),
    erstellt: Date.now(),
    text,
    art,
    pflanzenIds: pflanzenIds && pflanzenIds.length > 0 ? pflanzenIds : undefined,
    thunTyp: m.thunTyp,
    zeichenName: m.zeichen.name,
  };
}

export function eintraegeFuerTag(eintraege: TagebuchEintrag[], datum: Date): TagebuchEintrag[] {
  const key = datumZuKey(datum);
  return eintraege.filter(e => e.datum === key).sort((a, b) => a.erstellt - b.erstellt);
}

export function eintraegeFuerMonat(eintraege: TagebuchEintrag[], jahr: number, monat: number): TagebuchEintrag[] {
  const praefix = `${jahr}-${(monat + 1).toString().padStart(2, '0')}`;
  return eintraege.filter(e => e.datum.startsWith(praefix));
}

export function eintraegeNachJahr(eintraege: TagebuchEintrag[]): Map<string, TagebuchEintrag[]> {
  const map = new Map<string, TagebuchEintrag[]>();
  for (const e of eintraege) {
    const jahr = e.datum.slice(0, 4);
    if (!map.has(jahr)) map.set(jahr, []);
    map.get(jahr)!.push(e);
  }
  return map;
}

export function artLabel(art: TagebuchArt): string {
  return {
    'beobachtung': 'Beobachtung',
    'aussaat':     'Aussaat',
    'pflanzung':   'Pflanzung',
    'ernte':       'Ernte',
    'pflege':      'Pflege',
    'frage':       'Frage',
  }[art];
}

export function artFarbe(art: TagebuchArt): string {
  return {
    'beobachtung': '#8b6f47',
    'aussaat':     '#7a4d2b',
    'pflanzung':   '#4a7c3a',
    'ernte':       '#a8423a',
    'pflege':      '#c89b3a',
    'frage':       '#5b3a8a',
  }[art];
}

// === Reaktiver Hook ===

const subscribers = new Set<() => void>();
let cache: TagebuchEintrag[] | null = null;

function notify() {
  cache = null;
  subscribers.forEach(fn => fn());
}

export function useTagebuch() {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const fn = () => setVersion(v => v + 1);
    subscribers.add(fn);
    return () => { subscribers.delete(fn); };
  }, []);

  const eintraege = cache ?? (cache = ladeEintraege());

  const fuegeHinzu = useCallback((text: string, datum: Date, art: TagebuchArt, pflanzenIds?: string[]) => {
    const eintrag = neuerEintrag(text, datum, art, pflanzenIds);
    const aktuell = ladeEintraege();
    speichereEintraege([...aktuell, eintrag]);
    notify();
    return eintrag;
  }, []);

  const aktualisiere = useCallback((id: string, text: string, art: TagebuchArt) => {
    const aktuell = ladeEintraege();
    speichereEintraege(aktuell.map(e => e.id === id ? { ...e, text, art } : e));
    notify();
  }, []);

  const loesche = useCallback((id: string) => {
    const aktuell = ladeEintraege();
    speichereEintraege(aktuell.filter(e => e.id !== id));
    notify();
  }, []);

  return { eintraege, fuegeHinzu, aktualisiere, loesche };
}
