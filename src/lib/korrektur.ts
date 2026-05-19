// Korrektur-Hinweise — leise Anmerkungen an einem Eintrag, die nicht öffentlich
// erscheinen, sondern in eine private Liste wandern, die Timo und Eli abarbeiten.
//
// Datenfluss: User schreibt einen Hinweis → WoT-Item garten-korrektur im
// persönlichen Doc → synchronisiert E2E über Antons Vault. Timo und Eli sehen
// die Hinweise in einer separaten Admin-Ansicht (kommt später).

import { useCallback, useMemo } from 'react';
import type { Item } from '@real-life-stack/data-interface';
import {
  useItems,
  useCreateItem,
  useDeleteItem,
  useCurrentUser,
} from '@real-life-stack/toolkit';

export const KORREKTUR_TYPE = 'garten-korrektur';

export type KorrekturStatus = 'eingegangen' | 'geprueft' | 'uebernommen' | 'verworfen';

export interface Korrektur {
  id: string;
  scope: string;            // 'pflanze:kopfsalat'
  abschnitt: string;        // Freitext "Block Pflege, Satz zur Düngung"
  hinweis: string;          // Was stimmt nicht
  quelle: string;           // optional, Buch / Website / Erfahrung
  status: KorrekturStatus;
  begruendung: string;      // bei status='verworfen'
  erstellt: number;
  autorProfilId: string;
}

function itemZuKorrektur(item: Item): Korrektur {
  const d = item.data as Record<string, unknown>;
  return {
    id: item.id,
    scope: String(d.scope ?? ''),
    abschnitt: String(d.abschnitt ?? ''),
    hinweis: String(d.hinweis ?? ''),
    quelle: String(d.quelle ?? ''),
    status: (d.status as KorrekturStatus) ?? 'eingegangen',
    begruendung: String(d.begruendung ?? ''),
    erstellt: typeof d.erstellt === 'number' ? d.erstellt : Date.parse(item.createdAt) || Date.now(),
    autorProfilId: String(d.autorProfilId ?? item.createdBy ?? 'anonym'),
  };
}

const FILTER = { type: KORREKTUR_TYPE };

// Alle Korrektur-Hinweise eines Scopes (für eigenen Doc sichtbar).
export function useKorrekturenZuScope(scope: string) {
  const { data: items } = useItems(FILTER);
  const { data: user } = useCurrentUser();
  const { mutate: createItem } = useCreateItem();
  const { mutate: deleteItem } = useDeleteItem();

  const korrekturen = useMemo(() => {
    return items
      .map(itemZuKorrektur)
      .filter(k => k.scope === scope)
      .sort((a, b) => b.erstellt - a.erstellt);
  }, [items, scope]);

  const sendeKorrektur = useCallback(async (abschnitt: string, hinweis: string, quelle: string) => {
    const daten = {
      scope,
      abschnitt: abschnitt.trim(),
      hinweis: hinweis.trim(),
      quelle: quelle.trim(),
      status: 'eingegangen' as KorrekturStatus,
      begruendung: '',
      erstellt: Date.now(),
      autorProfilId: user?.id ?? 'anonym',
    };
    const item = await createItem({
      type: KORREKTUR_TYPE,
      createdBy: user?.id ?? 'anonym',
      data: daten,
    });
    return item ? itemZuKorrektur(item) : null;
  }, [createItem, scope, user?.id]);

  const loescheKorrektur = useCallback(async (id: string) => {
    await deleteItem(id);
  }, [deleteItem]);

  return { korrekturen, sendeKorrektur, loescheKorrektur };
}
