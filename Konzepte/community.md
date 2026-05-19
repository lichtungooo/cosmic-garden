# Community im kosmischen Garten

Drei Bausteine, die das Werk lebendig halten: **kontextuelle Wunschliste** (eingebettet in den Welten), **kontextuelle Q&A** (an jeder Pflanze, jedem Wissens-Eintrag, jeder Arbeit) und **Korrektur-Hinweise** (kurze Anmerkungen, die ins private Backlog wandern). Alle drei hängen am Web of Trust (Antons Stack), laufen ohne Server — synchronisieren E2E über die Identität jedes Nutzers.

## Leitgedanke

Was im statischen Wiki steht, bleibt sauber kuratiert. Was die Community trägt, wandert oben drüber als zweite Schicht — sichtbar, voting-sortiert, mit klaren Strukturen. Timo und Eli arbeiten regelmäßig die besten Wünsche und Korrekturen in die statische Datenbank ein. Kein Auto-Eintrag, keine Vollautomatik. Die Schicht bleibt menschlich geführt.

## Baustein 1 — Kontextuelle Wunschliste

### Was sie tut
Wünsche hängen direkt in der Welt, zu der sie passen. Beispiele:
- Welt **Pflanzen** → "Topinambur aufnehmen", "Quitte ergänzen"
- Welt **Praxis** → "Neue Praxis Mykorrhiza-Inokulation"
- Welt **Schulen** → "Hügelkultur tiefer behandeln"
- Welt **Gemeinschaft** → "Saatgut-Tausch-Treffen aufnehmen"
- Welt **Kosmos** → "Plejaden-Zyklus genauer"

Andere voten dafür. Die meistgewünschten erscheinen oben in der jeweiligen Welt. Timo zieht sich regelmäßig die Wünsche pro Welt raus und arbeitet die Spitzen in den Bestand ein.

### Wo der Knopf sitzt
- Auf jeder **Welt-Übersichts-Seite** (z. B. Welt Pflanzen, Welt Praxis) unten ein Block "**Was wünscht sich die Gemeinschaft hier?**" — mit Liste der bestehenden Wünsche und einem "Eigenen Wunsch dazu"-Knopf.
- Auf jeder **Sektion** (z. B. Wissen → Praxis → Pflanzenschutz) zusätzlich derselbe Block, scope-spezifisch.
- Keine zentrale Wunschliste — Wünsche entstehen wo sie hingehören und bleiben dort sichtbar.

### Pflicht-Felder im Wunsch-Formular
| Feld | Beispiel | Warum |
|------|----------|-------|
| **Titel** | "Topinambur aufnehmen" | Eine Zeile, klar, ohne Frage-Wort |
| **Tiefe** | kurz (eine Seite) · mittel (mehrere Abschnitte) · tief (eigene Sektion) | Damit der Aufwand klar ist |
| **Beschreibung** | Was genau soll abgedeckt sein? Welche Quellen? Welche Nachbarschaft? | Damit Eli direkt loslegen kann |
| **Tags** | optional, z. B. `#wurzelgemuese #anbau` | Hilft beim Sortieren |

Der **Bereich** ergibt sich aus dem Welt-/Sektion-Kontext, wo der Wunsch eingebracht wurde — kein extra Feld nötig.

### Status-Wechsel
- **offen** — neu eingebracht
- **in Arbeit** — Eli baut es gerade
- **eingebaut** — fertig, Link auf den neuen Wiki-Eintrag

## Baustein 2 — Korrektur-Hinweise

### Was sie tun
Jemand liest einen Eintrag und sieht etwas, das nicht ganz stimmt. Ein kleiner Knopf "**Hier stimmt etwas nicht**" am Ende jedes Eintrags öffnet ein knappes Formular: ein bis zwei Sätze, was nicht passt, optional eine Quelle. Der Hinweis wandert **nicht öffentlich unter den Eintrag**, sondern in eine private Korrektur-Liste, die Timo und Eli abarbeiten — nachrecherchieren, abgleichen, und bei Bestätigung den statischen Eintrag korrigieren.

### Wo der Knopf sitzt
- Am Ende jeder Pflanzen-, Wissens-, Arbeiten-Detailseite, unauffällig
- Im Stil eines kleinen Korrektur-Links, kein großer Banner

### Pflicht-Felder
| Feld | Beispiel |
|------|----------|
| **Wo genau** | "Abschnitt Pflege, Satz zur Düngung" |
| **Was stimmt nicht** | "Tomaten brauchen mehr als alle 14 Tage Jauche, zur Fruchtbildung wöchentlich" |
| **Quelle / Beleg** | optional — Buch, Website, eigene Erfahrung |

### Datenfluss
- Item-Typ `garten-korrektur` im WoT-Doc des Users (privat sichtbar bleibt der eigene, aggregiert sehen Timo und Eli alle eingehenden)
- Status: **eingegangen** → **geprüft** → **übernommen** oder **verworfen mit Begründung**
- Keine öffentliche Anzeige der Hinweise unter dem Eintrag — die statische Wahrheit bleibt sauber

## Baustein 3 — Kontextuelle Q&A

### Was sie tut
Am Ende jeder Pflanzen-, Wissens- und Arbeiten-Seite gibt es einen Block "Fragen". Hier hängen Fragen, die genau zu diesem Eintrag passen. Beispiel: bei Kopfsalat steht eine Frage *"Welche Schneckensorten gehen an Kopfsalat am liebsten?"* mit einer ersten Antwort des Fragestellers. Andere User geben weitere Antworten. Voting sortiert die beste Antwort nach oben.

### Frage stellen — Pflicht-Felder
| Feld | Beispiel |
|------|----------|
| **Titel der Frage** | "Welche Schnecken gehen an Kopfsalat?" |
| **Beobachtung** | Was hast du gesehen, was passiert in deinem Garten? |
| **Deine erste Antwort** | Was vermutest oder weißt du selbst? |
| **Region / Saison** | optional |
| **Tags** | optional |

**Wichtige Regel**: Wer eine Frage stellt, gibt sofort eine eigene Antwort dazu. Keine offenen Fragen ohne Eigen-Vorschlag — das verhindert Konsum-Posts und sorgt für gute Diskussionen.

### Anleitung zur guten Frage (im Formular sichtbar)
- Nenne die Pflanze / das Wissen / die Arbeit, um die es geht
- Beschreibe deine konkrete Beobachtung
- Sag, was du selbst schon vermutest oder ausprobiert hast
- Ein Satz pro Gedanke, kurze klare Sprache

### Voting & Sortierung
- Antworten innerhalb einer Frage: nach Anzahl der Bestätigungs-Voten
- Fragen innerhalb einer Sektion: nach Anzahl der Voten auf die Frage selbst
- Jeder User kann pro Item ein Vote abgeben

### Wie das im Wiki aussieht
Am Ende einer Pflanzen-Seite (z. B. Kopfsalat) erscheint nach **Sorten** und **Mischkultur** die Sektion **Fragen**:

```
└── Sorten
└── Mischkultur
└── Fragen (3)
     ├── Welche Schnecken gehen am liebsten an Kopfsalat?
     │    ├── Antwort von Timo (12 ✓)
     │    └── Antwort von Anton (8 ✓)
     ├── Wie lange hält sich Kopfsalat im Beet?
     └── Eigene Frage stellen +
```

## WoT-Datenmodell

Im persönlichen Doc des Users werden drei Item-Typen geschrieben:

### `garten-frage`
```ts
{
  type: 'garten-frage',
  scope: string,      // z.B. 'pflanze:kopfsalat', 'wissen:praxis:mischkultur', 'wunsch:global'
  kategorie: 'frage' | 'wunsch',
  titel: string,
  text: string,       // Markdown — Beobachtung / Beschreibung
  bereich?: string,   // für Wuensche: 'pflanze' | 'arbeit' | 'wissen:<sektion>'
  tiefe?: string,     // für Wuensche: 'kurz' | 'mittel' | 'tief'
  tags: string[],
  status: 'offen' | 'in-arbeit' | 'eingebaut',
  eingebautLink?: string,  // bei status='eingebaut'
  erstellt: number,
  autorProfilId: string,
}
```

### `garten-antwort`
```ts
{
  type: 'garten-antwort',
  frageId: string,
  text: string,        // Markdown
  erstellt: number,
  autorProfilId: string,
}
```

### `garten-vote`
```ts
{
  type: 'garten-vote',
  zielArt: 'frage' | 'antwort' | 'wunsch',
  zielId: string,
  vonProfilId: string,
}
```

### `garten-korrektur`
```ts
{
  type: 'garten-korrektur',
  scope: string,         // z.B. 'pflanze:tomate'
  abschnitt?: string,    // wo im Eintrag, freitext
  hinweis: string,       // was stimmt nicht
  quelle?: string,       // Buch, Website, Erfahrung
  status: 'eingegangen' | 'geprueft' | 'uebernommen' | 'verworfen',
  begruendung?: string,  // bei verworfen
  erstellt: number,
  autorProfilId: string,
}
```

Voten lokal pro User — nicht mehrfach. Die Aggregation zählt alle eingehenden Items mit zielId und liefert die Zahl in der UI.

## Phasen

### Fragen — F1 bis F3
- **F1** (Basis): Item-Typen + Hooks `useFragenZuScope(scope)` und `useAntworten(frageId)`. Sektion "Fragen" am Ende einer Pflanzen-Detailseite. Frage stellen + Pflicht-Erst-Antwort. Anzeige der Liste (ohne Voting).
- **F2** (Voting): Vote-Item, Sortierung der Antworten nach Stimmen, Sortierung der Fragen nach Stimmen.
- **F3** (Ausweitung): selbe Sektion an Wissens-Einträgen und Arbeiten.

### Wunschliste — W1 bis W2
- **W1** (Basis): Block "Was wünscht sich die Gemeinschaft hier?" auf jeder Welt-Seite. Wunsch-Formular mit Tiefe-Pflicht-Feld (Bereich aus Kontext). Liste sortiert nach Votes. Status-Anzeige (offen / in Arbeit / eingebaut).
- **W2** (Diskussion): geöffneter Wunsch zeigt Klärungs-Diskussion (Antworten am Wunsch). Status-Wechsel durch Timo.

### Korrektur-Hinweise — K1
- **K1**: Item-Typ `garten-korrektur` + Knopf "Hier stimmt etwas nicht" am Ende jeder Detailseite. Schmales Formular. Keine öffentliche Anzeige — wandert in private Liste, die Timo und Eli abarbeiten.

## Sprachregeln

- Goethe-Schiller-klar, positive Formulierungen.
- Frage-Formular: "Stell deine Frage" statt "Frage stellen". "Beobachtet, dass …" statt "Hab gesehen …".
- Wunsch-Formular: "Was wünschst du dir?" statt "Wunsch einreichen".
- Voting-Label: "Stimme dazu" oder "Bestätigen" — nicht "Up-Vote".
- Umlaute in allen UI-Texten. Discriminator-Strings (kategorie, tiefe, status, scope-Schlüssel) bleiben ASCII.

## Was es nicht ist

- **Kein Forum, kein Chat** — Fragen hängen am Kontext, nicht als Threads im Vakuum.
- **Kein soziales Netz** — keine Profile-Abonnements, keine Timeline.
- **Keine Reichweiten-Mechanik** — Voting sortiert nur den Inhalt, nicht das Profil.
- **Keine Vollautomatik** — Eli zieht die Wünsche, baut von Hand ein, markiert den Status.
