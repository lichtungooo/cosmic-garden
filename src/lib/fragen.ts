// Fragen & Antworten — persistiert als WoT-Items im persönlichen Doc.
// Eine Frage hängt am Scope (z.B. "pflanze:kopfsalat"). Wer eine Frage stellt,
// gibt sofort eine Pflicht-Erst-Antwort dazu. Andere User schreiben weitere
// Antworten. F1 noch ohne Voting.

import { useCallback, useMemo } from 'react';
import type { Item } from '@real-life-stack/data-interface';
import {
  useItems,
  useCreateItem,
  useDeleteItem,
  useCurrentUser,
} from '@real-life-stack/toolkit';

export const FRAGE_TYPE = 'garten-frage';
export const ANTWORT_TYPE = 'garten-antwort';

export type FrageKategorie = 'frage' | 'wunsch';

export interface Frage {
  id: string;
  scope: string;        // 'pflanze:kopfsalat', 'wissen:praxis:mischkultur', 'wunsch:welt:pflanzen'
  kategorie: FrageKategorie;
  titel: string;
  text: string;         // Beobachtung / Beschreibung in Markdown
  erstellt: number;
  autorProfilId: string;
}

export interface Antwort {
  id: string;
  frageId: string;
  text: string;
  erstellt: number;
  autorProfilId: string;
}

function itemZuFrage(item: Item): Frage {
  const d = item.data as Record<string, unknown>;
  return {
    id: item.id,
    scope: String(d.scope ?? ''),
    kategorie: (d.kategorie as FrageKategorie) ?? 'frage',
    titel: String(d.titel ?? ''),
    text: String(d.text ?? ''),
    erstellt: typeof d.erstellt === 'number' ? d.erstellt : Date.parse(item.createdAt) || Date.now(),
    autorProfilId: String(d.autorProfilId ?? item.createdBy ?? 'anonym'),
  };
}

function itemZuAntwort(item: Item): Antwort {
  const d = item.data as Record<string, unknown>;
  return {
    id: item.id,
    frageId: String(d.frageId ?? ''),
    text: String(d.text ?? ''),
    erstellt: typeof d.erstellt === 'number' ? d.erstellt : Date.parse(item.createdAt) || Date.now(),
    autorProfilId: String(d.autorProfilId ?? item.createdBy ?? 'anonym'),
  };
}

const FRAGE_FILTER = { type: FRAGE_TYPE };
const ANTWORT_FILTER = { type: ANTWORT_TYPE };

// Alle Fragen eines Scopes (z.B. "pflanze:kopfsalat") — aelteste oben.
export function useFragenZuScope(scope: string) {
  const { data: items } = useItems(FRAGE_FILTER);
  const { data: user } = useCurrentUser();
  const { mutate: createItem } = useCreateItem();
  const { mutate: deleteItem } = useDeleteItem();

  const fragen = useMemo(() => {
    return items
      .map(itemZuFrage)
      .filter(f => f.scope === scope)
      .sort((a, b) => a.erstellt - b.erstellt);
  }, [items, scope]);

  const stelleFrage = useCallback(async (titel: string, text: string, kategorie: FrageKategorie = 'frage') => {
    const frageDaten = {
      scope,
      kategorie,
      titel: titel.trim(),
      text: text.trim(),
      erstellt: Date.now(),
      autorProfilId: user?.id ?? 'anonym',
    };
    const item = await createItem({
      type: FRAGE_TYPE,
      createdBy: user?.id ?? 'anonym',
      data: frageDaten,
    });
    return item ? itemZuFrage(item) : null;
  }, [createItem, scope, user?.id]);

  const loescheFrage = useCallback(async (id: string) => {
    await deleteItem(id);
  }, [deleteItem]);

  return { fragen, stelleFrage, loescheFrage };
}

// Alle Antworten zu einer Frage — aelteste oben.
export function useAntworten(frageId: string) {
  const { data: items } = useItems(ANTWORT_FILTER);
  const { data: user } = useCurrentUser();
  const { mutate: createItem } = useCreateItem();
  const { mutate: deleteItem } = useDeleteItem();

  const antworten = useMemo(() => {
    return items
      .map(itemZuAntwort)
      .filter(a => a.frageId === frageId)
      .sort((a, b) => a.erstellt - b.erstellt);
  }, [items, frageId]);

  const schreibeAntwort = useCallback(async (text: string) => {
    const daten = {
      frageId,
      text: text.trim(),
      erstellt: Date.now(),
      autorProfilId: user?.id ?? 'anonym',
    };
    const item = await createItem({
      type: ANTWORT_TYPE,
      createdBy: user?.id ?? 'anonym',
      data: daten,
    });
    return item ? itemZuAntwort(item) : null;
  }, [createItem, frageId, user?.id]);

  const loescheAntwort = useCallback(async (id: string) => {
    await deleteItem(id);
  }, [deleteItem]);

  return { antworten, schreibeAntwort, loescheAntwort };
}

// Hilfsfunktion: aus EintragsID (z.B. "pflanze:kopfsalat") direkt den Scope ableiten.
export function scopeAusEintragsId(id: string): string {
  return id;
}
