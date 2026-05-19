// Standalone-Verifikation der mondTag-Berechnung gegen bekannte Daten.
// Kopiert die Berechnung 1:1 aus src/lib/moon.ts.

const DEG = Math.PI / 180;

const TIERKREIS = [
  { name: 'Widder',     symbol: '♈', thunTyp: 'frucht', startGrad:   0 },
  { name: 'Stier',      symbol: '♉', thunTyp: 'wurzel', startGrad:  27 },
  { name: 'Zwillinge',  symbol: '♊', thunTyp: 'bluete', startGrad:  75 },
  { name: 'Krebs',      symbol: '♋', thunTyp: 'blatt',  startGrad: 110 },
  { name: 'Löwe',       symbol: '♌', thunTyp: 'frucht', startGrad: 137 },
  { name: 'Jungfrau',   symbol: '♍', thunTyp: 'wurzel', startGrad: 174 },
  { name: 'Waage',      symbol: '♎', thunTyp: 'bluete', startGrad: 217 },
  { name: 'Skorpion',   symbol: '♏', thunTyp: 'blatt',  startGrad: 241 },
  { name: 'Schütze',    symbol: '♐', thunTyp: 'frucht', startGrad: 247 },
  { name: 'Steinbock',  symbol: '♑', thunTyp: 'wurzel', startGrad: 282 },
  { name: 'Wassermann', symbol: '♒', thunTyp: 'bluete', startGrad: 313 },
  { name: 'Fische',     symbol: '♓', thunTyp: 'blatt',  startGrad: 333 },
];

function zeichenFuerLaenge(laenge) {
  const l = ((laenge % 360) + 360) % 360;
  for (let i = TIERKREIS.length - 1; i >= 0; i--) {
    if (l >= TIERKREIS[i].startGrad) return TIERKREIS[i];
  }
  return TIERKREIS[0];
}

function julianDay(date) {
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60) / 24;
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

function lahiriAyanamsa(jd) {
  const T = (jd - 2451545.0) / 36525;
  return 23.85 + 1.39 * T;
}

function normalizeAngle(deg) {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

function moonTropicalLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D  = 297.8501921 + 445267.1114034 * T;
  const M  = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T;
  const lon = Lp
    + 6.289  * Math.sin(Mp * DEG)
    - 1.274  * Math.sin((Mp - 2 * D) * DEG)
    + 0.658  * Math.sin(2 * D * DEG)
    - 0.186  * Math.sin(M * DEG)
    - 0.059  * Math.sin((2 * Mp - 2 * D) * DEG)
    - 0.057  * Math.sin((Mp + M - 2 * D) * DEG)
    + 0.053  * Math.sin((Mp + 2 * D) * DEG)
    + 0.046  * Math.sin((2 * D - M) * DEG)
    + 0.041  * Math.sin((Mp - M) * DEG)
    - 0.035  * Math.sin(D * DEG)
    - 0.031  * Math.sin((Mp + M) * DEG);
  return normalizeAngle(lon);
}

function mondInfo(date) {
  const ref = new Date(date);
  ref.setUTCHours(11, 0, 0, 0);
  const jd = julianDay(ref);
  const trop = moonTropicalLongitude(jd);
  const ayan = lahiriAyanamsa(jd);
  const sid = normalizeAngle(trop - ayan);
  const zeichen = zeichenFuerLaenge(sid);
  return { jd, trop, ayan, sid, zeichen };
}

const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

console.log('Aktuelle Tierkreis-Grenzen (Goetheanum):');
for (let i = 0; i < TIERKREIS.length; i++) {
  const z = TIERKREIS[i];
  const ende = i === TIERKREIS.length - 1 ? 360 : TIERKREIS[i + 1].startGrad;
  console.log(`  ${z.name.padEnd(11)} ${String(z.startGrad).padStart(4)}° → ${String(ende).padStart(4)}° (${(ende - z.startGrad)}° breit) → ${z.thunTyp}`);
}

console.log('\nMondstand 14.-26. Mai 2026 (Mittag MESZ = 10:00 UTC):');
console.log('Tag           | trop. Länge | sid. Länge  | Ayanamsa | Sternbild   | Tagestyp');
console.log('--------------|-------------|-------------|----------|-------------|----------');
for (let d = 14; d <= 26; d++) {
  const datum = new Date(Date.UTC(2026, 4, d, 10, 0, 0));
  const m = mondInfo(datum);
  const tag = `${WT[datum.getUTCDay()]} ${datum.toISOString().slice(0, 10)}`;
  console.log(`${tag} | ${m.trop.toFixed(2).padStart(9)}°  | ${m.sid.toFixed(2).padStart(9)}°  | ${m.ayan.toFixed(3)}°  | ${m.zeichen.name.padEnd(11)} | ${m.zeichen.thunTyp}`);
}

// Bekannte Maria-Thun-Daten Mai 2026 (laut Aussaattage-Kalender):
console.log('\n=== Bekannte Maria-Thun-Mondwechsel Mai 2026 ===');
console.log('17.05. ~14:30 Mond → Stier');
console.log('19.05. ~16:00 Mond → Zwillinge (Quelle: Maria Thun Aussaattage 2026)');
console.log('21.05. ~21:30 Mond → Krebs');
console.log('24.05. ~05:00 Mond → Löwe');
