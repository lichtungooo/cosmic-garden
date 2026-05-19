// Einheitliches Datenmodell für das Garten-Werk.
// Eine zentrale Eintrag-Tabelle mit Discriminated Union über den Typ.
// Architektur-Entscheidung 16.05.2026 nach Deep-Research-Empfehlung.

// === Basis-Typen ===

export type EintragsTyp = 'pflanze' | 'arbeit' | 'wissen' | 'frage' | 'antwort';

export type Tagestyp = 'wurzel' | 'blatt' | 'bluete' | 'frucht';
export type Mondphase = 'neumond' | 'zunehmend' | 'vollmond' | 'abnehmend';
export type Jahreszeit = 'fruehling' | 'sommer' | 'herbst' | 'winter';

export type SonderZeit = 'mondknoten' | 'vollmond-exakt' | 'neumond-exakt' | 'sonnwende' | 'tagundnachtgleiche';

// === Beziehungs-Typen (typisierte Adjazenz) ===

export type BeziehungsArt =
  | 'verwandt'        // thematisch verwandt
  | 'praxis-fuer'     // konkrete Anwendung fuer (Brennnessel-Jauche praxis-fuer Tomate)
  | 'wirkt-an'        // wirkt am Tagestyp/Mondphase (z.B. Pflanze wirkt-an Fruchttag)
  | 'tradition-von'   // Tradition stammt von (z.B. Huegelkultur tradition-von Sepp Holzer)
  | 'gehoert-zu'      // ist Teil einer Hierarchie/Sektion
  | 'antwort-zu'      // Antwort auf eine Frage
  | 'erwaehnt'        // wird erwaehnt in
  | 'begleiter'       // Mischkultur-Begleiter (Pflanze ↔ Pflanze)
  | 'gegner';         // Mischkultur-Gegner (Pflanze ↔ Pflanze)

export interface Beziehung {
  art: BeziehungsArt;
  zielId: string;
  notiz?: string;
}

// === Block-Inhalt ===

export interface Block {
  titel: string;
  text: string;
}

// === Zeitbezug (wann ist der Eintrag relevant) ===

export interface Zeitbezug {
  tagestypen?: Tagestyp[];      // Mond steht in diesen Zeichen
  mondphasen?: Mondphase[];     // Mondphasen-Filter
  jahreszeiten?: Jahreszeit[];
  monate?: number[];             // 1..12
  sonderzeiten?: SonderZeit[];
}

// === Basis-Eintrag (gemeinsam für alle Typen) ===

export interface BasisEintrag {
  id: string;                    // global eindeutig: "pflanze:tomate", "wissen:mond:mondknoten"
  typ: EintragsTyp;
  titel: string;
  untertitel?: string;
  symbol?: string;
  kurz: string;                  // ein Satz
  bloecke: Block[];              // hauptinhalt
  tags: string[];                // hashtags, frei waehlbar aus kontrolliertem Vokabular
  kategorie: string;             // hierarchisch: "garten/pflanzen/fruchtgemuese"
  unterkategorie?: string;
  beziehungen: Beziehung[];
  zeitbezug?: Zeitbezug;
  aktualisiert?: string;         // ISO-Datum
  quellen?: string[];
}

// === Typ-spezifische Einträge ===

export interface PflanzeMeta {
  lateinisch: string;
  familie: string;
  pflanzenkategorie: 'frucht' | 'blatt' | 'wurzel' | 'bluete' | 'kraut' | 'baum' | 'beere';
  thunTyp: Tagestyp;
  vorzuchtVon: string | null;    // "MM-DD"
  vorzuchtBis: string | null;
  auspflanzenVon: string;
  auspflanzenBis: string;
  ernteVon: string;
  ernteBis: string;
  saattiefeCm: number;
  keimerTyp: 'hell' | 'dunkel' | 'indifferent';
  keimtempC: string;
  keimdauerTage: string;
  pflanzabstandCm: number;
  tipps: string;
  vorzucht: boolean;
}

export interface PflanzeEintrag extends BasisEintrag {
  typ: 'pflanze';
  pflanze: PflanzeMeta;
}

export interface ArbeitMeta {
  arbeitskategorie: string;       // schnitt, veredelung, boden, rasen, pflanzung, pflege, ernte, winterschutz, planung
  vonMonat: number;
  bisMonat: number;
  thunEmpfehlung: Tagestyp;
  mondPhase: string;
  tipps: string;
}

export interface ArbeitEintrag extends BasisEintrag {
  typ: 'arbeit';
  arbeit: ArbeitMeta;
}

export interface WissenMeta {
  sektion: 'tierkreis' | 'mond' | 'sonne' | 'kalender' | 'maya' | 'bruecken' | 'traditionen' | 'praxis';
  element?: string;
  thunTyp?: Tagestyp;
  sonneSidVon?: string;
  sonneSidBis?: string;
  sonneTropVon?: string;
  sonneTropBis?: string;
  pflanzenBezug?: string[];       // pflanze-ids
}

export interface WissenEintrag extends BasisEintrag {
  typ: 'wissen';
  wissen: WissenMeta;
}

export interface FrageMeta {
  status: 'offen' | 'beantwortet' | 'umstritten';
  bezugPflanzen?: string[];        // pflanze-ids
  bezugSchaedlinge?: string[];     // tags
  ersteller?: string;              // user-id (oder anonym)
  erstellt?: string;
}

export interface FrageEintrag extends BasisEintrag {
  typ: 'frage';
  frage: FrageMeta;
}

export interface Vote {
  benutzerId: string;
  richtung: 'hoch' | 'runter';
  zeitstempel: number;
}

export interface AntwortMeta {
  fragenId: string;
  autor: string;                   // user-id
  was: string;                     // konkrete Massnahme
  womit?: string;                  // Mittel/Werkzeug
  wann?: string;                   // Zeitpunkt/Bedingung
  ergebnis: string;                // Wirkung
  kontext?: string;                // Pflanze, Garten, Region
  votes: Vote[];
  erstellt: string;
  aktualisiert?: string;
}

export interface AntwortEintrag extends BasisEintrag {
  typ: 'antwort';
  antwort: AntwortMeta;
}

// === Discriminated Union ===

export type Eintrag =
  | PflanzeEintrag
  | ArbeitEintrag
  | WissenEintrag
  | FrageEintrag
  | AntwortEintrag;

// === Helper-Typen ===

export interface DatenbankZustand {
  eintraege: Eintrag[];
  vokabular: TagVokabular;
  backlinks: Map<string, BacklinkEintrag[]>;
}

export interface BacklinkEintrag {
  vonId: string;
  art: BeziehungsArt;
}

export interface TagVokabular {
  kuratiert: Record<string, TagDefinition>;
  synonyme: Record<string, string>;     // synonym -> kanonisch
  langTail: string[];                    // ungenutzte gefundene Tags
}

export interface TagDefinition {
  name: string;
  gruppe: string;                        // "zeitpunkt", "tagestyp", "schule", "schaedling", "pflanzentyp"
  beschreibung?: string;
}

// === Voting-Helfer ===

export function voteScore(votes: Vote[]): number {
  return votes.reduce((s, v) => s + (v.richtung === 'hoch' ? 1 : -1), 0);
}

export function hatBenutzerGevotet(votes: Vote[], benutzerId: string): Vote | undefined {
  return votes.find(v => v.benutzerId === benutzerId);
}

// === Bequeme Type-Guards ===

export function istPflanze(e: Eintrag): e is PflanzeEintrag { return e.typ === 'pflanze'; }
export function istArbeit(e: Eintrag): e is ArbeitEintrag { return e.typ === 'arbeit'; }
export function istWissen(e: Eintrag): e is WissenEintrag { return e.typ === 'wissen'; }
export function istFrage(e: Eintrag): e is FrageEintrag { return e.typ === 'frage'; }
export function istAntwort(e: Eintrag): e is AntwortEintrag { return e.typ === 'antwort'; }
