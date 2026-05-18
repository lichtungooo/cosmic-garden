# Cosmic Garden — Mein kosmischer Garten

Garten-Wissens-App mit den 5 Welten **Kosmos · Pflanzen · Praxis · Schulen · Gemeinschaft**.
Live unter **[mein-kosmischer-garten.de](https://mein-kosmischer-garten.de)**.

## Ueberblick

- React + Vite + TypeScript, SPA ohne Backend
- Inhalt ist in JSON-Dateien gepflegt (pflanzen, gartenarbeiten, wissen_*)
- User-generierte Daten (Tagebuch, Q&A) liegen in `localStorage`
- Production: Docker-Image auf `ghcr.io`, Auto-Deploy via Watchtower auf Strato

## Architektur in einem Bild

```
src/
├── data/              # Single source of truth fuer Inhalte (JSONs)
├── lib/
│   ├── pflanzen.ts          # Pflanzen-Schema + Lader
│   ├── wissen.ts            # Wissens-Sektionen
│   ├── welten.ts            # 5 Welten + Mapping Sektion → Welt
│   ├── datenbank.ts         # Discriminated Union ueber alle Eintragstypen
│   ├── datenbank-adapter.ts # Legacy-JSONs → vereinheitlichtes Schema
│   ├── datenbank-suche.ts   # MiniSearch + Relevanz
│   ├── verwandt.ts          # Beziehungen + Tag-Resonanz + Backlinks
│   ├── moon.ts, himmel.ts   # Maria-Thun, Sonnen-/Mondzeiten
│   ├── maya.ts              # Tzolkin, Haab, Long Count, Venus
│   ├── jahreskreis.ts       # Sonnwenden, Mondphasen im Jahr
│   ├── qanda.ts             # Q&A-Storage (localStorage)
│   ├── tagebuch.ts          # Tagebuch-Storage
│   └── detail-navigation.ts # DetailStack fuer Eintrag-Navigation
├── views/
│   ├── StartView.tsx        # Landingpage (Brand-Klick)
│   ├── KalenderView.tsx     # Tag/Woche/Monat/Jahr/Maya
│   ├── TagView, WocheView, JahreskreisView, MayaView, TagebuchView, FragenView
│   └── WeltView.tsx         # generischer Welt-Renderer
├── components/
│   ├── EintragsSeite.tsx    # ein Renderer fuer Pflanze, Arbeit, Wissen
│   ├── DetailSeite.tsx      # Stack-Navigation
│   ├── ThemenMega.tsx       # Mega-Menue fuer die Welten
│   ├── MarkdownText.tsx     # react-markdown + interne Links
│   └── ...
└── styles.css         # Komplettes CSS, magazin-naher Stil
```

## Inhalts-Pflege

Alle Inhalte liegen als JSON in `src/data/`. Beim Hinzufuegen darauf achten:

- **IDs sind global eindeutig** (kein Doppel)
- **Markdown-Querverweise** im Text: `[Mondknoten](wissen:mond:mondknoten)`, `[Tomate](pflanze:tomate)`, `[Mulchen](arbeit:mulchen)` — werden zur Laufzeit klickbar
- **Mischkultur**-Eintraege bei Pflanzen referenzieren andere Pflanzen-IDs
- **Beziehungs-Typen**: `verwandt`, `begleiter`, `gegner`, `wirkt-an`, `tradition-von` ...

Jeder Eintrag durchlaeuft den **Adapter** (`datenbank-adapter.ts`), der ihn ins vereinheitlichte Schema umwandelt — Welt-Pfad und Tags werden automatisch gesetzt.

### Eine neue Wissens-Sektion anlegen

1. Neue Datei `src/data/wissen_<sektion>.json` mit `[]`
2. `lib/wissen.ts`: Import + SEKTIONEN-Eintrag
3. `lib/welten.ts`: `weltFuerWissenSektion(sektion)` ergaenzen
4. `components/NavBaum.tsx` und `views/WeltView.tsx`: Labels nachpflegen
5. `components/ThemenMega.tsx`: Labels nachpflegen

### Eine neue Pflanze anlegen

In `src/data/pflanzen.json` einfuegen. Bestehende Eintraege als Vorlage nehmen — Schema in `lib/pflanzen.ts` (Type `Pflanze`).

## Lokale Entwicklung

```bash
npm install
npm run dev      # http://localhost:5180/
```

**Port 5180 ist fest** (`strictPort: true` in `vite.config.ts`). Bei Port-Konflikt: alten Vite-Prozess beenden, nicht ausweichen — `localStorage` ist origin-gebunden, Port-Wechsel bedeutet alle User-Daten weg.

## Deployment-Pipeline

```
git push origin main
  ↓
GitHub Actions baut Docker-Image (Node-Build + nginx-Serve)
  ↓
Push nach ghcr.io/lichtungooo/cosmic-garden:latest
  ↓
Watchtower auf Strato erkennt neues Image (≤ 30 s Polling)
  ↓
Container-Neustart, Traefik routet weiter, Let's Encrypt-TLS bleibt
  ↓
Live auf mein-kosmischer-garten.de
```

**Zeitlinie:** Push → Build (2-4 Min) → ghcr.io Update → Watchtower (30-60 s) → Neustart (~10 s) → Live.

### Build lokal testen

```bash
docker build -t cosmic-garden-test .
docker run --rm -p 8080:80 cosmic-garden-test
# → http://localhost:8080
```

### Erstmaliges Server-Setup

Einmalig, um den Container auf dem Strato-Server in Betrieb zu nehmen:

```bash
ssh timo@h2980589.stratoserver.net

mkdir -p ~/apps/cosmic-garden
cd ~/apps/cosmic-garden

# docker-compose.yml hochladen (oder aus dem Repo kopieren)
# Inhalt: gleicher Stand wie ./docker-compose.yml im Repo

# Erster Start (zieht Image, registriert Traefik-Routen)
docker compose pull
docker compose up -d

# Logs pruefen
docker compose logs -f web
```

Watchtower laeuft schon auf dem Server (gemeinsamer Container fuer alle Apps). Sobald der Container das Label `com.centurylinklabs.watchtower.enable=true` traegt, wird er bei jedem neuen Image automatisch neu gestartet.

### DNS

Bei Strato in der Domain-Verwaltung fuer **mein-kosmischer-garten.de**:

```
A     @     85.214.196.122
A     www   85.214.196.122
```

(Server-IP gleich wie die anderen Apps. Traefik routet nach Host-Header.)

### Nach Push debuggen

Falls der Container nicht von alleine neu startet:

```bash
ssh timo@h2980589.stratoserver.net
cd ~/apps/cosmic-garden
docker compose pull
docker compose up -d --force-recreate
docker compose logs --tail=50 web
```

## Konventionen

### Sprache

- **Deutsch** in der App + Doku.
- **Keine Umlaute** in TypeScript-Identifiern (`ue/ae/oe/ss`), aber **mit** in Inhalts-Texten (User-sichtbar)
- Goethe-Schiller-klar: positive Formulierungen, kurze Saetze, klares Wort

### Code-Stil

- Funktional + ueberschaubar: ein React-State, der hereinhaengt — alles drumherum ist abgeleitet
- Keine ueberzogene Abstraktion. Lieber drei Zeilen wiederholen als eine schlechte Abstraktion
- TypeScript strict — alles getypt

### Git

- Commits in deutsch, klar, aktive Verben
- Branch `main` ist die produktive Linie
- Push auf `main` triggert Deploy — also nur funktionierender Stand pushen

## Wichtige Quellen + Inspirationen

- **Maria Thun**: Aussaattage-Kalender, biodynamisch
- **Dreschflegel, Arche Noah, ProSpecieRara**: samenfeste Sorten
- **Maya-Kalender**: Tzolkin-Mathematik nach Floyd Lounsbury
- **Mein schoener Garten** (Burda): Stil-Anker fuer Magazin-Look — Klarheit, Weiss, lesbar
- **Bergfreunde.de**: Mega-Menue-Pattern
