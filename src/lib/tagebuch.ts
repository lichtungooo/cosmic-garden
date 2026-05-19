// Tagebuch — persistiert als WoT-Items im persoenlichen Doc.
// Einträge bleiben privat (nicht in eine Group veroeffentlicht), Multi-Device-Sync
// laeuft über Antons Vault automatisch.

import { useCallback, useMemo } from 'react';
import type { Item } from '@real-life-stack/data-interface';
import {
  useConnector,
  useItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useCurrentUser,
} from '@real-life-stack/toolkit';
import { mondTag, type ThunTyp } from './moon';

export type TagebuchArt = 'beobachtung' | 'aussaat' | 'pflanzung' | 'ernte' | 'pflege' | 'frage';

export const TAGEBUCH_TYPE = 'tagebuch-eintrag';

export interface TagebuchEintrag {
  id: string;
  datum: string;
  erstellt: number;
  text: string;
  art: TagebuchArt;
  pflanzenIds?: string[];
  thunTyp?: ThunTyp;
  zeichenName?: string;
}

export function datumZuKey(d: Date): string {
  const j = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const t = d.getDate().toString().padStart(2, '0');
  return `${j}-${m}-${t}`;
}

function itemZuEintrag(item: Item): TagebuchEintrag {
  const data = item.data as Record<string, unknown>;
  const erstellt = typeof data.erstellt === 'number' ? data.erstellt : Date.parse(item.createdAt) || Date.now();
  return {
    id: item.id,
    datum: String(data.datum ?? ''),
    erstellt,
    text: String(data.text ?? ''),
    art: (data.art as TagebuchArt) ?? 'beobachtung',
    pflanzenIds: Array.isArray(data.pflanzenIds) ? (data.pflanzenIds as string[]) : undefined,
    thunTyp: data.thunTyp as ThunTyp | undefined,
    zeichenName: typeof data.zeichenName === 'string' ? data.zeichenName : undefined,
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

const FILTER = { type: TAGEBUCH_TYPE };

export function useTagebuch() {
  const { data: items } = useItems(FILTER);
  const { data: user } = useCurrentUser();
  const { mutate: createItem } = useCreateItem();
  const { mutate: updateItem } = useUpdateItem();
  const { mutate: deleteItem } = useDeleteItem();

  const eintraege = useMemo(() => items.map(itemZuEintrag), [items]);

  const fuegeHinzu = useCallback(async (text: string, datum: Date, art: TagebuchArt, pflanzenIds?: string[]) => {
    const m = mondTag(datum);
    const eintrag = {
      datum: datumZuKey(datum),
      erstellt: Date.now(),
      text,
      art,
      pflanzenIds: pflanzenIds && pflanzenIds.length > 0 ? pflanzenIds : undefined,
      thunTyp: m.thunTyp,
      zeichenName: m.zeichen.name,
    };
    const item = await createItem({
      type: TAGEBUCH_TYPE,
      createdBy: user?.id ?? 'anonym',
      data: eintrag,
    });
    return item ? itemZuEintrag(item) : null;
  }, [createItem, user?.id]);

  const aktualisiere = useCallback(async (id: string, text: string, art: TagebuchArt) => {
    const vorhanden = items.find(i => i.id === id);
    if (!vorhanden) return;
    await updateItem(id, { data: { ...vorhanden.data, text, art } });
  }, [updateItem, items]);

  const loesche = useCallback(async (id: string) => {
    await deleteItem(id);
  }, [deleteItem]);

  return { eintraege, fuegeHinzu, aktualisiere, loesche };
}

// useConnector ist nur für Hook-Konsistenz exportiert (unused hier).
void useConnector;
