import tierkreisData from '../data/wissen_tierkreis.json';
import mondData from '../data/wissen_mond.json';
import sonneData from '../data/wissen_sonne.json';
import kalenderData from '../data/wissen_kalender.json';
import mayaData from '../data/wissen_maya.json';
import brueckenData from '../data/wissen_bruecken.json';
import traditionenData from '../data/wissen_traditionen.json';
import praxisData from '../data/wissen_praxis.json';
import pilzeData from '../data/wissen_pilze.json';
import indoorData from '../data/wissen_indoor.json';
import naturmagierData from '../data/wissen_naturmagier.json';
import saatgutData from '../data/wissen_saatgut.json';
import schaedlingeData from '../data/wissen_schaedlinge.json';
import gemeinschaftData from '../data/wissen_gemeinschaft.json';

export interface WissenBlock {
  titel: string;
  text: string;
}

export interface WissenMeta {
  element?: string;
  thunTyp?: 'wurzel' | 'blatt' | 'bluete' | 'frucht';
  sonneSidVon?: string;
  sonneSidBis?: string;
  sonneTropVon?: string;
  sonneTropBis?: string;
}

export interface WissenVerweis {
  sektion: string;
  eintrag: string;
}

export interface WissenEintrag {
  id: string;
  name: string;
  untertitel?: string;
  symbol?: string;
  kurz: string;
  meta?: WissenMeta;
  bloecke: WissenBlock[];
  pflanzen?: string[];
  verwandt?: WissenVerweis[];
}

export interface WissenSektion {
  id: string;
  name: string;
  beschreibung: string;
  eintraege: WissenEintrag[];
}

export const SEKTIONEN: WissenSektion[] = [
  {
    id: 'tierkreis',
    name: 'Tierkreis',
    beschreibung: 'Die zwoelf Tierkreiszeichen siderisch — wie sie heute tatsaechlich am Himmel stehen. Mit ihrer Astronomie, ihrer Mythologie aus drei Welten (griechisch, vedisch, Maya) und ihrer Bedeutung fuer den Garten.',
    eintraege: tierkreisData as WissenEintrag[],
  },
  {
    id: 'mond',
    name: 'Mond',
    beschreibung: 'Der Mond hat viele Rhythmen — synodisch, siderisch, Knoten, Phasen, Aufstieg und Abstieg. Was wirkt im Garten, was ist astronomisch.',
    eintraege: mondData as WissenEintrag[],
  },
  {
    id: 'sonne',
    name: 'Sonne',
    beschreibung: 'Tropisches und siderisches Jahr, Sonnwenden, Praezession, Sonnenfleckenzyklus — die Sonne als Mass der Zeit.',
    eintraege: sonneData as WissenEintrag[],
  },
  {
    id: 'kalender',
    name: 'Kalender',
    beschreibung: 'Wie verschiedene Kulturen die Zeit gefasst haben. Gregorianisch, juedisch, islamisch, Hindu, chinesisch, Meton.',
    eintraege: kalenderData as WissenEintrag[],
  },
  {
    id: 'maya',
    name: 'Maya',
    beschreibung: 'Tiefe in das Maya-Wissen: Zivilisation, Popol Vuh, Tzolkin im Detail, Venus-Tafeln, Plejaden, 21.12.2012.',
    eintraege: mayaData as WissenEintrag[],
  },
  {
    id: 'bruecken',
    name: 'Bruecken',
    beschreibung: 'Verbindendes Wissen — Maria Thuns Versuche, Mond-Pflanzen-Wirkung, lineare und zyklische Zeit, Astrologie und Astronomie, kosmische Rhythmen.',
    eintraege: brueckenData as WissenEintrag[],
  },
  {
    id: 'traditionen',
    name: 'Traditionen',
    beschreibung: 'Garten-Schulen und Bewegungen, die den Anbau anders denken — Anastasia, Demeter, Permakultur, Huegelkultur, Forest Garden, Naturgarten, Maria Thun. Jede mit eigener Tiefe, Praxis und Geschichte.',
    eintraege: traditionenData as WissenEintrag[],
  },
  {
    id: 'praxis',
    name: 'Praxis',
    beschreibung: 'Konkrete Techniken fuer den Garten — Mischkultur, Mulchen, Giessen, Jauchen, Pflanzenschutz, Mykorrhiza, Mikroorganismen. Was man tatsaechlich tut, mit Rezepten und Mengen.',
    eintraege: praxisData as WissenEintrag[],
  },
  {
    id: 'pilze',
    name: 'Pilze',
    beschreibung: 'Pilze im Garten und auf dem Substrat — Mycel und Fruchtkoerper, Austernpilz und Shiitake, Pilzbeet und Strohballen. Symbiosen mit Pflanzen, das verborgene Netz unter der Erde.',
    eintraege: pilzeData as WissenEintrag[],
  },
  {
    id: 'indoor',
    name: 'Indoor',
    beschreibung: 'Garten unter Dach — Sprossen und Microgreens, Grow-Light und Hydrokultur, Indoor-Kraeuter, Klima im Topf. Was wachsen kann, wenn der Himmel zu weit ist.',
    eintraege: indoorData as WissenEintrag[],
  },
  {
    id: 'naturmagier',
    name: 'Naturmagier',
    beschreibung: 'Stille Lehrer der lebendigen Erde — Viktor Schauberger und das Wasser, Hildegard von Bingen, Justin Christofleau und die Elektrokultur, Kupferwerkzeuge nach PKS. Wissen, das aus dem Schauen kommt.',
    eintraege: naturmagierData as WissenEintrag[],
  },
  {
    id: 'saatgut',
    name: 'Saatgut',
    beschreibung: 'Das Korn der Wiederkehr — samenfeste Sorten, alte Kulturpflanzen, Vermehrung von Hand. Wie das Leben sich selbst erhaelt und wie wir es weitertragen. Dreschflegel, Arche Noah, ProSpecieRara, Open Source Seeds — die Hueter der Vielfalt.',
    eintraege: saatgutData as WissenEintrag[],
  },
  {
    id: 'schaedlinge',
    name: 'Schaedlinge & Bekaempfung',
    beschreibung: 'Wer kommt ungebeten — und wer hilft im Beet. Schaedlings-Portraits, Auszuege und Bruehen mit Rezept, Nuetzlinge zum Anlocken, mechanische Schutzmethoden. Vom Brennnessel-Sud bis zum Schneckenzaun.',
    eintraege: schaedlingeData as WissenEintrag[],
  },
  {
    id: 'gemeinschaft',
    name: 'Gemeinschaft',
    beschreibung: 'Garten als Begegnung. Allmende, Stadtgaerten, Gemeinschaftsgaerten, Schulgaerten — wo Erde, Haende und Menschen zusammenkommen. Vom Kleingarten-Verein bis zum Permakultur-Hof.',
    eintraege: gemeinschaftData as WissenEintrag[],
  },
];

export function findeEintrag(sektionId: string, eintragId: string): WissenEintrag | null {
  const s = SEKTIONEN.find(s => s.id === sektionId);
  if (!s) return null;
  return s.eintraege.find(e => e.id === eintragId) ?? null;
}
