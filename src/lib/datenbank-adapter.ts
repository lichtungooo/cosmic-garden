// Legacy-Adapter: liest die alten JSON-Dateien und transformiert sie ins neue Schema.
// Laeuft zur Laufzeit (kein Build-Schritt). Die App nutzt vorerst weiter die alten Daten,
// aber das neue Schema ist parallel verfuegbar.

import { pflanzen as alterPflanzen, gartenarbeiten as alterArbeiten } from './pflanzen';
import { SEKTIONEN as alterWissenSektionen } from './wissen';
import { weltFuerWissenSektion } from './welten';
import vokabularData from '../data/_vokabular.json';
import type {
  Eintrag,
  PflanzeEintrag,
  ArbeitEintrag,
  WissenEintrag,
  Beziehung,
  Zeitbezug,
  Tagestyp,
  Jahreszeit,
  TagVokabular,
  DatenbankZustand,
  BacklinkEintrag,
} from './datenbank';

// === Tag-Vokabular laden ===

export const vokabular: TagVokabular = vokabularData as TagVokabular;

function normalisiereTag(tag: string): string {
  const lower = tag.toLowerCase().trim();
  return vokabular.synonyme[lower] ?? lower;
}

// === Hilfsfunktionen ===

function monatZuJahreszeit(monat: number): Jahreszeit {
  if (monat >= 3 && monat <= 5) return 'fruehling';
  if (monat >= 6 && monat <= 8) return 'sommer';
  if (monat >= 9 && monat <= 11) return 'herbst';
  return 'winter';
}

function monateZuJahreszeiten(monate: number[]): Jahreszeit[] {
  const js = new Set<Jahreszeit>();
  for (const m of monate) js.add(monatZuJahreszeit(m));
  return Array.from(js);
}

function fensterZuMonaten(von: string | null, bis: string | null): number[] {
  if (!von || !bis) return [];
  const [vM] = von.split('-').map(Number);
  const [bM] = bis.split('-').map(Number);
  const out: number[] = [];
  if (vM <= bM) {
    for (let m = vM; m <= bM; m++) out.push(m);
  } else {
    // wrap ueber Jahreswechsel
    for (let m = vM; m <= 12; m++) out.push(m);
    for (let m = 1; m <= bM; m++) out.push(m);
  }
  return out;
}

// === Pflanze: alt -> neu ===

function pflanzeAlsEintrag(p: typeof alterPflanzen[number]): PflanzeEintrag {
  const tags: string[] = [];

  // Tagestyp
  tags.push(`${p.thunTyp}tag`);

  // Pflanzenkategorie
  if (p.kategorie === 'frucht')  tags.push('fruchtgemuese');
  if (p.kategorie === 'blatt')   tags.push('blattgemuese');
  if (p.kategorie === 'wurzel')  tags.push('wurzelgemuese');
  if (p.kategorie === 'kraut')   tags.push('kraeuter');
  if (p.kategorie === 'bluete')  tags.push('blueher');
  if (p.kategorie === 'baum')    tags.push('obstbaum');
  if (p.kategorie === 'beere')   tags.push('beere');

  // Keimer
  if (p.keimerTyp === 'hell')    tags.push('hellkeimer');
  if (p.keimerTyp === 'dunkel')  tags.push('dunkelkeimer');

  // Vorzucht
  if (p.vorzucht) tags.push('vorzucht');

  // Aktive Phasen
  const auspflanzMonate = fensterZuMonaten(p.auspflanzenVon, p.auspflanzenBis);
  const ernteMonate = fensterZuMonaten(p.ernteVon, p.ernteBis);
  const alleMonate = Array.from(new Set([...auspflanzMonate, ...ernteMonate]));

  const zeitbezug: Zeitbezug = {
    tagestypen: [p.thunTyp as Tagestyp],
    monate: alleMonate,
    jahreszeiten: monateZuJahreszeiten(alleMonate),
  };

  // Bloecke aus den Feldern bauen — nur was vorhanden ist
  const bloecke: { titel: string; text: string }[] = [];
  if (p.tipps)      bloecke.push({ titel: 'Steckbrief',   text: p.tipps });
  if (p.geschichte) bloecke.push({ titel: 'Geschichte',   text: p.geschichte });
  if (p.wirkung)    bloecke.push({ titel: 'Wirkung',      text: p.wirkung });
  if (p.praxis)     bloecke.push({ titel: 'Praxis',       text: p.praxis });
  if (p.mythos)     bloecke.push({ titel: 'Mythos',       text: p.mythos });
  if (p.mischkultur?.notiz) {
    bloecke.push({ titel: 'Mischkultur', text: p.mischkultur.notiz });
  }

  // Beziehungen aus Mischkultur + bezuege
  const beziehungen: Beziehung[] = [];
  for (const id of p.mischkultur?.gut ?? []) {
    beziehungen.push({ art: 'begleiter', zielId: `pflanze:${id}` });
  }
  for (const id of p.mischkultur?.schlecht ?? []) {
    beziehungen.push({ art: 'gegner', zielId: `pflanze:${id}` });
  }
  for (const zielId of p.bezuege ?? []) {
    beziehungen.push({ art: 'verwandt', zielId });
  }

  return {
    id: `pflanze:${p.id}`,
    typ: 'pflanze',
    titel: p.name,
    untertitel: p.lateinisch,
    kurz: p.tipps.slice(0, 120),
    bloecke,
    tags: tags.map(normalisiereTag),
    kategorie: `pflanzen/${p.kategorie}`,
    beziehungen,
    zeitbezug,
    pflanze: {
      lateinisch: p.lateinisch,
      familie: p.familie,
      pflanzenkategorie: p.kategorie,
      thunTyp: p.thunTyp as Tagestyp,
      vorzuchtVon: p.vorzuchtVon,
      vorzuchtBis: p.vorzuchtBis,
      auspflanzenVon: p.auspflanzenVon,
      auspflanzenBis: p.auspflanzenBis,
      ernteVon: p.ernteVon,
      ernteBis: p.ernteBis,
      saattiefeCm: p.saattiefeCm,
      keimerTyp: p.keimerTyp,
      keimtempC: p.keimtempC,
      keimdauerTage: p.keimdauerTage,
      pflanzabstandCm: p.pflanzabstandCm,
      tipps: p.tipps,
      vorzucht: p.vorzucht,
    },
  };
}

// === Arbeit: alt -> neu ===

function arbeitAlsEintrag(a: typeof alterArbeiten[number]): ArbeitEintrag {
  const tags: string[] = [];
  tags.push(`${a.thunEmpfehlung}tag`);
  tags.push(a.kategorie);
  if (['zunehmend', 'abnehmend', 'aufsteigend', 'absteigend', 'vollmond', 'neumond'].includes(a.mondPhase)) {
    tags.push(a.mondPhase);
  }

  const monate: number[] = [];
  if (a.vonMonat <= a.bisMonat) {
    for (let m = a.vonMonat; m <= a.bisMonat; m++) monate.push(m);
  } else {
    for (let m = a.vonMonat; m <= 12; m++) monate.push(m);
    for (let m = 1; m <= a.bisMonat; m++) monate.push(m);
  }

  // Bloecke aus den Feldern bauen — nur was vorhanden ist
  const bloecke: { titel: string; text: string }[] = [];
  if (a.tipps)      bloecke.push({ titel: 'Steckbrief',  text: a.tipps });
  if (a.geschichte) bloecke.push({ titel: 'Geschichte',  text: a.geschichte });
  if (a.wirkung)    bloecke.push({ titel: 'Wirkung',     text: a.wirkung });
  if (a.praxis)     bloecke.push({ titel: 'Praxis',      text: a.praxis });
  if (a.mythos)     bloecke.push({ titel: 'Mythos',      text: a.mythos });

  // Beziehungen aus bezuege
  const beziehungen: Beziehung[] = [];
  for (const zielId of a.bezuege ?? []) {
    beziehungen.push({ art: 'verwandt', zielId });
  }

  return {
    id: `arbeit:${a.id}`,
    typ: 'arbeit',
    titel: a.name,
    kurz: a.tipps.slice(0, 120),
    bloecke,
    tags: tags.map(normalisiereTag),
    kategorie: `praxis/${a.kategorie}`,
    beziehungen,
    zeitbezug: {
      tagestypen: [a.thunEmpfehlung as Tagestyp],
      monate,
      jahreszeiten: monateZuJahreszeiten(monate),
    },
    arbeit: {
      arbeitskategorie: a.kategorie,
      vonMonat: a.vonMonat,
      bisMonat: a.bisMonat,
      thunEmpfehlung: a.thunEmpfehlung as Tagestyp,
      mondPhase: a.mondPhase,
      tipps: a.tipps,
    },
  };
}

// === Wissen: alt -> neu ===

interface AltWissenEintrag {
  id: string;
  name: string;
  untertitel?: string;
  symbol?: string;
  kurz: string;
  meta?: {
    element?: string;
    thunTyp?: string;
    sonneSidVon?: string;
    sonneSidBis?: string;
    sonneTropVon?: string;
    sonneTropBis?: string;
  };
  bloecke: { titel: string; text: string }[];
  pflanzen?: string[];
  verwandt?: { sektion: string; eintrag: string }[];
}

function wissenAlsEintrag(e: AltWissenEintrag, sektion: string): WissenEintrag {
  const tags: string[] = [sektion];

  // Tagestyp aus Meta
  if (e.meta?.thunTyp) tags.push(`${e.meta.thunTyp}tag`);

  // Element
  if (e.meta?.element) tags.push(e.meta.element.toLowerCase());

  // Sektion-spezifische Tags
  if (sektion === 'maya') {
    if (e.id.includes('tzolkin'))    tags.push('tzolkin');
    if (e.id.includes('haab'))       tags.push('haab');
    if (e.id.includes('long-count')) tags.push('long-count');
    if (e.id.includes('venus'))      tags.push('venus');
    if (e.id.includes('plejaden'))   tags.push('plejaden');
  }
  if (sektion === 'traditionen') {
    tags.push(e.id);   // Tradition-name als Tag (anastasia, biodynamik, etc.)
  }
  if (sektion === 'mond') {
    if (e.id.includes('mondknoten'))   tags.push('mondknoten');
    if (e.id.includes('aufsteigend'))  tags.push('aufsteigend', 'absteigend');
    if (e.id.includes('saros'))        tags.push('mondknoten');
  }
  if (sektion === 'praxis') {
    tags.push(e.id);   // praxis-name als Tag (mulchen, jauchen, etc.)
  }

  // Beziehungen aus alter verwandt-Liste
  const beziehungen: Beziehung[] = (e.verwandt ?? []).map(v => ({
    art: 'verwandt' as const,
    zielId: `wissen:${v.sektion}:${v.eintrag}`,
  }));

  // Pflanzen-Beziehungen
  if (e.pflanzen) {
    for (const pflanzenName of e.pflanzen) {
      // Versuche aus Name die id zu raten (lowercase, ohne Sonderzeichen)
      const id = pflanzenName.toLowerCase().replace(/[^a-z]/g, '');
      // Nicht ueberpruefen ob es die Pflanze gibt — wird beim Anwender ggf. ins Leere zeigen
      // Spaeter manuelle Pflege
      beziehungen.push({ art: 'wirkt-an', zielId: `pflanze:${id}` });
    }
  }

  const meta: WissenEintrag['wissen'] = { sektion: sektion as WissenEintrag['wissen']['sektion'] };
  if (e.meta?.element)       meta.element = e.meta.element;
  if (e.meta?.thunTyp)       meta.thunTyp = e.meta.thunTyp as Tagestyp;
  if (e.meta?.sonneSidVon)   meta.sonneSidVon = e.meta.sonneSidVon;
  if (e.meta?.sonneSidBis)   meta.sonneSidBis = e.meta.sonneSidBis;
  if (e.meta?.sonneTropVon)  meta.sonneTropVon = e.meta.sonneTropVon;
  if (e.meta?.sonneTropBis)  meta.sonneTropBis = e.meta.sonneTropBis;

  // Welt-Pfad bauen: Schulen + Gemeinschaft ohne Sektion (flach), andere Welten mit Sektion als Unterordner
  const weltId = weltFuerWissenSektion(sektion);
  const kategorie = (weltId === 'schulen' || weltId === 'gemeinschaft') ? weltId : `${weltId}/${sektion}`;

  return {
    id: `wissen:${sektion}:${e.id}`,
    typ: 'wissen',
    titel: e.name,
    untertitel: e.untertitel,
    symbol: e.symbol,
    kurz: e.kurz,
    bloecke: e.bloecke,
    tags: tags.map(normalisiereTag),
    kategorie,
    beziehungen,
    zeitbezug: meta.thunTyp ? { tagestypen: [meta.thunTyp] } : undefined,
    wissen: meta,
  };
}

// === Konsolidierte Datenbank laden ===

let zustandCache: DatenbankZustand | null = null;

export function ladeDatenbank(): DatenbankZustand {
  if (zustandCache) return zustandCache;

  const eintraege: Eintrag[] = [];

  // Pflanzen
  for (const p of alterPflanzen) {
    eintraege.push(pflanzeAlsEintrag(p));
  }

  // Arbeiten
  for (const a of alterArbeiten) {
    eintraege.push(arbeitAlsEintrag(a));
  }

  // Wissen
  for (const sektion of alterWissenSektionen) {
    for (const e of sektion.eintraege as unknown as AltWissenEintrag[]) {
      eintraege.push(wissenAlsEintrag(e, sektion.id));
    }
  }

  // Backlinks bauen
  const backlinks = new Map<string, BacklinkEintrag[]>();
  for (const e of eintraege) {
    for (const b of e.beziehungen) {
      const existing = backlinks.get(b.zielId) ?? [];
      existing.push({ vonId: e.id, art: b.art });
      backlinks.set(b.zielId, existing);
    }
  }

  zustandCache = { eintraege, vokabular, backlinks };
  return zustandCache;
}

// Beim ersten Aufruf wird automatisch geladen und gecached.
