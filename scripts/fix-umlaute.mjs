// Ersetzt ae/oe/ue/ss-Schreibweisen durch Umlaute in JSON-UI-Texten.
// Lässt IDs und Discriminator-Strings (id, kategorie, thunTyp, BeziehungsArt,
// die Targets von Markdown-Links wie (pflanze:xxx)) ASCII.
// Verarbeitet src/data/*.json + die UI-Strings in src/lib/*.ts.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Wort-Mapping. ALLE relevant für UI-Text. ASCII bleiben:
//   - Pflanzen-IDs, Wissens-IDs, Arbeiten-IDs (vor allem in den Markdown-Links nach `:`)
//   - Discriminator-Strings (kategorie, thunTyp, gruppe, art, ...)
// Mapping mit Wort-Grenze davor und danach.
const MAPPING = [
  // Vokabel-Reihen (häufig)
  ['Moehre', 'Möhre'],
  ['moehre', 'möhre'],
  ['Kuerbis', 'Kürbis'],
  ['kuerbis', 'kürbis'],
  ['Gruenkohl', 'Grünkohl'],
  ['Weisskohl', 'Weißkohl'],
  ['Suesskirsche', 'Süßkirsche'],
  ['suesskirsche', 'süßkirsche'],
  ['Pfluecksalat', 'Pflücksalat'],
  ['Loewenzahn', 'Löwenzahn'],
  ['Loewenmaeulchen', 'Löwenmäulchen'],
  ['Loewenzahnjauche', 'Löwenzahnjauche'],
  ['Loewenzahn-Jauche', 'Löwenzahn-Jauche'],

  // Tagestyp / Tierkreis (UI-Schreibweisen)
  ['Bluetentag', 'Blütentag'],
  ['Bluetentage', 'Blütentage'],
  ['bluetentag', 'blütentag'],
  ['bluetentage', 'blütentage'],
  ['Loewe', 'Löwe'],
  ['Loewen', 'Löwen'],
  ['Schuetze', 'Schütze'],
  ['Schuetzen', 'Schützen'],
  ['Bogenschuetze', 'Bogenschütze'],

  // Häufige Wörter
  ['Bluete', 'Blüte'],
  ['Blueten', 'Blüten'],
  ['bluete', 'blüte'],
  ['blueten', 'blüten'],
  ['blueh', 'blüh'],
  ['Blueh', 'Blüh'],
  ['Bluehen', 'Blühen'],
  ['Bluehzeit', 'Blühzeit'],
  ['Bluehende', 'Blühende'],
  ['bluetenstaende', 'blütenstände'],
  ['Bluetenstaende', 'Blütenstände'],
  ['Bluetenkoerbe', 'Blütenkörbe'],
  ['Bluetenpflanze', 'Blütenpflanze'],
  ['Bluetenpflanzen', 'Blütenpflanzen'],
  ['Bluetezeit', 'Blütezeit'],
  ['Bluetenboden', 'Blütenboden'],
  ['Bluetenhonig', 'Blütenhonig'],
  ['Bluetenfaeden', 'Blütenfäden'],
  ['Bluetenstand', 'Blütenstand'],

  ['Kraeuter', 'Kräuter'],
  ['Kraeut', 'Kräut'],
  ['kraeuter', 'kräuter'],
  ['Heilkraeuter', 'Heilkräuter'],
  ['Wuerzkraeuter', 'Würzkräuter'],

  ['Naehr', 'Nähr'],
  ['Naehrstoff', 'Nährstoff'],
  ['Naehrstoffe', 'Nährstoffe'],
  ['naehrstoff', 'nährstoff'],
  ['Naehrwert', 'Nährwert'],
  ['Naehrwerte', 'Nährwerte'],

  ['Schaedling', 'Schädling'],
  ['Schaedlinge', 'Schädlinge'],
  ['schaedling', 'schädling'],
  ['Schaedlings', 'Schädlings'],
  ['schaedlings', 'schädlings'],
  ['Bekaempfung', 'Bekämpfung'],

  ['Frueh', 'Früh'],
  ['frueh', 'früh'],
  ['Fruehling', 'Frühling'],
  ['Fruehjahr', 'Frühjahr'],
  ['Spaet', 'Spät'],
  ['spaet', 'spät'],

  ['Wuerz', 'Würz'],
  ['wuerz', 'würz'],
  ['Wuerze', 'Würze'],
  ['wuerze', 'würze'],
  ['gewuerz', 'gewürz'],
  ['Gewuerz', 'Gewürz'],

  ['gemuese', 'gemüse'],
  ['Gemuese', 'Gemüse'],
  ['Wurzelgemuese', 'Wurzelgemüse'],
  ['Blattgemuese', 'Blattgemüse'],
  ['Fruchtgemuese', 'Fruchtgemüse'],

  ['Hoehe', 'Höhe'],
  ['hoehe', 'höhe'],
  ['Hoehen', 'Höhen'],

  ['Stueck', 'Stück'],
  ['stueck', 'stück'],
  ['stueckchen', 'stückchen'],
  ['Stueckchen', 'Stückchen'],

  ['Rueck', 'Rück'],
  ['rueck', 'rück'],
  ['Rueckschnitt', 'Rückschnitt'],
  ['rueckschnitt', 'rückschnitt'],

  ['Saeen', 'Säen'],
  ['saeen', 'säen'],
  ['Aussaeen', 'Aussäen'],
  ['aussaeen', 'aussäen'],
  ['Sae-', 'Sä-'],
  ['saet', 'sät'],
  ['saeen', 'säen'],
  ['saeule', 'säule'],

  ['Gluehen', 'Glühen'],
  ['gluehen', 'glühen'],

  ['Wurzelteilung', 'Wurzelteilung'],

  ['Schluess', 'Schlüss'],
  ['schluess', 'schlüss'],

  ['Buehne', 'Bühne'],
  ['Buerger', 'Bürger'],
  ['kuens', 'küns'],
  ['Kuens', 'Küns'],
  ['Kuenst', 'Künst'],

  ['Brueh', 'Brüh'],
  ['brueh', 'brüh'],
  ['Bruehe', 'Brühe'],
  ['bruehe', 'brühe'],
  ['Bruehen', 'Brühen'],
  ['bruehen', 'brühen'],

  ['Naehe', 'Nähe'],
  ['naehe', 'nähe'],
  ['Naeherung', 'Näherung'],

  ['gefaehr', 'gefähr'],
  ['Gefaehr', 'Gefähr'],

  ['Uebergang', 'Übergang'],
  ['uebergang', 'übergang'],
  ['Uebersicht', 'Übersicht'],
  ['uebersicht', 'übersicht'],
  ['Ueber', 'Über'],
  ['ueber', 'über'],
  ['uebernimmt', 'übernimmt'],
  ['Ueberraschung', 'Überraschung'],

  ['Pruef', 'Prüf'],
  ['pruef', 'prüf'],

  ['Tueren', 'Türen'],
  ['Tuer', 'Tür'],
  ['tuer', 'tür'],

  ['Verstaerk', 'Verstärk'],
  ['verstaerk', 'verstärk'],

  ['Geruest', 'Gerüst'],
  ['geruest', 'gerüst'],
  ['Geruechte', 'Gerüchte'],

  ['raeum', 'räum'],
  ['Raeum', 'Räum'],
  ['Aufraeumen', 'Aufräumen'],
  ['aufraeumen', 'aufräumen'],

  ['Stadtgaert', 'Stadtgärt'],
  ['Gemeinschaftsgaert', 'Gemeinschaftsgärt'],
  ['Schulgaert', 'Schulgärt'],

  ['Gaertner', 'Gärtner'],
  ['gaertner', 'gärtner'],
  ['Gaerten', 'Gärten'],
  ['gaertnern', 'gärtnern'],
  ['Gaertnern', 'Gärtnern'],

  ['kraeftig', 'kräftig'],
  ['Kraeft', 'Kräft'],

  ['Haende', 'Hände'],
  ['haende', 'hände'],

  ['Bluetenkohl', 'Blütenkohl'],

  ['Blutlaeus', 'Blutläus'],
  ['Blattlaeus', 'Blattläus'],
  ['Blattlaus-Loewen', 'Blattlaus-Löwen'],
  ['Blattlaus-Loewe', 'Blattlaus-Löwe'],
  ['Laeuse', 'Läuse'],

  ['Maeuse', 'Mäuse'],
  ['maeuse', 'mäuse'],
  ['Schmaeu', 'Schmäu'],

  ['Aengstli', 'Ängstli'],
  ['aengstli', 'ängstli'],

  ['Kaeufer', 'Käufer'],
  ['kaeufer', 'käufer'],

  ['Wuerm', 'Würm'],
  ['wuerm', 'würm'],
  ['Wurmkur', 'Wurmkur'],

  ['Boeden', 'Böden'],
  ['boeden', 'böden'],

  ['Hoechst', 'Höchst'],
  ['hoechst', 'höchst'],
  ['Hoechststand', 'Höchststand'],

  ['Laengst', 'Längst'],
  ['laengst', 'längst'],
  ['laengster', 'längster'],
  ['Laengster', 'Längster'],

  ['gross', 'groß'],
  ['Gross', 'Groß'],
  ['groesst', 'größt'],
  ['Groesst', 'Größt'],

  ['weiss', 'weiß'],  // VORSICHT: "Weiss" könnte Name sein - aber "weiss" als Adjektiv "weiß"
  ['heiss', 'heiß'],
  ['fliess', 'fließ'],
  ['Fliess', 'Fließ'],
  ['Strass', 'Straß'],
  ['strass', 'straß'],

  ['ausgiess', 'ausgieß'],
  ['Giess', 'Gieß'],
  ['giess', 'gieß'],

  ['draussen', 'draußen'],
  ['Draussen', 'Draußen'],

  ['suesse', 'süße'],
  ['Suesse', 'Süße'],
  ['suess', 'süß'],

  ['Strauchschnitt', 'Strauchschnitt'],

  ['waess', 'wäss'],
  ['Waess', 'Wäss'],

  ['Schaef', 'Schäf'],
  ['Schaer', 'Schär'],

  ['Aetheri', 'Ätheri'],
  ['aetheri', 'ätheri'],
  ['Aetherisch', 'Ätherisch'],

  ['Naehrl', 'Nährl'],
  ['naehrl', 'nährl'],

  ['Foerd', 'Förd'],
  ['foerd', 'förd'],
  ['Foerder', 'Förder'],
  ['foerder', 'förder'],
  ['gefoerd', 'geförd'],

  ['Koerb', 'Körb'],
  ['Koerper', 'Körper'],
  ['koerper', 'körper'],

  ['hoeher', 'höher'],
  ['Hoeher', 'Höher'],

  ['Tropfen', 'Tropfen'],

  ['Erdaehnli', 'Erdähnli'],

  ['Knoetch', 'Knötch'],

  ['Schaufeln', 'Schaufeln'],

  ['voellig', 'völlig'],
  ['Voellig', 'Völlig'],

  ['Erdoel', 'Erdöl'],

  ['Hueg', 'Hüg'],
  ['hueg', 'hüg'],
  ['Huegel', 'Hügel'],
  ['huegel', 'hügel'],
  ['Hugelbett', 'Hügelbett'],

  ['Aussaeger', 'Aussäer'],

  ['anfaelli', 'anfälli'],
  ['Anfaelli', 'Anfälli'],
  ['Anfaelligkeit', 'Anfälligkeit'],

  ['traeg', 'träg'],
  ['Traeg', 'Träg'],
  ['traegt', 'trägt'],
  ['Traegt', 'Trägt'],

  ['Faehrt', 'Fährt'],
  ['faehrt', 'fährt'],

  ['Faehigkeit', 'Fähigkeit'],
  ['faehigkeit', 'fähigkeit'],

  ['Sterneanzeige', 'Sterneanzeige'],

  ['saetz', 'sätz'],
  ['Saetz', 'Sätz'],

  ['Aergerlich', 'Ärgerlich'],
  ['aergerlich', 'ärgerlich'],

  ['Aerm', 'Ärm'],
  ['aerm', 'ärm'],

  ['plaetz', 'plätz'],
  ['Plaetz', 'Plätz'],

  ['Aufzugschlauch', 'Aufzugschlauch'],

  ['Klaerung', 'Klärung'],
  ['klaerung', 'klärung'],

  ['Tueren', 'Türen'],

  ['Knoell', 'Knöll'],
  ['knoell', 'knöll'],

  ['Maennch', 'Männch'],
  ['maennch', 'männch'],
  ['maennlich', 'männlich'],
  ['Maennlich', 'Männlich'],

  ['Weibch', 'Weibch'],

  ['Schoenh', 'Schönh'],

  ['Schoepfer', 'Schöpfer'],

  ['Verkraepe', 'Verkröpe'],

  ['Aest', 'Äst'],
  ['aest', 'äst'],
  ['aestelung', 'ästelung'],

  ['Schlie', 'Schli'],

  ['raeumen', 'räumen'],
  ['Raeumen', 'Räumen'],

  ['einraeum', 'einräum'],

  ['baeumchen', 'bäumchen'],
  ['Baeumchen', 'Bäumchen'],

  ['Baumf', 'Baumf'],

  ['baeum', 'bäum'],
  ['Baeum', 'Bäum'],
  ['Obstbaeum', 'Obstbäum'],
  ['Apfelbaeum', 'Apfelbäum'],
  ['Birnenbaeum', 'Birnenbäum'],

  ['Aussage', 'Aussage'],
  ['Aufstreuung', 'Aufstreuung'],
  ['Aussehen', 'Aussehen'],

  ['Saeftepfl', 'Säftepfl'],
  ['saeftep', 'säftep'],

  ['suedl', 'südl'],
  ['Suedl', 'Südl'],
  ['Suedost', 'Südost'],
  ['Suedwest', 'Südwest'],
  ['Sueden', 'Süden'],
  ['sueden', 'süden'],

  ['noerdl', 'nördl'],
  ['Noerdl', 'Nördl'],
  ['Norden', 'Norden'],

  ['oestl', 'östl'],
  ['Oestl', 'Östl'],

  ['westl', 'westl'],

  ['Ueberblick', 'Überblick'],

  ['Stoer', 'Stör'],
  ['stoer', 'stör'],

  ['Vermoeg', 'Vermög'],
  ['vermoeg', 'vermög'],

  ['Boese', 'Böse'],
  ['boese', 'böse'],

  ['Frauenmaen', 'Frauenmän'],

  ['fuer', 'für'],
  ['Fuer', 'Für'],

  ['Buechs', 'Büchs'],

  ['Stoes', 'Stöß'],

  ['Erloes', 'Erlös'],

  ['Spruessling', 'Sprössling'],
  ['Sproessling', 'Sprössling'],
  ['Sproesslinge', 'Sprösslinge'],

  ['gluehlampe', 'glühlampe'],

  ['Schauflaeche', 'Schaufläche'],

  ['Naehkurs', 'Nähkurs'],

  ['ungemuetlich', 'ungemütlich'],
  ['gemuetlich', 'gemütlich'],
  ['Gemuet', 'Gemüt'],

  ['Buecher', 'Bücher'],
  ['buecher', 'bücher'],

  ['Stueh', 'Stüh'],

  ['Muelleimer', 'Mülleimer'],

  ['suchen', 'suchen'],

  ['fliesst', 'fließt'],

  ['Truebe', 'Trübe'],
  ['truebe', 'trübe'],

  ['Schnueffl', 'Schnüffl'],

  ['Suess', 'Süß'],
  ['suess', 'süß'],

  ['Suendoel', 'Süßöl'],

  ['Aufsatzkraen', 'Aufsatzkrän'],

  ['Lichtkeimer', 'Lichtkeimer'],

  ['hinaeb', 'hinäb'],

  ['Boecke', 'Böcke'],

  ['Erdkraek', 'Erdkrök'],

  ['Tueftler', 'Tüftler'],
  ['tueftl', 'tüftl'],

  ['Kuechenchef', 'Küchenchef'],
  ['kuechenchef', 'küchenchef'],

  ['Kueche', 'Küche'],
  ['kueche', 'küche'],

  ['ueppig', 'üppig'],
  ['Ueppig', 'Üppig'],

  ['Saeur', 'Säur'],
  ['saeur', 'säur'],

  ['Suedet', 'Südet'],

  ['Marmel', 'Marmel'],

  ['Aufzucht', 'Aufzucht'],

  ['Buntblatt', 'Buntblatt'],

  ['Sproesseling', 'Sprössling'],

  ['Hueft', 'Hüft'],

  ['Saemling', 'Sämling'],
  ['saemling', 'sämling'],
  ['Saemlinge', 'Sämlinge'],

  ['Saett', 'Sätt'],

  ['Ausserdem', 'Außerdem'],
  ['ausserdem', 'außerdem'],
  ['ausser', 'außer'],
  ['Ausser', 'Außer'],

  ['vorzueglich', 'vorzüglich'],
  ['Vorzueglich', 'Vorzüglich'],

  ['ureigentuemlich', 'ureigentümlich'],
  ['Eigentuemer', 'Eigentümer'],
  ['eigentuemer', 'eigentümer'],

  ['Garantiezuschlaege', 'Garantiezuschläge'],

  ['Loesch', 'Lösch'],
  ['loesch', 'lösch'],

  ['Bezahlglas', 'Bezahlglas'],

  ['Werkzeug', 'Werkzeug'],

  ['vermoechte', 'vermöchte'],

  ['Gehoeren', 'Gehören'],
  ['gehoeren', 'gehören'],

  ['Lieblingsblueten', 'Lieblingsblüten'],

  ['Maehd', 'Mähd'],
  ['Maeh-', 'Mäh-'],

  ['Kuehl', 'Kühl'],
  ['kuehl', 'kühl'],
  ['kuehlt', 'kühlt'],

  ['Auslaeufer', 'Ausläufer'],
  ['auslaeufer', 'ausläufer'],

  ['Pforte', 'Pforte'],

  ['Sproessli', 'Sprössli'],

  ['Hueft', 'Hüft'],

  ['Stoerung', 'Störung'],

  ['Sproessling', 'Sprössling'],

  ['vollstaendig', 'vollständig'],
  ['Vollstaendig', 'Vollständig'],

  ['anhalt', 'anhalt'],

  ['Suessgraeser', 'Süßgräser'],
  ['suessgraeser', 'süßgräser'],

  ['Lippenbluetler', 'Lippenblütler'],

  ['Doldenbluetler', 'Doldenblütler'],
  ['doldenbluetler', 'doldenblütler'],

  ['Kreuzbluetler', 'Kreuzblütler'],
  ['Korbbluetler', 'Korbblütler'],
  ['Schmetterlingsbluetler', 'Schmetterlingsblütler'],

  ['Kapuzinerkressengewaechse', 'Kapuzinerkressengewächse'],
  ['gewaechse', 'gewächse'],
  ['Gewaechse', 'Gewächse'],

  ['Lauchgewaechse', 'Lauchgewächse'],

  ['Wegerichgewaechse', 'Wegerichgewächse'],

  ['einjaehrig', 'einjährig'],
  ['zweijaehrig', 'zweijährig'],
  ['mehrjaehrig', 'mehrjährig'],

  ['Bluetler', 'Blütler'],

  ['Sortenraet', 'Sortenrät'],

  ['suedosteurop', 'südosteurop'],
  ['Suedosteurop', 'Südosteurop'],
  ['Westasien/Suedosteurop', 'Westasien/Südosteurop'],

  ['vor- und Hochalpen', 'Vor- und Hochalpen'],

  ['ausschliessli', 'ausschließli'],
  ['Ausschliessli', 'Ausschließli'],

  ['gemaess', 'gemäß'],
  ['Gemaess', 'Gemäß'],

  ['regelmaessig', 'regelmäßig'],
  ['Regelmaessig', 'Regelmäßig'],
  ['unregelmaessig', 'unregelmäßig'],

  ['groessten', 'größten'],
  ['Groessten', 'Größten'],
  ['groesseren', 'größeren'],
  ['Groesseren', 'Größeren'],
  ['groesser', 'größer'],
  ['Groesser', 'Größer'],

  ['masslos', 'maßlos'],
  ['Massnahme', 'Maßnahme'],
  ['massnahm', 'maßnahm'],

  ['Mass', 'Maß'],
  ['mass', 'maß'],
  ['Massstab', 'Maßstab'],

  ['Strauesse', 'Sträuße'],
  ['Strauesschen', 'Sträußchen'],
  ['Strauss', 'Strauß'],
  ['Straeucher', 'Sträucher'],
  ['straeucher', 'sträucher'],

  ['Buesche', 'Büsche'],
  ['buesche', 'büsche'],

  ['Anstoss', 'Anstoß'],
  ['anstoss', 'anstoß'],

  ['ueppig', 'üppig'],

  ['nuetz', 'nütz'],
  ['Nuetz', 'Nütz'],
  ['nuetzli', 'nützli'],
  ['Nuetzli', 'Nützli'],

  ['fluechtig', 'flüchtig'],
  ['Fluechtig', 'Flüchtig'],

  ['lueft', 'lüft'],
  ['Lueft', 'Lüft'],
  ['belueft', 'belüft'],

  ['Aend', 'Änd'],
  ['aend', 'änd'],

  ['Faeule', 'Fäule'],
  ['faeule', 'fäule'],

  ['Beuteln', 'Beuteln'],

  ['Faechig', 'Fächig'],

  ['Schaeden', 'Schäden'],
  ['schaeden', 'schäden'],
  ['Schaedling', 'Schädling'],

  ['Faden', 'Faden'],

  ['Daempf', 'Dämpf'],
  ['daempf', 'dämpf'],

  ['Faecher', 'Fächer'],
  ['Faechig', 'Fächig'],

  ['Foederat', 'Föderat'],

  ['anbaeumen', 'anbäumen'],

  ['Wasserloeslich', 'Wasserlöslich'],

  ['Toepfe', 'Töpfe'],
  ['toepfe', 'töpfe'],
  ['Toepfen', 'Töpfen'],
  ['toepfen', 'töpfen'],

  ['Loecher', 'Löcher'],
  ['Loch', 'Loch'],

  ['Roehr', 'Röhr'],
  ['roehr', 'röhr'],

  ['Roesti', 'Rösti'],

  ['stoer', 'stör'],

  ['Aussprache', 'Aussprache'],

  ['Auslaeufer', 'Ausläufer'],
  ['Auslaeufern', 'Ausläufern'],

  ['Naehrboden', 'Nährboden'],

  ['Naheres', 'Näheres'],

  ['Maehe', 'Mähe'],

  ['Auslaut', 'Auslaut'],

  ['Schneckenzaeune', 'Schneckenzäune'],
  ['Hochbeetraender', 'Hochbeeträender'],

  ['Aussaat', 'Aussaat'],

  ['Maerz', 'März'],
  ['maerz', 'märz'],

  ['Maetressig', 'Mätressig'],

  ['Faerbung', 'Färbung'],
  ['faerbung', 'färbung'],

  ['anaeb', 'anäb'],

  ['Beraet', 'Berät'],

  ['Hauen', 'Hauen'],

  ['Aufaehnig', 'Aufähnlich'],

  ['Suedfrucht', 'Südfrucht'],

  ['Aerosole', 'Aerosole'],

  ['Sproetzling', 'Sprössling'],

  ['suedwaerts', 'südwärts'],
  ['Suedwaerts', 'Südwärts'],

  ['vorwaerts', 'vorwärts'],
  ['Vorwaerts', 'Vorwärts'],

  ['rueckwaerts', 'rückwärts'],
  ['Rueckwaerts', 'Rückwärts'],

  ['blaehung', 'blähung'],
  ['Blaehung', 'Blähung'],

  ['Erweiterung', 'Erweiterung'],

  ['naehern', 'nähern'],
  ['Naehern', 'Nähern'],

  ['Nageltaeufling', 'Nageltäufling'],

  ['Loehne', 'Löhne'],
  ['loehne', 'löhne'],

  ['Loesch', 'Lösch'],

  ['Buehne', 'Bühne'],

  ['Spruchblueh', 'Spruchblüh'],

  ['Maeuse', 'Mäuse'],

  ['Saettigung', 'Sättigung'],

  ['Naehrboden', 'Nährboden'],
];

// Strings, die NICHT mit dem Mapping bearbeitet werden — Discriminator-Strings, IDs
const SKIP_FIELDS = new Set([
  'id', 'kategorie', 'thunTyp', 'familie', 'keimerTyp',
  'aussaatMondphase', 'ernteMondphase', 'mondrichtungAussaat',
  'aussaatMethode', 'ernteTagestyp', 'lebenszyklus', 'frosthaerte',
  'naehrstoffbedarf', 'wasserbedarf', 'licht', 'anfaelligkeit',
  'sortenempfehlung', 'mehrfachernte', 'art',
  'vorzuchtVon', 'vorzuchtBis', 'auspflanzenVon', 'auspflanzenBis',
  'ernteVon', 'ernteBis', 'keimtempC', 'keimdauerTage',
  'gruppe', 'tagestyp', 'wirkung-key', 'jahreszeit',
]);

// Felder, die String-Arrays mit IDs enthalten (z.B. "schaedlinge": ["blattlaus"])
const ID_ARRAY_FIELDS = new Set([
  'schaedlinge', 'krankheiten', 'staerkungJauche', 'schutzbegleiter',
  'bodenart', 'bezuege', 'gut', 'schlecht',
]);

function ersetzeMitMapping(text) {
  // Nur den lesbaren Teil von Markdown-Links ersetzen, nicht den ID-Teil.
  // Format: [Lesbar](pflanze:id) → nur "Lesbar" verändern.
  // Wir splitten den Text in MD-Link-Teile und normalen Text, behandeln getrennt.
  let result = '';
  let pos = 0;
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    // Normalen Text vor dem Link verarbeiten
    result += ersetzeWoerter(text.substring(pos, match.index));
    // Lesbarer Teil ersetzen, ID-Teil unverändert
    result += '[' + ersetzeWoerter(match[1]) + '](' + match[2] + ')';
    pos = match.index + match[0].length;
  }
  result += ersetzeWoerter(text.substring(pos));
  return result;
}

function ersetzeWoerter(text) {
  let result = text;
  for (const [alt, neu] of MAPPING) {
    // Whole-word replace via lookahead/lookbehind word boundaries
    const re = new RegExp('(?<![a-zA-ZäöüÄÖÜß])' + alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![a-zA-ZäöüÄÖÜß])', 'g');
    result = result.replace(re, neu);
  }
  return result;
}

function verarbeiteWert(wert, feldname) {
  if (typeof wert === 'string') {
    if (SKIP_FIELDS.has(feldname)) return wert;
    if (feldname === 'name' || feldname === 'titel' || feldname === 'kurz') {
      return ersetzeMitMapping(wert);
    }
    return ersetzeMitMapping(wert);
  }
  if (Array.isArray(wert)) {
    if (ID_ARRAY_FIELDS.has(feldname)) return wert; // IDs unverändert
    return wert.map(v => verarbeiteWert(v, feldname));
  }
  if (wert && typeof wert === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(wert)) {
      out[k] = verarbeiteWert(v, k);
    }
    return out;
  }
  return wert;
}

function verarbeiteDatei(pfad) {
  const txt = readFileSync(pfad, 'utf-8');
  const data = JSON.parse(txt);
  const neu = verarbeiteWert(data, '');
  const neuTxt = JSON.stringify(neu, null, 2);
  if (neuTxt !== txt.replace(/\r\n/g, '\n').trimEnd()) {
    writeFileSync(pfad, neuTxt + '\n');
    return true;
  }
  return false;
}

const dataDir = 'src/data';
const dateien = readdirSync(dataDir).filter(f => f.endsWith('.json'));
console.log(`Verarbeite ${dateien.length} JSON-Dateien in ${dataDir}...`);
for (const datei of dateien) {
  const pfad = join(dataDir, datei);
  const veraendert = verarbeiteDatei(pfad);
  console.log(`  ${veraendert ? '✓' : '·'} ${datei}`);
}
console.log('Fertig.');
