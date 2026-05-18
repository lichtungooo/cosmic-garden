// Beispielfragen + Antworten — werden beim ersten Start in localStorage geseedet.
// 10 typische Garten-Fragen mit je 2-4 Antworten von verschiedenen "Autoren".

import type { Frage, Antwort } from '../lib/qanda';

interface SeedFrage {
  id: string;
  titel: string;
  text: string;
  pflanzenIds?: string[];
  status: 'offen' | 'beantwortet' | 'umstritten';
  alterTage: number;
  autorName: string;
  antworten: SeedAntwort[];
}

interface SeedAntwort {
  autorName: string;
  was: string;
  womit?: string;
  wann?: string;
  ergebnis: string;
  kontext?: string;
  herzen: number;
  alterTage: number;
}

const FRAGEN_DATEN: SeedFrage[] = [
  {
    id: 'seed-schnecken',
    titel: 'Was hilft wirklich gegen Schnecken am Salatbeet?',
    text: 'Mein Pflueckesalat verschwindet ueber Nacht — die spanische Wegschnecke macht alles platt. Ich will ungern zu Schneckenkorn greifen. Was hat sich bei euch bewaehrt?',
    pflanzenIds: ['kopfsalat', 'pflucksalat'],
    status: 'beantwortet',
    alterTage: 14,
    autorName: 'Marie',
    antworten: [
      {
        autorName: 'Hans',
        was: 'Schneckenzaun aus verzinktem Blech ums ganze Salatbeet',
        womit: '40 cm hoher Streifen mit umgeknickter Oberkante (5 cm Schraege), Hornbach hat fertige Sets',
        wann: 'Vor dem Pflanzen aufstellen, dann das ganze Jahr stehen lassen',
        ergebnis: 'Seit drei Jahren keine einzige Schnecke mehr im Salat. Lohnt sich wirklich.',
        kontext: 'Hanggarten in Nordhessen, sehr feucht',
        herzen: 12,
        alterTage: 13,
      },
      {
        autorName: 'Eva',
        was: 'Abends mit Stirnlampe sammeln und in den Wald tragen',
        wann: 'Bei Daemmerung, vor allem nach Regen',
        ergebnis: '40-60 Schnecken pro Abend in der Saison. Nach drei Wochen war die Plage durch. Mit der Zeit kommen weniger.',
        kontext: 'Bin nicht zimperlich, aber toeten muss ich nicht',
        herzen: 7,
        alterTage: 10,
      },
      {
        autorName: 'Otto',
        was: 'Indische Laufenten im Garten',
        womit: 'Zwei Enten reichen fuer 500 m²',
        ergebnis: 'Perfekt. Fressen nur Schnecken, lassen Salat in Ruhe. Sind super.',
        kontext: 'Brauchen aber Stall, Wasser, Aufwand. Nicht fuer jeden.',
        herzen: 4,
        alterTage: 8,
      },
      {
        autorName: 'Marie',
        was: 'Kaffeesatz um die Pflanzen streuen',
        wann: 'Nach jedem Regen erneuern',
        ergebnis: 'Hilft kurzzeitig, aber Wirkung haelt nicht. Schnecken kommen zurueck.',
        herzen: 1,
        alterTage: 5,
      },
    ],
  },
  {
    id: 'seed-blattlaeuse-rose',
    titel: 'Rosen voll mit Blattlaeusen — was tun ohne Gift?',
    text: 'Meine Damaszener-Rose ist befallen, die ganzen jungen Triebe schwarz. Welche Hausmittel haben bei euch wirklich gewirkt?',
    pflanzenIds: ['rose'],
    status: 'beantwortet',
    alterTage: 9,
    autorName: 'Bernd',
    antworten: [
      {
        autorName: 'Eva',
        was: 'Brennnessel-Jauche spritzen',
        womit: '1 kg frische Brennnessel auf 10 L Regenwasser, 14 Tage gaeren, dann 1:50 verduennt mit Spritze auf die Triebe',
        wann: 'Morgens bei trockenem Wetter, 3 Tage hintereinander',
        ergebnis: 'Nach einer Woche fast keine Lauese mehr. Marienkaefer-Larven haben den Rest gemacht.',
        herzen: 9,
        alterTage: 7,
      },
      {
        autorName: 'Otto',
        was: 'Knoblauch-Sud',
        womit: '100 g Knoblauch zerstossen in 1 L kochendes Wasser, 30 Min ziehen, unverduennt spritzen',
        ergebnis: 'Riecht streng, aber wirkt sofort. Lauese fallen ab.',
        herzen: 5,
        alterTage: 6,
      },
      {
        autorName: 'Hans',
        was: 'Mit dem Gartenschlauch abspritzen',
        wann: 'Jeden Morgen 3 Tage lang',
        ergebnis: 'Einfach und kostenlos. Reicht oft schon. Wichtig: Strahl nicht zu hart, sonst leiden die Triebe.',
        herzen: 3,
        alterTage: 4,
      },
    ],
  },
  {
    id: 'seed-krautfaeule',
    titel: 'Krautfaeule an Tomaten verhindern — was wirkt vorbeugend?',
    text: 'Letztes Jahr verlor ich die halbe Ernte an Krautfaeule. Will dieses Jahr vorbeugen statt heilen. Welche Routinen helfen?',
    pflanzenIds: ['tomate'],
    status: 'beantwortet',
    alterTage: 21,
    autorName: 'Sonja',
    antworten: [
      {
        autorName: 'Marie',
        was: 'Tomaten ueberdachen + nur am Boden giessen',
        womit: 'Folientunnel oder einfaches Dach aus Bauplane, Wasser direkt zur Wurzel',
        wann: 'Ab Mai bis Ende der Saison',
        ergebnis: 'Seit drei Jahren keine Krautfaeule mehr. Blaetter bleiben trocken, das ist der Schluessel.',
        kontext: 'Stabtomaten in Reihe',
        herzen: 14,
        alterTage: 18,
      },
      {
        autorName: 'Bernd',
        was: 'Schachtelhalm-Bruehe spritzen',
        womit: '300 g frischer Ackerschachtelhalm in 10 L Wasser, 24 h einweichen, 30 Min koecheln, 1:5 verduennt spritzen',
        wann: 'Alle 10-14 Tage praeventiv ab Juni',
        ergebnis: 'Kieselsaeure staerkt die Zellwaende. Plus Mulchschicht aus Stroh. Tomaten stehen kerngesund.',
        herzen: 10,
        alterTage: 15,
      },
      {
        autorName: 'Otto',
        was: 'Untere Blaetter konsequent abschneiden + Geiztriebe ausbrechen',
        wann: 'Wenn untere Blaetter Bodenkontakt haben',
        ergebnis: 'Pilzsporen kommen mit Spritzwasser vom Boden hoch. Wer die untersten 30 cm Stiele blattfrei haelt, bricht die Infektionskette.',
        herzen: 6,
        alterTage: 12,
      },
    ],
  },
  {
    id: 'seed-erste-aussaat',
    titel: 'Wann mit der Vorzucht im Haus anfangen?',
    text: 'Ich bin neu im Selber-Vorziehen. Welche Pflanzen wann auf der Fensterbank starten? Lieber zu frueh oder zu spaet?',
    pflanzenIds: ['tomate', 'paprika', 'chili'],
    status: 'beantwortet',
    alterTage: 30,
    autorName: 'Lea',
    antworten: [
      {
        autorName: 'Hans',
        was: 'Chili + Paprika ab Mitte Februar, Tomate ab Anfang Maerz, Auberginen Mitte Februar',
        womit: 'Anzuchterde + kleine Toepfe, Heizmatte hilft bei Chili',
        wann: 'Maria-Thuns Aussaattage beachten oder bei zunehmenden Mond saeen',
        ergebnis: 'Pflanzen sind dann Ende Mai krautig und stark, kommen sofort ins Wachsen.',
        kontext: 'Ohne Gewaechshaus, nur Fensterbank Sued',
        herzen: 11,
        alterTage: 25,
      },
      {
        autorName: 'Eva',
        was: 'Nicht zu frueh anfangen!',
        wann: 'Erst Anfang Maerz, sonst wachsen die Pflanzen lang und schwach',
        ergebnis: 'Lange Pflanzen mit kleinem Wurzelballen haben es viel schwerer, sich nach dem Auspflanzen zu erholen. Lieber kompakt und krautig.',
        herzen: 8,
        alterTage: 20,
      },
    ],
  },
  {
    id: 'seed-saatgut-vermehrung',
    titel: 'Tomatensaatgut selbst gewinnen — wie genau?',
    text: 'Ich habe eine wunderbare Black-Krim-Tomate. Wie nehme ich das Saatgut richtig ab, damit es im naechsten Jahr keimt?',
    pflanzenIds: ['tomate'],
    status: 'beantwortet',
    alterTage: 45,
    autorName: 'Sonja',
    antworten: [
      {
        autorName: 'Otto',
        was: 'Nass-Methode mit Gaerung',
        womit: 'Vollreife Frucht aufschneiden, Samen mit Fruchtfleisch in ein Glas, mit etwas Wasser bedecken',
        wann: '3 Tage bei Zimmertemperatur stehen lassen, taeglich umruehren. Es bildet sich eine Hefeschicht obendrauf.',
        ergebnis: 'Gute Samen sinken zu Boden. Mit Sieb abspuelen, auf einem Teller (nie auf Papier!) trocknen. In Glaesern dunkel + kuehl lagern, 4-10 Jahre keimfaehig.',
        kontext: 'Wichtig: nur samenfeste Sorten, F1-Hybriden bringen nichts',
        herzen: 13,
        alterTage: 40,
      },
      {
        autorName: 'Marie',
        was: 'Bei Dreschflegel oder VEN nachfragen',
        ergebnis: 'Die Saatgut-Vereine bieten Workshops und nehmen oft auch eigene Vermehrungen entgegen. Schoener Austausch.',
        herzen: 4,
        alterTage: 35,
      },
    ],
  },
  {
    id: 'seed-mondkalender',
    titel: 'Lohnt sich der Maria-Thun-Aussaatkalender wirklich?',
    text: 'Ich bin skeptisch — wer hat es ausprobiert? Spuert man wirklich einen Unterschied zwischen Fruchttag und Wurzeltag?',
    status: 'umstritten',
    alterTage: 60,
    autorName: 'Bernd',
    antworten: [
      {
        autorName: 'Eva',
        was: 'Selbst getestet ueber 3 Jahre',
        wann: 'Zwei Beete mit gleichem Saatgut — eines nach Thun, eines beliebig',
        ergebnis: 'Bei Wurzelgemuese deutlicher Unterschied — Moehren am Wurzeltag groesser, suesser. Bei Salat kaum messbar. Insgesamt: ja, es wirkt, aber nicht spektakulaer.',
        kontext: 'Demeter-Garten, biologisch-dynamisch',
        herzen: 8,
        alterTage: 50,
      },
      {
        autorName: 'Hans',
        was: 'Halte ich fuer Esoterik',
        ergebnis: 'Wissenschaftliche Studien zeigen entweder keine oder nur minimale Effekte. Ich saee, wenn das Wetter passt und der Boden bereit ist.',
        herzen: 5,
        alterTage: 45,
      },
      {
        autorName: 'Sonja',
        was: 'Nutze ihn als Rhythmus-Hilfe',
        ergebnis: 'Egal ob die kosmische Wirkung stimmt — der Kalender gibt mir Struktur. Ich saee bewusster, weil ich auf die Tage achte. Allein das macht schon einen Unterschied.',
        herzen: 7,
        alterTage: 40,
      },
    ],
  },
  {
    id: 'seed-kompost',
    titel: 'Mein Kompost stinkt — was mache ich falsch?',
    text: 'Riecht faulig, fast nach Ammoniak. Fliegen schwirren herum. Was lief schief und wie kann ich das retten?',
    status: 'beantwortet',
    alterTage: 7,
    autorName: 'Lea',
    antworten: [
      {
        autorName: 'Otto',
        was: 'Zu viel Kuechenabfaelle, zu wenig Trockenes',
        womit: 'Geknickte Aeste, trockenes Laub, Stroh, Papier dazwischenlegen',
        wann: 'Sofort eine Schicht Trockenes drauf, dann gut durchmischen',
        ergebnis: 'Verhaeltnis sollte etwa 50:50 sein. Faulig = zu nass + zu stickstoffhaltig. Mit Trockenem kommt Luft rein.',
        herzen: 10,
        alterTage: 6,
      },
      {
        autorName: 'Marie',
        was: 'Komposter umsetzen',
        wann: 'An einem Tag wo Zeit ist',
        ergebnis: 'Mit der Gabel alles umschichten. Bringt Sauerstoff rein, Stinkbakterien werden durch aerobe ersetzt. Nach 2 Wochen riecht es nach Walderde.',
        herzen: 6,
        alterTage: 5,
      },
    ],
  },
  {
    id: 'seed-mulchen-was',
    titel: 'Welches Mulchmaterial fuer welches Beet?',
    text: 'Ich habe Stroh, Laub und Rasenschnitt zur Wahl. Was passt wofuer am besten?',
    status: 'beantwortet',
    alterTage: 35,
    autorName: 'Bernd',
    antworten: [
      {
        autorName: 'Hans',
        was: 'Stroh fuer Tomaten und Erdbeeren, Laub fuer Stauden, Rasenschnitt sparsam',
        womit: 'Stroh haelt Boden feucht und sauber, Laub schuetzt vor Frost, Rasenschnitt waermt aber kann faulen',
        wann: 'Stroh nach dem Pflanzen, Laub im Herbst, Rasenschnitt nur duenn (1-2 cm)',
        ergebnis: 'Beste Ergebnisse mit Stroh. Erdbeeren bleiben sauber, Tomaten kein Spritzwasser von unten.',
        kontext: 'Wichtig: angetrockneten Rasenschnitt nehmen, sonst verbrennt er Pflanzen',
        herzen: 11,
        alterTage: 30,
      },
      {
        autorName: 'Eva',
        was: 'Heuabschnitt + Hanfstroh aus Kassel',
        womit: 'Eigene Heu-Reste aus dem Garten + Hanfstroh vom Bauern',
        ergebnis: 'Hanfstroh ist Gold — bleibt locker, holt langsam Stickstoff, baut Humus auf. Eine 5-cm-Schicht haelt eine Saison.',
        herzen: 5,
        alterTage: 20,
      },
    ],
  },
  {
    id: 'seed-apfelbaum-schnitt',
    titel: 'Wann den Apfelbaum schneiden — Winter oder Sommer?',
    text: 'Mein alter Apfelbaum traegt jedes Jahr weniger. Wann ist der richtige Zeitpunkt fuer einen Verjuengungsschnitt?',
    pflanzenIds: ['apfel'],
    status: 'beantwortet',
    alterTage: 90,
    autorName: 'Sonja',
    antworten: [
      {
        autorName: 'Otto',
        was: 'Winterschnitt fuer Verjuengung, Sommerschnitt fuer Fruchtform',
        wann: 'Januar bis Maerz bei frostfreiem Wetter, abnehmender Mond. Sommerschnitt im August nach der Ernte.',
        ergebnis: 'Im Winter geschnittene Triebe treiben kraeftig nach, gut zum Aufbauen. Sommerschnitt bremst Wachstum und foerdert Fruchtholz.',
        kontext: 'Bei alten Baeumen lieber ueber 2-3 Jahre verteilt schneiden, nicht alles auf einmal',
        herzen: 13,
        alterTage: 80,
      },
      {
        autorName: 'Marie',
        was: 'Erst beobachten, dann schneiden',
        wann: 'Im Winter mehrere Tage vor dem Baum stehen — welche Aeste tragen, welche stoeren',
        ergebnis: 'Die meisten Hobbygaertner schneiden zu viel und zu wahllos. Pro Jahr maximal ein Drittel der Krone wegnehmen. Wasserschosse und Konkurrenztriebe weg, Fruchtaeste behalten.',
        herzen: 9,
        alterTage: 75,
      },
    ],
  },
  {
    id: 'seed-mischkultur-bohnen',
    titel: 'Drei-Schwestern-Pflanzung — wie funktioniert sie wirklich?',
    text: 'Mais, Bohne, Kuerbis zusammen — klingt schoen, aber wie genau setze ich das um? Was wann wo?',
    pflanzenIds: ['mais', 'stangenbohne', 'kuerbis'],
    status: 'beantwortet',
    alterTage: 50,
    autorName: 'Lea',
    antworten: [
      {
        autorName: 'Eva',
        was: 'Mais zuerst, Bohne 3 Wochen spaeter, Kuerbis dazwischen',
        womit: 'Mais als Vorzucht im Topf, Bohne direkt am Mais-Stengel, Kuerbis im Hauefelchen mit Kompost',
        wann: 'Mais Mitte Mai auspflanzen, Bohne Anfang Juni, Kuerbis gleichzeitig',
        ergebnis: 'Bohne klettert am Mais hoch, Kuerbis-Blaetter beschatten Boden und halten Feuchtigkeit. Bohne bringt Stickstoff fuer alle. Klassische indianische Pflanzung — funktioniert seit 5000 Jahren.',
        kontext: 'Wichtig: gute Erde, alle drei sind Starkzehrer. Hauefelchen 60 cm Abstand',
        herzen: 16,
        alterTage: 45,
      },
      {
        autorName: 'Hans',
        was: 'Sonnenblume + Kapuzinerkresse dazu',
        womit: 'Sonnenblume als Klettergeruest-Ergaenzung, Kapuzinerkresse als Bodendecker und Schaedlings-Ablenker',
        ergebnis: 'Macht die Drei-Schwestern zur Fuenf-Schwestern-Polykultur. Sehr stabil, kaum Ausfaelle.',
        herzen: 7,
        alterTage: 30,
      },
    ],
  },
];

function antwortenAusSeed(frageId: string, antworten: SeedAntwort[]): Antwort[] {
  const jetzt = Date.now();
  const tag = 86_400_000;
  return antworten.map((a, i) => {
    const erstellt = jetzt - a.alterTage * tag;
    const votes = Array.from({ length: a.herzen }, (_, k) => ({
      benutzerId: `seed-voter-${frageId}-${i}-${k}`,
      zeitstempel: erstellt + k * 1000,
    }));
    return {
      id: `seed-antwort-${frageId}-${i}`,
      frageId,
      autorId: `seed-autor-${a.autorName.toLowerCase()}`,
      autorName: a.autorName,
      was: a.was,
      womit: a.womit,
      wann: a.wann,
      ergebnis: a.ergebnis,
      kontext: a.kontext,
      votes,
      erstellt,
    };
  });
}

export function generiereSeedDaten(): { fragen: Frage[]; antworten: Antwort[] } {
  const jetzt = Date.now();
  const tag = 86_400_000;
  const fragen: Frage[] = FRAGEN_DATEN.map(f => ({
    id: f.id,
    titel: f.titel,
    text: f.text,
    pflanzenIds: f.pflanzenIds,
    status: f.status,
    erstellt: jetzt - f.alterTage * tag,
    autorId: `seed-autor-${f.autorName.toLowerCase()}`,
    autorName: f.autorName,
  }));
  const antworten: Antwort[] = FRAGEN_DATEN.flatMap(f =>
    antwortenAusSeed(f.id, f.antworten)
  );
  return { fragen, antworten };
}
