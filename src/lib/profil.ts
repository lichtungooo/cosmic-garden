// Garten-Profil — Erweiterungs-Item mit allen Feldern, die Antons WoT-Doc
// nicht selbst speichert (alles ausser name/bio/avatar).
//
// Pro Abschnitt eine Sichtbarkeits-Wahl: öffentlich | kontakte | nur-ich.

import { useCallback, useMemo } from 'react';
import type { Item } from '@real-life-stack/data-interface';
import {
  useItems,
  useCreateItem,
  useUpdateItem,
  useCurrentUser,
} from '@real-life-stack/toolkit';

export const PROFIL_TYPE = 'garten-profil-extension';

export type Sichtbarkeit = 'oeffentlich' | 'kontakte' | 'nur-ich';

export interface SichtbarkeitsMap {
  bio?: Sichtbarkeit;
  gartenkarriere?: Sichtbarkeit;
  begabungen?: Sichtbarkeit;
  beduerfnisse?: Sichtbarkeit;
  ort?: Sichtbarkeit;
  kontakt?: Sichtbarkeit;
  tagebuch?: Sichtbarkeit;
  fragen?: Sichtbarkeit;
  bilder?: Sichtbarkeit;
}

export interface GartenProfil {
  gartenkarriere: string;
  begabungen: string[];   // Hashtags ohne "#"
  beduerfnisse: string[]; // Hashtags ohne "#"
  standort: string;
  klimazone: string;
  bodenart: string;
  lieblingsPflanzen: string[];
  telegramHandle: string;
  telegramGruppe: string;
  bilder: string[];       // Daten-URLs oder URLs
  sichtbarkeit: SichtbarkeitsMap;
}

export const LEERES_PROFIL: GartenProfil = {
  gartenkarriere: '',
  begabungen: [],
  beduerfnisse: [],
  standort: '',
  klimazone: '',
  bodenart: '',
  lieblingsPflanzen: [],
  telegramHandle: '',
  telegramGruppe: '',
  bilder: [],
  sichtbarkeit: {
    bio: 'oeffentlich',
    gartenkarriere: 'oeffentlich',
    begabungen: 'oeffentlich',
    beduerfnisse: 'oeffentlich',
    ort: 'kontakte',
    kontakt: 'kontakte',
    tagebuch: 'nur-ich',
    fragen: 'oeffentlich',
    bilder: 'kontakte',
  },
};

// === Hashtag-Helfer ===

/**
 * Normalisiert Eingabe zu einem sauberen Hashtag:
 * - klein geschrieben
 * - ohne fuehrendes #
 * - keine Leerzeichen (durch - ersetzt)
 * - Umlaute behalten (User-sichtbar, gut suchbar)
 */
export function normalisiereTag(roh: string): string {
  return roh
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9äöüß\-]/g, '');
}

export function fuegeTagHinzu(tags: string[], roh: string): string[] {
  const sauber = normalisiereTag(roh);
  if (!sauber) return tags;
  if (tags.includes(sauber)) return tags;
  return [...tags, sauber];
}

export function entferneTag(tags: string[], tag: string): string[] {
  return tags.filter(t => t !== tag);
}

// === Mapping ===

function itemZuProfil(item: Item | undefined): GartenProfil {
  if (!item) return { ...LEERES_PROFIL };
  const d = item.data as Record<string, unknown>;
  return {
    gartenkarriere: typeof d.gartenkarriere === 'string' ? d.gartenkarriere : '',
    begabungen: Array.isArray(d.begabungen) ? (d.begabungen as string[]) : [],
    beduerfnisse: Array.isArray(d.beduerfnisse) ? (d.beduerfnisse as string[]) : [],
    standort: typeof d.standort === 'string' ? d.standort : '',
    klimazone: typeof d.klimazone === 'string' ? d.klimazone : '',
    bodenart: typeof d.bodenart === 'string' ? d.bodenart : '',
    lieblingsPflanzen: Array.isArray(d.lieblingsPflanzen) ? (d.lieblingsPflanzen as string[]) : [],
    telegramHandle: typeof d.telegramHandle === 'string' ? d.telegramHandle : '',
    telegramGruppe: typeof d.telegramGruppe === 'string' ? d.telegramGruppe : '',
    bilder: Array.isArray(d.bilder) ? (d.bilder as string[]) : [],
    sichtbarkeit: {
      ...LEERES_PROFIL.sichtbarkeit,
      ...(typeof d.sichtbarkeit === 'object' && d.sichtbarkeit ? (d.sichtbarkeit as SichtbarkeitsMap) : {}),
    },
  };
}

// === Hook ===

const FILTER = { type: PROFIL_TYPE };

export function useMeinProfil() {
  const { data: user } = useCurrentUser();
  const { data: items } = useItems(FILTER);
  const { mutate: createItem } = useCreateItem();
  const { mutate: updateItem } = useUpdateItem();

  const meineId = user?.id;

  const meinItem = useMemo(
    () => meineId ? items.find(i => i.createdBy === meineId) : undefined,
    [items, meineId],
  );

  const profil = useMemo(() => itemZuProfil(meinItem), [meinItem]);

  const speichere = useCallback(async (aktualisierungen: Partial<GartenProfil>) => {
    const naechstes: GartenProfil = {
      ...profil,
      ...aktualisierungen,
      sichtbarkeit: {
        ...profil.sichtbarkeit,
        ...(aktualisierungen.sichtbarkeit ?? {}),
      },
    };
    const datenObjekt = naechstes as unknown as Record<string, unknown>;
    if (meinItem) {
      await updateItem(meinItem.id, { data: datenObjekt });
    } else if (meineId) {
      await createItem({
        type: PROFIL_TYPE,
        createdBy: meineId,
        data: datenObjekt,
      });
    }
  }, [createItem, updateItem, meinItem, meineId, profil]);

  return { profil, speichere, geladen: !!user };
}
