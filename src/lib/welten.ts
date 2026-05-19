// Vier Welten — die Top-Gliederung des Werks.
// Alles ist Wissen. Pflanze und Sternzeichen, Arbeit und Schule stehen gleich.
// Die Trennung "Garten / Wissen" ist aufgehoben.

import type { EintragsTyp } from './datenbank';

export type WeltId = 'kosmos' | 'pflanzen' | 'praxis' | 'schulen' | 'gemeinschaft';

export interface Welt {
  id: WeltId;
  name: string;
  symbol: string;            // ein Zeichen, das die Welt traegt
  farbe: string;             // Akzent-Farbe
  kurz: string;              // ein Satz
  beschreibung: string;      // ein Absatz für den Welt-Kopf
}

export const WELTEN: Welt[] = [
  {
    id: 'kosmos',
    name: 'Kosmos',
    symbol: '☉',
    farbe: '#3b4b6b',
    kurz: 'Sonne, Mond, Sterne, Kalender, kosmische Rhythmen.',
    beschreibung: 'Die Ordnung am Himmel und ihre Wiederkehr. Sonnenlauf und Mondphasen, siderischer Tierkreis, die Kalendersysteme der Voelker (gregorianisch, juedisch, islamisch, Hindu, chinesisch, Meton, Maya) und die Bruecken zwischen Astronomie und Garten.',
  },
  {
    id: 'pflanzen',
    name: 'Pflanzen',
    symbol: '🌱',
    farbe: '#4a7c3a',
    kurz: 'Die Wesen, die wir pflegen.',
    beschreibung: 'Vierzig Pflanzenarten — ihre Familien, Saatzeiten, Erntefenster, Mischkultur-Partner und Tagestyp-Bezuege. Was sie wollen und was sie geben.',
  },
  {
    id: 'praxis',
    name: 'Praxis',
    symbol: '⚒',
    farbe: '#5b3a8a',
    kurz: 'Was man tut. Boden, Wasser, Pflege.',
    beschreibung: 'Gartenarbeiten und konkrete Techniken — Boden lockern, Mulchen, Giessen, Jauchen, Mykorrhiza, Mischkultur-Praxis, Pflanzenschutz. Mit Rezepten, Mengen und Zeitpunkten.',
  },
  {
    id: 'schulen',
    name: 'Schulen',
    symbol: '📖',
    farbe: '#a8423a',
    kurz: 'Die Wege und Denker.',
    beschreibung: 'Garten-Bewegungen und ihre Quellen — Maria Thun, Demeter, Permakultur, Sepp Holzer, Huegelkultur, Forest Garden, Naturgarten, Anastasia. Jede mit eigener Tiefe, eigenem Werk und eigener Praxis.',
  },
  {
    id: 'gemeinschaft',
    name: 'Gemeinschaft',
    symbol: '🤝',
    farbe: '#d4783a',
    kurz: 'Garten als Begegnung.',
    beschreibung: 'Allmende, Stadtgaerten, Gemeinschaftsgaerten, Schulgaerten — wo Erde, Haende und Menschen zusammenkommen. Vom Kleingarten-Verein bis zum Permakultur-Hof. Bald als Spaces im Real Life Network sichtbar und vernetzt.',
  },
];

export function welt(id: WeltId): Welt {
  const w = WELTEN.find(x => x.id === id);
  if (!w) throw new Error(`Welt ${id} nicht definiert`);
  return w;
}

// Mapping vom Eintrags-Typ + alter Sektion zur Welt.
// Wird vom Adapter genutzt, um die kategorie zu setzen.

export function weltFuerPflanze(): WeltId { return 'pflanzen'; }
export function weltFuerArbeit(): WeltId { return 'praxis'; }

export function weltFuerWissenSektion(sektion: string): WeltId {
  switch (sektion) {
    case 'tierkreis':
    case 'mond':
    case 'sonne':
    case 'kalender':
    case 'maya':
    case 'bruecken':
      return 'kosmos';
    case 'praxis':
    case 'pilze':
    case 'indoor':
    case 'saatgut':
    case 'schaedlinge':
      return 'praxis';
    case 'traditionen':
    case 'naturmagier':
      return 'schulen';
    case 'gemeinschaft':
      return 'gemeinschaft';
    default:
      return 'kosmos';
  }
}

// Welt aus Kategorie-Pfad ableiten (erste Ebene).
export function weltAusKategorie(kategorie: string): WeltId | null {
  const erste = kategorie.split('/')[0];
  if (erste === 'kosmos' || erste === 'pflanzen' || erste === 'praxis' || erste === 'schulen' || erste === 'gemeinschaft') {
    return erste;
  }
  return null;
}

// Welche Welt für einen Eintragstyp passend ist (zur Sortierung in Treffer-Listen)
export function defaultWeltFuerTyp(typ: EintragsTyp): WeltId {
  if (typ === 'pflanze') return 'pflanzen';
  if (typ === 'arbeit')  return 'praxis';
  return 'kosmos';
}
