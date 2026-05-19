// Karte — Pins als WoT-Items im persoenlichen/geteilten Doc.
// Drei Pin-Typen, alle als type: "garten-pin" mit kind im data-Feld.

import { useCallback, useMemo } from 'react';
import type { Item } from '@real-life-stack/data-interface';
import {
  useItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useCurrentUser,
} from '@real-life-stack/toolkit';

export const PIN_TYPE = 'garten-pin';

export type PinArt = 'gaertner' | 'gartenprojekt' | 'veranstaltung' | 'angebot';

export interface Pin {
  id: string;
  art: PinArt;
  titel: string;
  text: string;       // Markdown
  lat: number;
  lng: number;
  hashtags: string[];
  autorId: string;
  autorName: string;
  erstellt: number;
  // optionaler Adress-Hinweis zusätzlich zu lat/lng
  ortBeschreibung?: string;
  // optionales Bild als Data-URL
  bild?: string;
  // veranstaltung-spezifisch
  datum?: string;     // ISO
  // angebot-spezifisch
  preis?: string;
  // gaertner-spezifisch — Verweis auf Profil-Item (falls vorhanden)
  profilId?: string;
}

export function pinArtLabel(art: PinArt): string {
  return {
    gaertner:      'Profil',
    gartenprojekt: 'Garten',
    veranstaltung: 'Veranstaltung',
    angebot:       'Marktplatz',
  }[art];
}

export function pinArtFarbe(art: PinArt): string {
  return {
    gaertner:      '#4a8a3a', // accent-gruen
    gartenprojekt: '#2c5a24', // accent-deep
    veranstaltung: '#d4a542', // gold/bluete
    angebot:       '#c0432f', // frucht
  }[art];
}

export function pinArtSymbol(art: PinArt): string {
  return {
    gaertner:      '☘',
    gartenprojekt: '⌂',
    veranstaltung: '★',
    angebot:       '⚇',
  }[art];
}

// === Mapping ===

function itemZuPin(item: Item): Pin {
  const d = item.data as Record<string, unknown>;
  const erstellt = typeof d.erstellt === 'number' ? d.erstellt : Date.parse(item.createdAt) || Date.now();
  return {
    id: item.id,
    art: (d.art as PinArt) ?? 'gaertner',
    titel: String(d.titel ?? ''),
    text: String(d.text ?? ''),
    lat: typeof d.lat === 'number' ? d.lat : 0,
    lng: typeof d.lng === 'number' ? d.lng : 0,
    hashtags: Array.isArray(d.hashtags) ? (d.hashtags as string[]) : [],
    autorId: String(d.autorId ?? item.createdBy ?? 'anonym'),
    autorName: String(d.autorName ?? 'Anonym'),
    erstellt,
    ortBeschreibung: typeof d.ortBeschreibung === 'string' ? d.ortBeschreibung : undefined,
    bild: typeof d.bild === 'string' ? d.bild : undefined,
    datum: typeof d.datum === 'string' ? d.datum : undefined,
    preis: typeof d.preis === 'string' ? d.preis : undefined,
    profilId: typeof d.profilId === 'string' ? d.profilId : undefined,
  };
}

const FILTER = { type: PIN_TYPE };

export function usePins(): Pin[] {
  const { data: items } = useItems(FILTER);
  return useMemo(() => items.map(itemZuPin), [items]);
}

export function useMeineGaertnerPin(): Pin | null {
  const { data: user } = useCurrentUser();
  const pins = usePins();
  return useMemo(() => {
    if (!user) return null;
    return pins.find(p => p.art === 'gaertner' && p.autorId === user.id) ?? null;
  }, [pins, user]);
}

export function usePinAktionen() {
  const { data: user } = useCurrentUser();
  const { mutate: createItem } = useCreateItem();
  const { mutate: updateItem } = useUpdateItem();
  const { mutate: deleteItem } = useDeleteItem();

  const meineId = user?.id ?? 'anonym';
  const meinName = user?.displayName ?? 'Anonym';

  const lege = useCallback(async (pin: Omit<Pin, 'id' | 'autorId' | 'autorName' | 'erstellt'>) => {
    const daten = {
      art: pin.art,
      titel: pin.titel,
      text: pin.text,
      lat: pin.lat,
      lng: pin.lng,
      hashtags: pin.hashtags,
      autorId: meineId,
      autorName: meinName,
      erstellt: Date.now(),
      ...(pin.ortBeschreibung && { ortBeschreibung: pin.ortBeschreibung }),
      ...(pin.bild && { bild: pin.bild }),
      ...(pin.datum && { datum: pin.datum }),
      ...(pin.preis && { preis: pin.preis }),
      ...(pin.profilId && { profilId: pin.profilId }),
    };
    return createItem({ type: PIN_TYPE, createdBy: meineId, data: daten });
  }, [createItem, meineId, meinName]);

  const aendere = useCallback(async (id: string, aktuell: Pin, patch: Partial<Pin>) => {
    const next = { ...aktuell, ...patch };
    const daten: Record<string, unknown> = {
      art: next.art,
      titel: next.titel,
      text: next.text,
      lat: next.lat,
      lng: next.lng,
      hashtags: next.hashtags,
      autorId: next.autorId,
      autorName: next.autorName,
      erstellt: next.erstellt,
    };
    if (next.ortBeschreibung) daten.ortBeschreibung = next.ortBeschreibung;
    if (next.bild) daten.bild = next.bild;
    if (next.datum) daten.datum = next.datum;
    if (next.preis) daten.preis = next.preis;
    if (next.profilId) daten.profilId = next.profilId;
    await updateItem(id, { data: daten });
  }, [updateItem]);

  const loesche = useCallback(async (id: string) => {
    await deleteItem(id);
  }, [deleteItem]);

  return { lege, aendere, loesche };
}

// === Hashtag-Filter ===

export function pinPasstZuTags(pin: Pin, gesuchteTags: string[]): boolean {
  if (gesuchteTags.length === 0) return true;
  return gesuchteTags.every(t => pin.hashtags.includes(t));
}
