#!/usr/bin/env node
// Das Gartenwissen als Dokumente für den Wissensindex der Real Life Forge (Teil 117).
// Erzeugt aus src/data ein Markdown-Dokument je Wissenseintrag, Pflanze und Gartenarbeit
// unter wissen/. Jede Kopfzeile wird im Index ein Tag, jeder Link [[id|Name]] eine Kante.
//
//   node scripts/wissen.mjs            schreiben
//   node scripts/wissen.mjs --pruefen  prüfen, ob wissen/ zum Stand von src/data passt
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..")
const DATEN = join(WURZEL, "src/data")
const ZIEL = join(WURZEL, "wissen")
const SEITE = "https://mein-kosmischer-garten.de"

const json = (f) => JSON.parse(readFileSync(join(DATEN, f), "utf8"))
// Verweise der App ([Tomate](pflanze:tomate), [Mondknoten](wissen:mond:mondknoten), [Mulchen](arbeit:mulchen)) werden Wikilinks.
const links = (t) => String(t ?? "").replace(/\[([^\]]+)\]\((?:pflanze|arbeit|wissen:[a-z0-9-]+):([a-z0-9-]+)\)/g, "[[$2|$1]]")
const zeile = (t) => links(t).replace(/\s+/g, " ").trim()
const kopf = (felder) =>
  "---\n" + Object.entries(felder).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.map((x) => JSON.stringify(String(x))).join(", ")}]` : JSON.stringify(String(v))}`).join("\n") + "\n---\n"

// Die Bereiche mit Name und Beschreibung stehen in src/lib/wissen.ts; dort ist die eine Quelle.
function sektionen() {
  const ts = readFileSync(join(WURZEL, "src/lib/wissen.ts"), "utf8")
  const aus = []
  for (const m of ts.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*beschreibung:\s*'((?:[^'\\]|\\.)*)',\s*eintraege:\s*(\w+)Data/g)) {
    aus.push({ id: m[1], name: m[2], beschreibung: m[3].replace(/\\'/g, "'"), datei: `wissen_${m[4]}.json` })
  }
  return aus
}

function dokumente() {
  const docs = new Map()
  const pflanzen = json("pflanzen.json")
  const pflanzeName = new Map(pflanzen.map((p) => [p.id, p.name]))
  const sek = sektionen()
  const eintragSektion = new Map()
  for (const s of sek) if (existsSync(join(DATEN, s.datei))) for (const e of json(s.datei)) eintragSektion.set(e.id, s.id)

  for (const s of sek) {
    if (!existsSync(join(DATEN, s.datei))) continue
    const eintraege = json(s.datei)
    docs.set(`${s.id}/LIESMICH.md`, kopf({ art: "bereich", id: s.id, name: s.name, quelle: "Mein kosmischer Garten" }) +
      `\n# ${s.name}\n\n${zeile(s.beschreibung)}\n\n## Einträge\n\n` + eintraege.map((e) => `- [[${e.id}|${zeile(e.name)}]]: ${zeile(e.kurz)}`).join("\n") + "\n")
    for (const e of eintraege) {
      let t = kopf({ art: "wissen", id: e.id, name: e.name, bereich: s.name, untertitel: e.untertitel, symbol: e.symbol, element: e.meta?.element, thun: e.meta?.thunTyp, quelle: "Mein kosmischer Garten" })
      t += `\n# ${zeile(e.name)}\n\n${e.untertitel ? `*${zeile(e.untertitel)}*\n\n` : ""}${zeile(e.kurz)}\n\nBereich: [[${s.id}|${s.name}]]\n`
      for (const b of e.bloecke ?? []) t += `\n## ${zeile(b.titel)}\n\n${links(b.text).trim()}\n`
      if (e.pflanzen?.length) t += `\n## Pflanzen\n\n` + e.pflanzen.map((p) => `- [[${p}|${pflanzeName.get(p) ?? p}]]`).join("\n") + "\n"
      if (e.verwandt?.length) t += `\n## Verwandt\n\n` + e.verwandt.map((v) => `- [[${v.eintrag}|${v.eintrag.replace(/-/g, " ")}]] (${v.sektion})`).join("\n") + "\n"
      t += `\n## Weiteres\n\nIm Garten: ${SEITE}\n`
      docs.set(`${s.id}/${e.id}.md`, t)
    }
  }

  const FELDER = [["lateinisch", "Lateinisch"], ["familie", "Familie"], ["kategorie", "Kategorie"], ["thunTyp", "Pflanzentyp nach Thun"], ["vorzuchtVon", "Vorzucht ab"], ["vorzuchtBis", "Vorzucht bis"], ["auspflanzenVon", "Auspflanzen ab"], ["auspflanzenBis", "Auspflanzen bis"], ["ernteVon", "Ernte ab"], ["ernteBis", "Ernte bis"], ["saattiefeCm", "Saattiefe (cm)"], ["keimerTyp", "Keimer"], ["keimtempC", "Keimtemperatur (°C)"], ["keimdauerTage", "Keimdauer (Tage)"], ["pflanzabstandCm", "Pflanzabstand (cm)"]]
  for (const p of pflanzen) {
    let t = kopf({ art: "pflanze", id: p.id, name: p.name, latein: p.lateinisch, familie: p.familie, kategorie: p.kategorie, thun: p.thunTyp, quelle: "Mein kosmischer Garten" })
    t += `\n# ${zeile(p.name)}\n\n${p.lateinisch ? `*${zeile(p.lateinisch)}*\n\n` : ""}| Merkmal | Wert |\n|---|---|\n` + FELDER.filter(([k]) => p[k] !== undefined && p[k] !== "").map(([k, n]) => `| ${n} | ${zeile(p[k])} |`).join("\n") + "\n"
    for (const [k, n] of [["tipps", "Tipps"], ["geschichte", "Geschichte"], ["wirkung", "Wirkung"]]) if (p[k]) t += `\n## ${n}\n\n${links(p[k]).trim()}\n`
    // Listen von Kennungen (Mischkultur, Schädlinge, Begleiter) als Verweise; alle übrigen Felder des Steckbriefs als Abschnitt.
    const VERWEISE = { mischkultur: "Mischkultur", schaedlinge: "Schädlinge", krankheiten: "Krankheiten", staerkungJauche: "Stärkung und Jauchen", schutzbegleiter: "Schutzbegleiter" }
    const idName = (x) => (typeof x === "string" ? [x, pflanzeName.get(x) ?? x.replace(/-/g, " ")] : [x.id ?? x.pflanze ?? "", x.name ?? x.id ?? ""])
    for (const [k, n] of Object.entries(VERWEISE)) {
      const v = p[k]
      if (Array.isArray(v) && v.length) t += `\n## ${n}\n\n` + v.map((x) => { const [id, nm] = idName(x); return id ? `- [[${id}|${nm}]]${typeof x === "object" && x.art ? ` (${x.art})` : ""}` : `- ${zeile(JSON.stringify(x))}` }).join("\n") + "\n"
      else if (v && typeof v === "object") t += `\n## ${n}\n\n` + Object.entries(v).map(([a, l]) => {
        const liste = (Array.isArray(l) ? l : [l]).map((x) => (typeof x === "string" && /^[a-z0-9-]+$/.test(x) ? `[[${x}|${pflanzeName.get(x) ?? x.replace(/-/g, " ")}]]` : zeile(typeof x === "string" ? x : JSON.stringify(x))))
        return `- ${a}: ${liste.join(", ")}`
      }).join("\n") + "\n"
    }
    const bekannt = new Set(["id", "name", "tipps", "geschichte", "wirkung", "vorzucht", ...FELDER.map(([k]) => k), ...Object.keys(VERWEISE)])
    const rest = Object.entries(p).filter(([k, v]) => !bekannt.has(k) && v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && !v.length))
    if (rest.length) t += `\n## Steckbrief\n\n` + rest.map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.map(zeile).join(", ") : typeof v === "object" ? zeile(JSON.stringify(v)) : links(String(v)).trim()}`).join("\n") + "\n"
    const in_ = [...eintragSektion.keys()].filter((id) => sek.some((s) => existsSync(join(DATEN, s.datei)) && json(s.datei).some((e) => e.id === id && (e.pflanzen ?? []).includes(p.id))))
    if (in_.length) t += `\n## Im Wissen\n\n` + in_.map((id) => `- [[${id}]]`).join("\n") + "\n"
    t += `\n## Weiteres\n\nIm Garten: ${SEITE}\n`
    docs.set(`pflanzen/${p.id}.md`, t)
  }
  for (const a of json("gartenarbeiten.json")) {
    let t = kopf({ art: "gartenarbeit", id: a.id, name: a.name, kategorie: a.kategorie, thun: a.thunEmpfehlung, mond: a.mondPhase, quelle: "Mein kosmischer Garten" })
    t += `\n# ${zeile(a.name)}\n\nMonate ${a.vonMonat} bis ${a.bisMonat}${a.mondPhase ? `, Mond ${a.mondPhase}` : ""}${a.thunEmpfehlung ? `, ${a.thunEmpfehlung}tag` : ""}.\n`
    for (const [k, n] of [["tipps", "Tipps"], ["geschichte", "Geschichte"], ["wirkung", "Wirkung"]]) if (a[k]) t += `\n## ${n}\n\n${links(a[k]).trim()}\n`
    t += `\n## Weiteres\n\nIm Garten: ${SEITE}\n`
    docs.set(`gartenarbeiten/${a.id}.md`, t)
  }
  docs.set("LIESMICH.md", `# Gartenwissen aus Mein kosmischer Garten\n\nErzeugt von \`scripts/wissen.mjs\` aus \`src/data\`. Nicht von Hand ändern: Daten in \`src/data\` pflegen, dann \`node scripts/wissen.mjs\`.\n\n- ${[...docs.keys()].filter((k) => !k.endsWith("LIESMICH.md") && !k.startsWith("pflanzen/") && !k.startsWith("gartenarbeiten/")).length} Wissenseinträge in ${sek.length} Bereichen\n- ${pflanzen.length} Pflanzen\n- ${json("gartenarbeiten.json").length} Gartenarbeiten\n\nDer Wissensindex der Real Life Forge liest diesen Ordner als Quelle (Teil 117).\n`)
  return docs
}

const docs = dokumente()
if (process.argv.includes("--pruefen")) {
  const alt = new Map()
  const lesen = (d, rel = "") => { for (const n of readdirSync(d, { withFileTypes: true })) n.isDirectory() ? lesen(join(d, n.name), `${rel}${n.name}/`) : alt.set(`${rel}${n.name}`, readFileSync(join(d, n.name), "utf8")) }
  if (existsSync(ZIEL)) lesen(ZIEL)
  const anders = [...docs].filter(([k, v]) => alt.get(k) !== v).map(([k]) => k).concat([...alt.keys()].filter((k) => !docs.has(k)))
  if (anders.length) { console.error(`wissen/ passt nicht zu src/data (${anders.length}): ${anders.slice(0, 5).join(", ")} … node scripts/wissen.mjs`); process.exit(1) }
  console.log(`wissen/ passt: ${docs.size} Dokumente`)
} else {
  rmSync(ZIEL, { recursive: true, force: true })
  for (const [k, v] of docs) { mkdirSync(dirname(join(ZIEL, k)), { recursive: true }); writeFileSync(join(ZIEL, k), v) }
  console.log(`wissen/: ${docs.size} Dokumente`)
}
