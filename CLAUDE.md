# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Cosmic Garden — Mein kosmischer Garten

Garten-Wissens-App mit den 5 Welten **Kosmos · Pflanzen · Praxis · Schulen · Gemeinschaft**, plus Karte, Kalender, Tagebuch und Profil.
Live unter **[mein-kosmischer-garten.de](https://mein-kosmischer-garten.de)**.

## Überblick

- Vite + React 19 + TypeScript, SPA
- **Zwei Daten-Quellen**:
  - Statische Wiki-JSONs in `src/data/` (Pflanzen, Arbeiten, Wissen)
  - **Web-of-Trust-Items** im persönlichen Doc (Tagebuch, Profil, Karten-Pins) — synchronisieren E2E-verschlüsselt über Antons Vault
- Anmeldung über 12-Wort-Mnemonic (Antons `DIDAuthScreen`) — kein Server-Konto
- Production: Docker-Image auf `ghcr.io`, Auto-Deploy via Watchtower auf Strato

## Sibling-Repo-Abhängigkeit (wichtig!)

Garten holt sich Antons Stack **direkt aus den Source-Pfaden** der parallel liegenden Repos:

```
Worspace/
├── garten/              ← dieses Repo
├── real-life-stack/     ← @real-life-stack/toolkit, data-interface, wot-connector
└── web-of-trust/        ← @web_of_trust/core, adapter-yjs (Antons Identitäts-Stack)
```

Die Vite-Aliase in `vite.config.ts` zeigen direkt in die `src/`-Verzeichnisse der Schwester-Repos.
Beide müssen lokal ausgecheckt sein, bevor `npm run dev` läuft. Im Docker-Build (siehe `Dockerfile` + `.github/workflows/deploy.yml`) werden alle drei Repos im Build-Context kombiniert; pnpm installiert die Workspaces der Sibling-Repos, garten selbst nutzt npm.

## Befehle

```bash
npm install            # Setup (einmalig)
npm run dev            # Dev-Server auf http://localhost:5180/  (strictPort)
npm run build          # Production-Build → dist/  (Vite, kein tsc — schneller)
npm run typecheck      # TypeScript-Check separat (tsc -b)
npm run preview        # Vorschau des Production-Builds
```

**Port 5180 ist fest** (`strictPort: true`). Bei Konflikt den alten Vite-Prozess beenden — IndexedDB ist origin-gebunden, ein Port-Wechsel heißt: WoT-Schlüssel + alle Daten weg.

Build ist absichtlich ohne `tsc`-Schritt, weil die aliasierten Sibling-Source-Files manchmal Upstream-Typfehler werfen. `npm run typecheck` ist der separate, ehrlichere Check für eigenen Code.

## Architektur in einem Bild

```
src/
├── data/                       # Statische Wiki-Inhalte (Pflanzen, Arbeiten, Wissen)
├── lib/
│   ├── wot.ts                  # WotConnector-Singleton (Antons Stack init)
│   ├── tagebuch.ts             # Hook useTagebuch() — items vom type "tagebuch-eintrag"
│   ├── profil.ts               # Hook useMeinProfil() — items vom type "garten-profil-extension"
│   ├── karte.ts                # Hook usePins() — items vom type "garten-pin"
│   ├── wot-suche.ts            # useWotSuche() — Hashtag-/Volltext-Suche über WoT-Items
│   ├── pflanzen.ts, wissen.ts  # Statische JSONs einlesen + Typen
│   ├── welten.ts               # 5 Welten + Mapping Sektion → Welt
│   ├── datenbank.ts            # Discriminated Union über alle Wiki-Eintragstypen
│   ├── datenbank-adapter.ts    # JSONs → einheitliches Eintrag-Schema
│   ├── datenbank-suche.ts      # MiniSearch über die statischen Einträge
│   ├── verwandt.ts             # Beziehungen + Tag-Resonanz + Backlinks
│   ├── moon.ts, himmel.ts      # Maria-Thun, Sonnen-/Mondzeiten
│   ├── maya.ts                 # Tzolkin, Haab, Long Count, Venus
│   ├── jahreskreis.ts          # Sonnwenden, Mondphasen im Jahr
│   ├── standort.ts             # Standort-Context (GPS + Stadt-Liste)
│   └── detail-navigation.ts    # Detail-Stack für Wiki-Eintrag-Navigation
├── views/
│   ├── StartView.tsx           # Landing — Hero, Heute, Werkzeuge, Welten
│   ├── KarteView.tsx           # Leaflet-Vollbild, 4 Pin-Arten, FAB, Bling-Effekt
│   ├── KalenderView.tsx        # Tag/Woche/Monat/Jahreskreis/Maya
│   ├── TagebuchView.tsx        # Liste + Filter, schreibt WoT-Items
│   ├── ProfilView.tsx          # Voll-Seite mit Abschnitten + Sichtbarkeits-Wahl
│   ├── TagView/WocheView/JahreskreisView/MayaView
│   └── WeltView.tsx            # Generischer Welt-Renderer (5 Welten)
├── components/
│   ├── EintragsSeite.tsx       # Renderer für Wiki-Eintrag (Pflanze/Arbeit/Wissen)
│   ├── DetailSeite.tsx         # Stack-Navigation für Wiki-Klicks
│   ├── ThemenMega.tsx          # Mega-Menü oben für die 5 Welten
│   ├── GlobaleSuche.tsx        # Header-Suche — statische DB + WoT-Items
│   ├── NutzerMenue.tsx         # Avatar oben rechts → Profil-Tab, plus Contact/Verify-Dialoge
│   ├── HashtagEingabe.tsx      # Klein-Tippen + Enter, Tag-Chips
│   ├── BilderUpload.tsx        # Garten-Bilder, komprimiert auf ~800 px
│   └── MarkdownText.tsx        # react-markdown + interne Links wie [Tomate](pflanze:tomate)
├── index.css                   # Tailwind v4 + Antons Toolkit-globals + styles.css
├── styles.css                  # Eigene Magazin-Styles (Hauptteil)
└── main.tsx                    # ConnectorProvider → IncomingEventsProvider → AuthGate → App
```

## Grundsatz — Alles in der Datenbank

**Was nicht in der Datenbank steht, kann nicht gefunden werden.** Damit die globale Suche trägt, muss jeder neue Inhalt — egal ob statischer Wiki-Eintrag oder live-erzeugtes WoT-Item — in eine der beiden Quellen wandern:

1. **Statische Wissens-Datenbank** (`src/data/*.json`) — Pflanzen, Arbeiten, Wissen. Wird im `datenbank-adapter.ts` zu `Eintrag`-Objekten und von `datenbank-suche.ts` mit MiniSearch indexiert.
2. **WoT-Items** im persönlichen Doc — Tagebuch, Profil-Extension, Karten-Pins, später Marktplatz-Angebote, Veranstaltungen. Laufen über `lib/wot-suche.ts:useWotSuche()` und werden in `GlobaleSuche` parallel zur statischen Suche angezeigt.

**Regel beim Anlegen eines neuen Item-Typs:**

- Ergänze `lib/wot-suche.ts` um den neuen Typ und die durchsuchbaren Felder (Titel, Text, Hashtags).
- Wenn der Item-Typ aus der Suche heraus geöffnet werden soll, ergänze die Navigation in `GlobaleSuche.waehleWot()`.
- Bei Pin-Typen außerdem: `lib/karte.ts` (PinArt, pinArtLabel/Farbe/Symbol) und `views/KarteView.tsx` (ICON_PFADE).

**Hashtags sind die Klebe-Schicht.** Begabungen, Bedürfnisse, Pin-Hashtags und alles, was später kommt (Marktplatz, Veranstaltungen) landen in dem gleichen flachen String-Array-Feld `hashtags` (lowercase, ohne `#`, ohne Leerzeichen). `lib/profil.ts:normalisiereTag()` ist die kanonische Normalisierung.

## WoT-Integration (Antons Stack)

Identitäts- und Sync-Schicht stammt 1:1 aus `@real-life-stack/wot-connector` und der Toolkit. Wir bauen das UI **nicht selbst** für:

- **Anmeldung** — `DIDAuthScreen` aus `@real-life-stack/wot-connector/components` (12 Wörter, Onboarding-Wizard, Mnemonic-Backup)
- **Profil-Dialog** + UserMenu, **ContactsDialog**, **VerificationDialog** + Incoming-Event-Dialoge (Counter-Verify, Mutual, Space-Invite) aus `@real-life-stack/toolkit`

Garten-eigenes UI nur dort, wo Garten-Logik dranhängt: die **Profil-Voll-Seite** (`ProfilView.tsx`) liest/schreibt Antons doc.profile (name/bio/avatar) plus ein eigenes `garten-profil-extension`-Item (alles andere).

**Item-Typen**, die garten in den WoT-Doc schreibt:

| `type` | Inhalt | Hook |
|---|---|---|
| `tagebuch-eintrag` | Datum, Text, Art, Pflanzen-IDs, Thun-Typ | `useTagebuch` |
| `garten-profil-extension` | Gartenkarriere, Begabungen, Bedürfnisse, Ort, Telegram, Bilder, Sichtbarkeit | `useMeinProfil` |
| `garten-pin` | Pin-Art, Lat/Lng, Titel/Text, Hashtags | `usePins`, `usePinAktionen` |

### Discriminator-Strings bleiben ASCII

Felder wie `PinArt = 'gaertner' | ...`, `Sichtbarkeit = 'oeffentlich' | ...` und `BeziehungsArt = 'praxis-fuer'` werden in WoT-Items persistiert. Wenn diese Strings auf Umlaute umgestellt würden, findet alter Code alte Daten nicht mehr. **Discriminator-Strings nie zu Umlauten umbauen.** Die UI-Labels (Return-Werte von `pinArtLabel()` etc.) tragen die Umlaute.

## Inhalts-Pflege (statische Wiki-JSONs)

Alle Wiki-Inhalte liegen als JSON in `src/data/`. Beim Hinzufügen darauf achten:

- **IDs sind global eindeutig** (kein Doppel)
- **Markdown-Querverweise** im Text: `[Mondknoten](wissen:mond:mondknoten)`, `[Tomate](pflanze:tomate)`, `[Mulchen](arbeit:mulchen)` — werden zur Laufzeit klickbar
- **Mischkultur**-Einträge bei Pflanzen referenzieren andere Pflanzen-IDs
- **Beziehungs-Typen**: `verwandt`, `begleiter`, `gegner`, `wirkt-an`, `tradition-von`, `praxis-fuer`, `gehoert-zu`, `antwort-zu`, `erwaehnt`

Jeder Eintrag durchläuft den **Adapter** (`datenbank-adapter.ts`), der ihn ins vereinheitlichte Schema umwandelt — Welt-Pfad und Tags werden automatisch gesetzt.

### Eine neue Wissens-Sektion anlegen

1. Neue Datei `src/data/wissen_<sektion>.json` mit `[]`
2. `lib/wissen.ts`: Import + SEKTIONEN-Eintrag
3. `lib/welten.ts`: `weltFuerWissenSektion(sektion)` ergänzen
4. `views/WeltView.tsx`: Labels nachpflegen
5. `components/ThemenMega.tsx`: Labels nachpflegen

### Eine neue Pflanze anlegen

In `src/data/pflanzen.json` einfügen. Bestehende Einträge als Vorlage nehmen — Schema in `lib/pflanzen.ts` (Type `Pflanze`).

**Stand des Steckbrief-Roll-outs** (19. Mai 2026):

Mit vollem 10-Block-Steckbrief befüllt (21 von 87 Pflanzen):

- **Welle 1** (1): `tomate`
- **Welle 2** (10): `kartoffel`, `moehre`, `kopfsalat`, `kuerbis`, `brennnessel`, `tagetes`, `ringelblume`, `basilikum`, `knoblauch`, `apfel`
- **Welle 3** (10): `zucchini`, `gurke`, `pflucksalat`, `spinat`, `lauch`, `zwiebel`, `erbse`, `buschbohne`, `erdbeere`, `schachtelhalm`

Restliche 66 Pflanzen haben weiterhin nur die Pflicht-Felder + Markdown-Texte aus dem Ursprungs-Stand. Leere Steckbrief-Blöcke werden im UI ausgeblendet, kein visueller Bruch. Befüll-Reihenfolge nach Wichtigkeit / Häufigkeit im Hausgarten — Vorschlag für die nächsten Wellen: Paprika, Chili, Aubergine, Stangenbohne, Rote Bete, Radieschen, Kohlrabi, Weißkohl, Grünkohl, Sellerie.

**Pflicht-Felder** (legacy, alle bisherigen Einträge haben sie):
`id, name, lateinisch, familie, kategorie, thunTyp, vorzuchtVon, vorzuchtBis, auspflanzenVon, auspflanzenBis, ernteVon, ernteBis, saattiefeCm, keimerTyp, keimtempC, keimdauerTage, pflanzabstandCm, tipps, vorzucht`

**Optionale Felder** (Steckbrief-Erweiterung — kommen in 10 thematischen Blöcken im UI an, leere Blöcke verschwinden):

| Block | Felder |
|---|---|
| **1. Wesen** | `herkunft`, `lebenszyklus` ("einjaehrig"/"zweijaehrig"/"mehrjaehrig"), `wuchsform`, `hoehe` |
| **2. Standort & Boden** | `licht` ("sonnig"/"halbschattig"/"schattig"), `bodenart[]` (z.B. ["humos","lehmig"]), `phBereich`, `naehrstoffbedarf` ("schwach"/"mittel"/"stark"), `frosthaerte` |
| **3. Kosmischer Bezug** | `aussaatMondphase` ("zunehmend"/"abnehmend"/"vollmond"/"neumond"), `ernteMondphase`, `mondrichtungAussaat` ("aufsteigend"/"absteigend"), `planetenbezug` |
| **4. Aussaat & Vorzucht** | `aussaatMethode` ("direktsaat"/"vorzucht"/"steckling"/"knolle"/"wurzelteilung"/"pfropfen"), `vorkulturDauer`, `reihenabstandCm`, `saatzeitNotiz` (Markdown) |
| **5. Pflege** | `wasserbedarf` ("gering"/"mittel"/"hoch"), `duengung`, `stuetzung`, `rueckschnitt`, `mulchen`, `spezialpflege` (alle Markdown erlaubt) |
| **6. Ernte** | `reifezeichen`, `erntemethode`, `mehrfachernte` (boolean), `ernteTagestyp` ("wurzel"/"blatt"/"bluete"/"frucht") |
| **7. Verarbeitung & Lagerung** | `trocknung`, `verarbeitung`, `lagerung`, `saatgutGewinnung` (Markdown) |
| **8. Verwendung** | `kueche`, `heilkundeKurz` (knapp, Tiefe lebt in heil-depot.de) |
| **9. Schutz & Stärkung** | `schaedlinge[]`, `krankheiten[]`, `staerkungJauche[]` — alles **IDs aus `wissen_schaedlinge`** (klickbar); `schutzbegleiter[]` (Pflanzen-IDs); `anfaelligkeit` ("robust"/"mittel"/"empfindlich"); `vermeiden` (Freitext) |
| **10. Sorten** | `sortenempfehlung` ("samenfest"/"F1"/"beides"), `alteSorten[]` (Namen), `regionenEignung` |

**Regeln beim Befüllen:**

- Alle erweiterten Felder sind **optional** — bei Zier- oder Wildpflanzen darf der ganze Kosmos-Block leer bleiben.
- IDs in `schaedlinge`, `krankheiten`, `staerkungJauche` müssen in `src/data/wissen_schaedlinge.json` existieren. Fehlt ein Eintrag → erst dort anlegen, dann hier referenzieren.
- IDs in `schutzbegleiter` müssen Pflanzen-IDs sein.
- Heilkunde nur als kleiner Anriss — die ausführliche Heilpflanzenkunde lebt im separaten Projekt heil-depot.

## Deployment-Pipeline

```
git push origin main
  ↓
GitHub Actions checkt 3 Repos aus (garten + real-life-stack + web-of-trust)
  ↓
Docker-Build (pnpm install in Sibling-Workspaces, npm build in garten)
  ↓
Push nach ghcr.io/lichtungooo/cosmic-garden:latest
  ↓
Watchtower auf Strato erkennt neues Image (≤ 30 s Polling)
  ↓
Container-Neustart, Traefik routet weiter, Let's Encrypt-TLS bleibt
  ↓
Live auf mein-kosmischer-garten.de
```

**Zeitlinie:** Push → Build (3-5 Min, durch Multi-Repo etwas länger) → ghcr.io Update → Watchtower (30-60 s) → Neustart (~10 s) → Live.

### Build lokal testen

```bash
# Aus dem Parent-Verzeichnis (Worspace/), damit Sibling-Repos im Context sind:
cd /c/Users/Timo/Worspace
docker build -t cosmic-garden-test -f garten/Dockerfile .
docker run --rm -p 8080:80 cosmic-garden-test
# → http://localhost:8080
```

### Erstmaliges Server-Setup

```bash
ssh timo@h2980589.stratoserver.net
mkdir -p ~/apps/cosmic-garden
cd ~/apps/cosmic-garden
# docker-compose.yml hochladen (gleich wie ./docker-compose.yml im Repo)
docker compose pull && docker compose up -d
docker compose logs -f web
```

Watchtower läuft schon (gemeinsamer Container für alle Apps). Container mit Label `com.centurylinklabs.watchtower.enable=true` werden auto-neugestartet.

### Nach Push debuggen

```bash
ssh timo@h2980589.stratoserver.net
cd ~/apps/cosmic-garden
docker compose pull && docker compose up -d --force-recreate
docker compose logs --tail=50 web
```

### DNS bei Strato

```
A     @     85.214.196.122
A     www   85.214.196.122
```

## Konventionen

### Sprache

- **Deutsch** in der App + Doku.
- **Identifier ohne Umlaute** (`ue/ae/oe/ss`) — TypeScript-Identifier, Funktions- und Variablen-Namen, **Discriminator-Strings die in WoT-Items leben** (`'gaertner'`, `'oeffentlich'`, `'praxis-fuer'`).
- **UI-Texte mit Umlauten** (ä/ö/ü/ß) — alles, was der User liest: JSX-Inhalt, `placeholder`, `title`, `aria-label`, Alert-Texte, Return-Werte von Label-Funktionen.
- Goethe-Schiller-klar: positive Formulierungen, kurze Sätze, klares Wort. (Sprach-Skill: `/kraftvolle-sprache`)

### Code-Stil

- Funktional + überschaubar: ein React-State, der hereinhängt — alles drumherum ist abgeleitet
- Keine überzogene Abstraktion. Lieber drei Zeilen wiederholen als eine schlechte Abstraktion
- TypeScript strict — alles getypt
- Hooks aus `@real-life-stack/toolkit` direkt nutzen (`useItems`, `useCreateItem`, `useCurrentUser`, …), keine eigene Wrapping-Schicht

### Git

- Commits in deutsch, klar, aktive Verben
- Branch `main` ist die produktive Linie
- Push auf `main` triggert Deploy — nur funktionierender Stand pushen

## Wichtige Quellen + Inspirationen

- **Maria Thun**: Aussaattage-Kalender, biodynamisch
- **Dreschflegel, Arche Noah, ProSpecieRara**: samenfeste Sorten
- **Maya-Kalender**: Tzolkin-Mathematik nach Floyd Lounsbury
- **Mein schöner Garten** (Burda): Stil-Anker für Magazin-Look — Klarheit, Weiß, lesbar
- **Bergfreunde.de**: Mega-Menü-Pattern
- **Utopia Map**: Vorbild für Karte mit Panels darüber
- **Anton Tranelis' Web of Trust**: Identitäts- und Sync-Schicht (E2E, P2P, mnemonic-basiert)
