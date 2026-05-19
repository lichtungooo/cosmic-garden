// Such-Hook über alle WoT-Items, die mit Hashtags arbeiten.
// Aktuell: Karten-Pins (alle 4 Arten) und Profile (Begabungen/Beduerfnisse/Lieblings-Pflanzen).
//
// Grundsatz: alles, was wir in den WoT-Doc speichern, MUSS in dieser Suche auftauchen.
// Wenn ein neuer Item-Typ dazukommt (Marktplatz-Angebot, Veranstaltung im Kalender,
// Tagebuch-Eintrag mit Public-Sichtbarkeit), hier mitziehen.

import { useMemo } from 'react';
import { useItems } from '@real-life-stack/toolkit';
import { PIN_TYPE, pinArtFarbe, pinArtLabel, type Pin, type PinArt } from './karte';
import { PROFIL_TYPE } from './profil';

export type WotTreffer =
  | { kind: 'pin'; pin: Pin; punkte: number }
  | { kind: 'profil'; profilId: string; name: string; hashtags: string[]; punkte: number };

const PIN_FILTER = { type: PIN_TYPE };
const PROFIL_FILTER = { type: PROFIL_TYPE };

function passt(query: string, ...felder: (string | string[] | undefined)[]): number {
  const q = query.toLowerCase().replace(/^#+/, '').trim();
  if (q.length < 2) return 0;
  let punkte = 0;
  for (const f of felder) {
    if (!f) continue;
    if (Array.isArray(f)) {
      for (const s of f) {
        if (s.toLowerCase().includes(q)) punkte += 3; // Tag-Treffer wiegt schwer
      }
    } else if (typeof f === 'string') {
      if (f.toLowerCase().includes(q)) punkte += 1;
    }
  }
  return punkte;
}

export function useWotSuche(query: string): WotTreffer[] {
  const { data: pinItems } = useItems(PIN_FILTER);
  const { data: profilItems } = useItems(PROFIL_FILTER);

  return useMemo(() => {
    const treffer: WotTreffer[] = [];
    const q = query.trim();
    if (q.length < 2) return treffer;

    for (const item of pinItems) {
      const d = item.data as Record<string, unknown>;
      const pin: Pin = {
        id: item.id,
        art: (d.art as PinArt) ?? 'gaertner',
        titel: String(d.titel ?? ''),
        text: String(d.text ?? ''),
        lat: typeof d.lat === 'number' ? d.lat : 0,
        lng: typeof d.lng === 'number' ? d.lng : 0,
        hashtags: Array.isArray(d.hashtags) ? (d.hashtags as string[]) : [],
        autorId: String(d.autorId ?? item.createdBy ?? 'anonym'),
        autorName: String(d.autorName ?? 'Anonym'),
        erstellt: Date.parse(item.createdAt) || Date.now(),
      };
      const p = passt(q, pin.titel, pin.text, pin.hashtags);
      if (p > 0) treffer.push({ kind: 'pin', pin, punkte: p });
    }

    for (const item of profilItems) {
      const d = item.data as Record<string, unknown>;
      const begabungen = Array.isArray(d.begabungen) ? (d.begabungen as string[]) : [];
      const beduerfnisse = Array.isArray(d.beduerfnisse) ? (d.beduerfnisse as string[]) : [];
      const lieblings = Array.isArray(d.lieblingsPflanzen) ? (d.lieblingsPflanzen as string[]) : [];
      const p = passt(q, begabungen, beduerfnisse, lieblings, String(d.standort ?? ''));
      if (p > 0) {
        treffer.push({
          kind: 'profil',
          profilId: item.id,
          name: item.createdBy.slice(-6),
          hashtags: [...begabungen, ...beduerfnisse, ...lieblings],
          punkte: p,
        });
      }
    }

    return treffer.sort((a, b) => b.punkte - a.punkte);
  }, [query, pinItems, profilItems]);
}

export function pinTrefferFarbe(t: WotTreffer): string {
  if (t.kind === 'pin') return pinArtFarbe(t.pin.art);
  return '#5b3a8a';
}

export function pinTrefferKategorie(t: WotTreffer): string {
  if (t.kind === 'pin') return pinArtLabel(t.pin.art);
  return 'Gärtner';
}
