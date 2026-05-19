// Jahreskreis-Daten: 8 Sabbate, Raunaechte, germanische Bezeichnungen.
import { sonnwende, phasenZwischen, type PhaseTimestamp } from './himmel';

export type FestArt = 'sonnwende' | 'tagnachtgleiche' | 'zwischenfest';

export interface Jahresfest {
  id: string;
  name: string;
  germName?: string;
  art: FestArt;
  datum: Date;
  beschreibung: string;
  farbe: string;
}

// Im Samhain-Jahr "jahr" (= 31.10.(jahr-1) bis 31.10.(jahr)) liegen folgende Feste:
export function festeImJahr(jahr: number): Jahresfest[] {
  const julfestVorjahr = sonnwende(jahr - 1, 270); // Julfest am Anfang des Samhain-Jahres
  const fruehling      = sonnwende(jahr, 0);
  const sommer         = sonnwende(jahr, 90);
  const herbst         = sonnwende(jahr, 180);

  const feste: Jahresfest[] = [
    {
      id: 'samhain',
      name: 'Samhain',
      germName: 'Wintersnacht',
      art: 'zwischenfest',
      datum: new Date(jahr - 1, 9, 31), // 31. Oktober Vorjahres = Jahresanfang
      beschreibung: 'Ahnenfest. Beginn des neuen Jahres. Der Schleier zwischen den Welten ist dünn.',
      farbe: '#5b3a8a',
    },
    {
      id: 'julfest',
      name: 'Julfest',
      germName: 'Jul / Yule',
      art: 'sonnwende',
      datum: julfestVorjahr,
      beschreibung: 'Wintersonnenwende. Tiefster Stand der Sonne, Wiedergeburt des Lichts. Beginn der Raunächte.',
      farbe: '#3b4b6b',
    },
    {
      id: 'disting',
      name: 'Imbolc',
      germName: 'Disting',
      art: 'zwischenfest',
      datum: new Date(jahr, 1, 1),
      beschreibung: 'Lichtmess. Erstes Anschwellen des Lichts, Reinigung. Schafe beginnen zu lammen, Milch fließt wieder.',
      farbe: '#d6c896',
    },
    {
      id: 'ostara',
      name: 'Ostara',
      art: 'tagnachtgleiche',
      datum: fruehling,
      beschreibung: 'Frühlings-Tagundnachtgleiche. Tag und Nacht gleich lang, das Licht übernimmt. Aussaat, Eier, Hasen.',
      farbe: '#a8c98a',
    },
    {
      id: 'walpurgis',
      name: 'Walpurgis',
      germName: 'Beltane',
      art: 'zwischenfest',
      datum: new Date(jahr, 4, 1),
      beschreibung: 'Maifeuer. Hochzeit von Himmel und Erde, fruchtbares Blühen. Tanz um den Maibaum. Gegenpol zu Samhain.',
      farbe: '#d4825a',
    },
    {
      id: 'mittsommer',
      name: 'Mittsommer',
      germName: 'Litha / Sonnwendfeier',
      art: 'sonnwende',
      datum: sommer,
      beschreibung: 'Sommersonnenwende. Höchster Sonnenstand, längster Tag. Kräuter sammeln, Sonnenfeuer. Gegenpol zum Julfest.',
      farbe: '#e8a82b',
    },
    {
      id: 'schnitterfest',
      name: 'Schnitterfest',
      germName: 'Lammas / Lughnasadh',
      art: 'zwischenfest',
      datum: new Date(jahr, 7, 1),
      beschreibung: 'Erste Erntefest. Brotbacken aus neuem Korn, Dank für das Wachsen.',
      farbe: '#c89b3a',
    },
    {
      id: 'mabon',
      name: 'Mabon',
      germName: 'Herbst-Equinoctium',
      art: 'tagnachtgleiche',
      datum: herbst,
      beschreibung: 'Herbst-Tagundnachtgleiche. Zweite Ernte, Wein und Apfel. Die Nacht übernimmt.',
      farbe: '#a8423a',
    },
  ];
  return feste.sort((a, b) => a.datum.getTime() - b.datum.getTime());
}

export interface Raunaecht {
  start: Date;
  ende: Date;
}

export function raunaechte(jahr: number): Raunaecht {
  // 12 Nachte vom Julfest (Wintersonnenwende) bis zum 6. Januar des Folgejahres
  const julfest = sonnwende(jahr, 270);
  const ende = new Date(jahr + 1, 0, 6);
  return { start: julfest, ende };
}

export interface Sperrnaecht {
  start: Date;
  ende: Date;
}

// Sperrnaechte: die 6 Naechte vor Julfest, traditionell Vorbereitungszeit.
export function sperrnaechte(jahr: number): Sperrnaecht {
  const julfest = sonnwende(jahr, 270);
  const start = new Date(julfest);
  start.setDate(start.getDate() - 6);
  return { start, ende: julfest };
}

export interface MondphasenJahr {
  vollmonde: PhaseTimestamp[];
  neumonde: PhaseTimestamp[];
  ersteViertel: PhaseTimestamp[];
  letzteViertel: PhaseTimestamp[];
}

export function mondphasenImJahr(jahr: number): MondphasenJahr {
  const von = new Date(jahr, 0, 1);
  const bis = new Date(jahr + 1, 0, 1);
  const alle = phasenZwischen(von, bis);
  return {
    vollmonde:      alle.filter(p => p.event === 'vollmond'),
    neumonde:       alle.filter(p => p.event === 'neumond'),
    ersteViertel:   alle.filter(p => p.event === 'erstes-viertel'),
    letzteViertel:  alle.filter(p => p.event === 'letztes-viertel'),
  };
}

// Tag im Jahr (0-365) — wird für Winkel-Berechnung gebraucht
export function tagImJahr(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export function tageImJahr(jahr: number): number {
  // Schaltjahr-Check
  return ((jahr % 4 === 0 && jahr % 100 !== 0) || jahr % 400 === 0) ? 366 : 365;
}

// Uhr-Layout: 1. Januar oben (12 Uhr), im Uhrzeigersinn durchs Jahr.
export function datumZuWinkel(d: Date, jahr: number): number {
  const jahresanfang = new Date(jahr, 0, 1).getTime();
  const jahresende = new Date(jahr + 1, 0, 1).getTime();
  const gesamt = jahresende - jahresanfang;
  let verstrichen = d.getTime() - jahresanfang;
  if (verstrichen < 0) verstrichen += gesamt;
  if (verstrichen >= gesamt) verstrichen -= gesamt;
  const anteil = verstrichen / gesamt;
  return -90 + anteil * 360;
}

export function jahresAnfang(jahr: number): Date {
  return new Date(jahr, 0, 1);
}
export function jahresEnde(jahr: number): Date {
  return new Date(jahr + 1, 0, 1);
}
