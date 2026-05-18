# Mein kosmischer Garten

Ein Wiki und Werkzeug fuer zyklisches Gaertnern — Sonne, Mond, Tierkreis, Maya-Kalender, Pflanzen, Praxis, Schulen, Gemeinschaft.

**Live:** [mein-kosmischer-garten.de](https://mein-kosmischer-garten.de)

## Was drinsteckt

- **87 Pflanzen** mit Geschichte, Wirkung, Praxis, Mythos, Mischkultur und Wissens-Bezuegen
- **22 Gartenarbeiten** mit Tradition und Anleitung
- **5 Welten:** Kosmos, Pflanzen, Praxis, Schulen, Gemeinschaft
- **Wissens-Cluster:** Tierkreis (siderisch), Mond, Sonne, Maya, Bruecken, Mulchen, Mykorrhiza, Pilze, Indoor-Anbau, Saatgut, Schaedlinge, Naturmagier (Schauberger, Hildegard u.v.m.)
- **Werkzeuge:** Tag/Woche/Monat/Jahreskreis-Kalender, Maya-Kalender (Tzolkin, Haab, Long Count, Venus), Tagebuch, Fragen & Antworten

## Stack

- **Vite + React 18 + TypeScript**
- **react-markdown** fuer Inhalts-Rendering
- **MiniSearch** fuer globale Volltextsuche
- **localStorage** fuer Tagebuch, Q&A und User-Identitaet
- **Google Fonts:** Spectral (Headlines), Inter (Body)

## Lokale Entwicklung

```bash
npm install
npm run dev      # http://localhost:5180/
npm run build    # Production-Build nach dist/
npm run preview  # Vorschau des Production-Builds
```

Der Dev-Server haengt fest an **Port 5180** (`strictPort: true` in `vite.config.ts`). Wenn der Port belegt ist, den alten Vite-Prozess beenden, nicht ausweichen — localStorage ist origin-gebunden.

## Verzeichnis-Struktur

```
garten/
├── public/                  # Statische Assets (logo.svg, etc.)
├── src/
│   ├── components/          # React-Komponenten (DetailSeite, MarkdownText, ThemenMega, ...)
│   ├── data/                # Inhalts-JSONs (pflanzen, gartenarbeiten, wissen_*)
│   ├── lib/                 # Logik (datenbank, welten, moon, maya, qanda, ...)
│   ├── views/               # Top-Level-Views (StartView, KalenderView, WeltView, FragenView, ...)
│   ├── styles.css           # Komplettes CSS
│   └── main.tsx
├── recherche/               # Recherche-Berichte (Ormus, Ciba-Geigy, Dreschflegel, Marktanalyse)
├── Dockerfile               # Production-Build (Node-Build + nginx-Serve)
├── nginx.conf               # Nginx-Config fuer SPA
├── docker-compose.yml       # Liegt auch auf dem Server in ~/apps/cosmic-garden/
├── .github/workflows/       # Auto-Build + Push nach ghcr.io
└── CLAUDE.md                # Architektur, Inhalts-Pflege, Deployment-Anleitung
```

## Deployment

Auto-Deployment per GitHub Actions + Watchtower:

```
git push main
  ↓
GitHub Actions baut Docker-Image
  ↓
Push nach ghcr.io/lichtungooo/cosmic-garden:latest
  ↓
Watchtower auf dem Server zieht das neue Image (≤ 30 s Polling)
  ↓
Container-Neustart, Traefik routet weiter
```

Volle Anleitung in [CLAUDE.md](./CLAUDE.md).

## Lizenz

MIT.
