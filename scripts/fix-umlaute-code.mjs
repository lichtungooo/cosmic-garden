// Ersetzt ae/oe/ue/ss-Schreibweisen in UI-Text-Strings in TS/TSX-Dateien.
// Vorsicht: nur in einfachen oder doppelten Anführungs-Strings, die nicht als
// Discriminator/ID/CSS-Klasse markiert sind.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAPPING = [
  ['Bluetentag', 'Blütentag'],
  ['Bluete', 'Blüte'],
  ['Blueten', 'Blüten'],
  ['Bluehende', 'Blühende'],
  ['Bluetenpflanzen', 'Blütenpflanzen'],
  ['Kraeuter', 'Kräuter'],
  ['Heilkraeuter', 'Heilkräuter'],
  ['Schaedlinge', 'Schädlinge'],
  ['Schaedling', 'Schädling'],
  ['Bekaempfung', 'Bekämpfung'],
  ['Naehrstoff', 'Nährstoff'],
  ['Naehrstoffe', 'Nährstoffe'],
  ['Naehrwert', 'Nährwert'],
  ['Naeherung', 'Näherung'],
  ['Hoehe', 'Höhe'],
  ['Stueck', 'Stück'],
  ['Pruefung', 'Prüfung'],
  ['Pruefen', 'Prüfen'],
  ['Uebergang', 'Übergang'],
  ['Tueren', 'Türen'],
  ['Frueh', 'Früh'],
  ['Fruehling', 'Frühling'],
  ['Spaet', 'Spät'],
  ['Gaertner', 'Gärtner'],
  ['Gaerten', 'Gärten'],
  ['Gaertnern', 'Gärtnern'],
  ['Stadtgaert', 'Stadtgärt'],
  ['Schulgaert', 'Schulgärt'],
  ['Gemeinschaftsgaert', 'Gemeinschaftsgärt'],
  ['Pflueck', 'Pflück'],
  ['Pfluecksalat', 'Pflücksalat'],
  ['Wuerz', 'Würz'],
  ['Wuerzkraeuter', 'Würzkräuter'],
  ['Loewe', 'Löwe'],
  ['Loewenzahn', 'Löwenzahn'],
  ['Schuetze', 'Schütze'],
  ['Bogenschuetze', 'Bogenschütze'],
  ['Kuerbis', 'Kürbis'],
  ['Suesskirsche', 'Süßkirsche'],
  ['Suesse', 'Süße'],
  ['Suessgraeser', 'Süßgräser'],
  ['Lippenbluetler', 'Lippenblütler'],
  ['Doldenbluetler', 'Doldenblütler'],
  ['Kreuzbluetler', 'Kreuzblütler'],
  ['Korbbluetler', 'Korbblütler'],
  ['Kapuzinerkressengewaechse', 'Kapuzinerkressengewächse'],
  ['Lauchgewaechse', 'Lauchgewächse'],
  ['Wegerichgewaechse', 'Wegerichgewächse'],
  ['Gewaechse', 'Gewächse'],
  ['fuer', 'für'],
  ['Fuer', 'Für'],
  ['gemuese', 'gemüse'],
  ['Gemuese', 'Gemüse'],
  ['Wurzelgemuese', 'Wurzelgemüse'],
  ['Blattgemuese', 'Blattgemüse'],
  ['Fruchtgemuese', 'Fruchtgemüse'],
  ['gluehen', 'glühen'],
  ['Gluehen', 'Glühen'],
  ['Saeen', 'Säen'],
  ['saeen', 'säen'],
  ['Aussaeen', 'Aussäen'],
  ['raeumen', 'räumen'],
  ['Raeumen', 'Räumen'],
  ['Bruehe', 'Brühe'],
  ['bruehe', 'brühe'],
  ['Bruehen', 'Brühen'],
  ['Bruehzeit', 'Brühzeit'],
  ['Aetheri', 'Ätheri'],
  ['aetheri', 'ätheri'],
  ['aetherisch', 'ätherisch'],
  ['Aetherisch', 'Ätherisch'],
  ['Maerz', 'März'],
  ['Maeu', 'Mäu'],
  ['Stoer', 'Stör'],
  ['stoer', 'stör'],
  ['Boes', 'Bös'],
  ['boes', 'bös'],
  ['Boed', 'Böd'],
  ['boed', 'böd'],
  ['Foerder', 'Förder'],
  ['foerder', 'förder'],
  ['gluehlampe', 'glühlampe'],
  ['Glueh', 'Glüh'],
  ['Loesch', 'Lösch'],
  ['loesch', 'lösch'],
  ['hoechst', 'höchst'],
  ['Hoechst', 'Höchst'],
  ['hoehe', 'höhe'],
  ['laengst', 'längst'],
  ['Laengst', 'Längst'],
  ['Saemling', 'Sämling'],
  ['Brueh', 'Brüh'],
  ['Naehrboden', 'Nährboden'],
  ['Voellig', 'Völlig'],
  ['voellig', 'völlig'],
  ['Ueber', 'Über'],
  ['ueber', 'über'],
  ['Anaehlich', 'Ähnlich'],
  ['vermoegen', 'vermögen'],
  ['Vermoegen', 'Vermögen'],
  ['Toepfe', 'Töpfe'],
  ['Loecher', 'Löcher'],
  ['Roehr', 'Röhr'],
  ['Rueck', 'Rück'],
  ['rueck', 'rück'],
  ['Rueckschnitt', 'Rückschnitt'],
  ['Stoerung', 'Störung'],
  ['Faerbung', 'Färbung'],
  ['kraeftig', 'kräftig'],
  ['Auslaeufer', 'Ausläufer'],
  ['Anfaelli', 'Anfälli'],
  ['anfaelli', 'anfälli'],
  ['traegt', 'trägt'],
  ['ueppig', 'üppig'],
  ['Saett', 'Sätt'],
  ['ueberkopf', 'überkopf'],
  ['waess', 'wäss'],
  ['Krautfaeule', 'Krautfäule'],
  ['Faeule', 'Fäule'],
  ['naehern', 'nähern'],
  ['Naehern', 'Nähern'],
  ['gefaehr', 'gefähr'],
  ['einjaehrig', 'einjährig'],
  ['zweijaehrig', 'zweijährig'],
  ['mehrjaehrig', 'mehrjährig'],
  ['hoechster', 'höchster'],
  ['blosse', 'bloße'],
  ['Blosse', 'Bloße'],
  ['gross', 'groß'],
  ['Gross', 'Groß'],
  ['groesst', 'größt'],
  ['Groesst', 'Größt'],
  ['groesser', 'größer'],
  ['Groesser', 'Größer'],
  ['weiss', 'weiß'],
  ['heiss', 'heiß'],
  ['fliess', 'fließ'],
  ['draussen', 'draußen'],
  ['suess', 'süß'],
  ['Suess', 'Süß'],
  ['masslos', 'maßlos'],
  ['Mass', 'Maß'],
  ['Massnahme', 'Maßnahme'],
  ['Massstab', 'Maßstab'],
  ['Ausserdem', 'Außerdem'],
  ['ausserdem', 'außerdem'],
  ['ausser', 'außer'],
  ['Ausser', 'Außer'],
  ['regelmaessig', 'regelmäßig'],
  ['unregelmaessig', 'unregelmäßig'],
  ['gemaess', 'gemäß'],
  ['Gemaess', 'Gemäß'],
  ['ausschliessli', 'ausschließli'],
  ['Anstoss', 'Anstoß'],
  ['Strauesse', 'Sträuße'],
];

function ersetzeWoerter(text) {
  let result = text;
  for (const [alt, neu] of MAPPING) {
    const re = new RegExp('(?<![a-zA-ZäöüÄÖÜß])' + alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![a-zA-ZäöüÄÖÜß])', 'g');
    result = result.replace(re, neu);
  }
  return result;
}

// Ersetzt nur Strings in Anführungszeichen die NICHT in als-Discriminator oder
// CSS-Klasse erkennbar sind. Filter: kein Eintrag mit allen ASCII + Bindestrich
// (z.B. CSS-Klasse oder kebab-Discriminator).
function fixCodeString(content) {
  // Regex: 'string' oder "string", aber nicht in CSS-Klassen-Kontext
  // Vereinfacht: jedes String-Literal, das mindestens ein Leerzeichen oder
  // Großbuchstaben mit ae/oe/ue/ss enthält, ist UI-Text.
  return content.replace(/(['"])((?:\\.|(?!\1)[^\\])*?)\1/g, (match, quote, inner) => {
    // Skip wenn:
    // - Inner ist CSS-Klassen-Name (kebab-case, kein Leerzeichen, mit ASCII)
    // - Inner ist URL
    // - Inner besteht nur aus kleinen ASCII-Buchstaben + Bindestrich/Punkt
    if (/^[a-z0-9_./-]+$/.test(inner)) return match;
    // Skip CSS-Klassennamen-Pattern
    if (/^[a-z][a-z0-9-]*(\s+[a-z][a-z0-9-]*)+$/.test(inner)) return match;
    // Skip iso8601, mm-dd
    if (/^\d{2,4}-\d{1,2}(-\d{1,2})?$/.test(inner)) return match;
    if (!/(?:Bluet|Kraeut|Schaedl|Naehr|Hoeh|Stueck|Pruef|Uebergan|Frueh|Spaet|Gaertne|Pflueck|Wuerz|Loewe|Schuetz|Kuerbis|Suess|Lippenbluetl|Doldenbluetl|Krautfaeule|Faeule|fuer|gemuese|Saeen|saeen|raeum|Bruehe|aetheri|Maerz|Stoer|Boes|Boed|Foerd|Loesch|hoechst|laengst|gross|weiss|heiss|fliess|draussen|suess|Mass|Ausser|regelmaessig|gemaess|ausschliessli|Strauesse|gluehen)/.test(inner)) return match;
    return quote + ersetzeWoerter(inner) + quote;
  });
}

function alleDateien(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const pfad = join(dir, name);
    const stat = statSync(pfad);
    if (stat.isDirectory() && !name.startsWith('.') && name !== 'node_modules') {
      alleDateien(pfad, out);
    } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      out.push(pfad);
    }
  }
  return out;
}

const dateien = alleDateien('src');
let veraendertCount = 0;
for (const datei of dateien) {
  const inhalt = readFileSync(datei, 'utf-8');
  const neu = fixCodeString(inhalt);
  if (neu !== inhalt) {
    writeFileSync(datei, neu);
    console.log(`  ✓ ${datei}`);
    veraendertCount++;
  }
}
console.log(`Fertig. ${veraendertCount} Dateien geändert.`);
