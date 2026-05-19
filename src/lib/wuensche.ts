// Themen-Wünsche pro Welt — was die Gemeinschaft gerne aufgenommen sehen würde.
// Wünsche hängen am Scope (z.B. 'welt:pflanzen', 'welt:praxis'). Status zeigt,
// ob ein Wunsch noch offen ist, gerade in Arbeit oder bereits eingebaut.
// Timo und Eli ziehen die Spitzen pro Welt regelmäßig heraus und bauen sie ein.

import { useCallback, useMemo } from 'react';
import type { Item } from '@real-life-stack/data-interface';
import {
  useItems,
  useCreateItem,
  useDeleteItem,
  useUpdateItem,
  useCurrentUser,
} from '@real-life-stack/toolkit';

export const WUNSCH_TYPE = 'garten-wunsch';

export type WunschTiefe = 'kurz' | 'mittel' | 'tief';
export type WunschStatus = 'offen' | 'in-arbeit' | 'eingebaut';

export interface Wunsch {
  id: string;
  scope: string;           // 'welt:pflanzen', 'welt:praxis', 'welt:schulen', 'welt:gemeinschaft', 'welt:kosmos'
  titel: string;
  beschreibung: string;
  tiefe: WunschTiefe;
  tags: string[];
  status: WunschStatus;
  eingebautLink: string;   // bei status='eingebaut'
  erstellt: number;
  autorProfilId: string;
}

function itemZuWunsch(item: Item): Wunsch {
  const d = item.data as Record<string, unknown>;
  return {
    id: item.id,
    scope: String(d.scope ?? ''),
    titel: String(d.titel ?? ''),
    beschreibung: String(d.beschreibung ?? ''),
    tiefe: (d.tiefe as WunschTiefe) ?? 'mittel',
    tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
    status: (d.status as WunschStatus) ?? 'offen',
    eingebautLink: String(d.eingebautLink ?? ''),
    erstellt: typeof d.erstellt === 'number' ? d.erstellt : Date.parse(item.createdAt) || Date.now(),
    autorProfilId: String(d.autorProfilId ?? item.createdBy ?? 'anonym'),
  };
}

const FILTER = { type: WUNSCH_TYPE };

export function useWuenscheZuScope(scope: string) {
  const { data: items } = useItems(FILTER);
  const { data: user } = useCurrentUser();
  const { mutate: createItem } = useCreateItem();
  const { mutate: updateItem } = useUpdateItem();
  const { mutate: deleteItem } = useDeleteItem();

  const wuensche = useMemo(() => {
    return items
      .map(itemZuWunsch)
      .filter(w => w.scope === scope)
      .sort((a, b) => b.erstellt - a.erstellt);  // neueste oben — Voting kommt mit W2
  }, [items, scope]);

  const wuenscheAuf = useCallback(async (
    titel: string,
    beschreibung: string,
    tiefe: WunschTiefe,
    tags: string[],
  ) => {
    const daten = {
      scope,
      titel: titel.trim(),
      beschreibung: beschreibung.trim(),
      tiefe,
      tags: tags.filter(t => t.trim()),
      status: 'offen' as WunschStatus,
      eingebautLink: '',
      erstellt: Date.now(),
      autorProfilId: user?.id ?? 'anonym',
    };
    const item = await createItem({
      type: WUNSCH_TYPE,
      createdBy: user?.id ?? 'anonym',
      data: daten,
    });
    return item ? itemZuWunsch(item) : null;
  }, [createItem, scope, user?.id]);

  const aktualisiereStatus = useCallback(async (id: string, status: WunschStatus, eingebautLink = '') => {
    const vorhanden = items.find(i => i.id === id);
    if (!vorhanden) return;
    await updateItem(id, { data: { ...vorhanden.data, status, eingebautLink } });
  }, [updateItem, items]);

  const loescheWunsch = useCallback(async (id: string) => {
    await deleteItem(id);
  }, [deleteItem]);

  return { wuensche, wuenscheAuf, aktualisiereStatus, loescheWunsch };
}

export function tiefeLabel(t: WunschTiefe): string {
  return { kurz: 'kurz', mittel: 'mittel', tief: 'tief' }[t];
}

export function tiefeBeschreibung(t: WunschTiefe): string {
  return {
    kurz: 'eine Seite, wenige Abschnitte',
    mittel: 'mehrere Abschnitte, dazu Beispiele',
    tief: 'eigene Sektion, ausführliche Tiefe',
  }[t];
}

export function statusLabel(s: WunschStatus): string {
  return { 'offen': 'offen', 'in-arbeit': 'in Arbeit', 'eingebaut': 'eingebaut' }[s];
}

export function statusFarbe(s: WunschStatus): string {
  return { 'offen': '#8b6f47', 'in-arbeit': '#c89b3a', 'eingebaut': '#4a8a3a' }[s];
}

export interface WunschStats {
  offen: number;
  inArbeit: number;
  eingebaut: number;
  gesamt: number;
}

export function stats(wuensche: Wunsch[]): WunschStats {
  let offen = 0, inArbeit = 0, eingebaut = 0;
  for (const w of wuensche) {
    if (w.status === 'offen') offen++;
    else if (w.status === 'in-arbeit') inArbeit++;
    else if (w.status === 'eingebaut') eingebaut++;
  }
  return { offen, inArbeit, eingebaut, gesamt: wuensche.length };
}

// Bereich-Definitionen für die Wunschlisten-Seite
export type WunschBereich = 'pflanzen' | 'praxis' | 'schulen' | 'gemeinschaft' | 'kosmos' | 'app';

export interface BereichDef {
  id: WunschBereich;
  scope: string;       // wie in items gespeichert
  label: string;
  beispiel: string;
}

export const BEREICHE: BereichDef[] = [
  { id: 'pflanzen',     scope: 'welt:pflanzen',     label: 'Pflanzen',     beispiel: 'Topinambur aufnehmen' },
  { id: 'praxis',       scope: 'welt:praxis',       label: 'Praxis',       beispiel: 'Mykorrhiza-Inokulation' },
  { id: 'schulen',      scope: 'welt:schulen',      label: 'Schulen',      beispiel: 'Hügelkultur tiefer behandeln' },
  { id: 'gemeinschaft', scope: 'welt:gemeinschaft', label: 'Gemeinschaft', beispiel: 'Saatgut-Tausch-Treffen' },
  { id: 'kosmos',       scope: 'welt:kosmos',       label: 'Kosmos',       beispiel: 'Plejaden-Zyklus tiefer' },
  { id: 'app',          scope: 'app',               label: 'Ideen zur Seite', beispiel: 'Druck-Ansicht für Pflanzen-Steckbriefe' },
];

export function bereichAusScope(scope: string): BereichDef | undefined {
  return BEREICHE.find(b => b.scope === scope);
}
