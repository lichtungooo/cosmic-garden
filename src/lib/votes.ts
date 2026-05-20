// Voting auf Fragen, Antworten und Wünsche.
// Jeder Vote ist ein eigenes WoT-Item — pro User und pro Ziel höchstens eins.
// Die Aggregation zählt alle eingehenden Items mit gleichem zielArt+zielId.

import { useCallback, useMemo } from 'react';
import type { Item } from '@real-life-stack/data-interface';
import {
  useItems,
  useCreateItem,
  useDeleteItem,
  useCurrentUser,
} from '@real-life-stack/toolkit';

export const VOTE_TYPE = 'garten-vote';

export type ZielArt = 'frage' | 'antwort' | 'wunsch';

export interface Vote {
  id: string;
  zielArt: ZielArt;
  zielId: string;
  vonProfilId: string;
  erstellt: number;
}

function itemZuVote(item: Item): Vote {
  const d = item.data as Record<string, unknown>;
  return {
    id: item.id,
    zielArt: (d.zielArt as ZielArt) ?? 'frage',
    zielId: String(d.zielId ?? ''),
    vonProfilId: String(d.vonProfilId ?? item.createdBy ?? 'anonym'),
    erstellt: typeof d.erstellt === 'number' ? d.erstellt : Date.parse(item.createdAt) || Date.now(),
  };
}

const FILTER = { type: VOTE_TYPE };

// Hook für Stimmen pro Ziel — gibt Anzahl + ob eigener User gevotet hat + Toggle.
export function useVotes(zielArt: ZielArt, zielId: string) {
  const { data: items } = useItems(FILTER);
  const { data: user } = useCurrentUser();
  const { mutate: createItem } = useCreateItem();
  const { mutate: deleteItem } = useDeleteItem();

  const votes = useMemo(() => {
    return items
      .map(itemZuVote)
      .filter(v => v.zielArt === zielArt && v.zielId === zielId);
  }, [items, zielArt, zielId]);

  const anzahl = votes.length;
  const eigenerVote = useMemo(
    () => votes.find(v => v.vonProfilId === user?.id),
    [votes, user?.id],
  );
  const habGevotet = !!eigenerVote;

  const toggle = useCallback(async () => {
    if (!user?.id) return;
    if (eigenerVote) {
      await deleteItem(eigenerVote.id);
    } else {
      await createItem({
        type: VOTE_TYPE,
        createdBy: user.id,
        data: {
          zielArt,
          zielId,
          vonProfilId: user.id,
          erstellt: Date.now(),
        },
      });
    }
  }, [user?.id, eigenerVote, createItem, deleteItem, zielArt, zielId]);

  return { anzahl, habGevotet, toggle };
}

// Helper für Bulk-Aggregation — gibt Map<zielId, Anzahl> für gegebene zielArt.
export function useVoteAnzahlen(zielArt: ZielArt) {
  const { data: items } = useItems(FILTER);

  return useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const v = itemZuVote(item);
      if (v.zielArt !== zielArt) continue;
      map.set(v.zielId, (map.get(v.zielId) ?? 0) + 1);
    }
    return map;
  }, [items, zielArt]);
}
