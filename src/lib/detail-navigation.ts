import { createContext, useContext } from 'react';

export type DetailRef =
  | { kind: 'pflanze'; id: string }
  | { kind: 'arbeit';  id: string }
  | { kind: 'wissen';  sektion: string; eintrag: string }
  | { kind: 'tag';     tag: string };

export interface DetailNavigation {
  oeffne: (ref: DetailRef) => void;
  zurueck: () => void;
  springeZu: (index: number) => void;
  schliesse: () => void;
  stack: DetailRef[];
}

export const DetailNavContext = createContext<DetailNavigation | null>(null);

export function useDetailNav(): DetailNavigation {
  const ctx = useContext(DetailNavContext);
  if (!ctx) throw new Error('DetailNavContext fehlt im Baum');
  return ctx;
}

export function refSchluessel(r: DetailRef): string {
  if (r.kind === 'wissen') return `wissen:${r.sektion}:${r.eintrag}`;
  if (r.kind === 'tag')    return `tag:${r.tag}`;
  return `${r.kind}:${r.id}`;
}

export function gleichRef(a: DetailRef, b: DetailRef): boolean {
  return refSchluessel(a) === refSchluessel(b);
}

export function refAusId(id: string): DetailRef | null {
  const t = id.split(':');
  if (t[0] === 'pflanze' && t[1]) return { kind: 'pflanze', id: t[1] };
  if (t[0] === 'arbeit' && t[1]) return { kind: 'arbeit', id: t[1] };
  if (t[0] === 'wissen' && t[1] && t[2]) return { kind: 'wissen', sektion: t[1], eintrag: t[2] };
  if (t[0] === 'tag' && t[1]) return { kind: 'tag', tag: t.slice(1).join(':') };
  return null;
}

// === URL-Pfad fuer Detail-Ref ===
export function refZuPfad(r: DetailRef): string {
  if (r.kind === 'pflanze') return `/pflanze/${encodeURIComponent(r.id)}`;
  if (r.kind === 'arbeit')  return `/arbeit/${encodeURIComponent(r.id)}`;
  if (r.kind === 'wissen')  return `/wissen/${encodeURIComponent(r.sektion)}/${encodeURIComponent(r.eintrag)}`;
  return `/tag/${encodeURIComponent(r.tag)}`;
}
