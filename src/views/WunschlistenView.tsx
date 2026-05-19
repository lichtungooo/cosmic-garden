// Eigene Seite /wunschliste/:bereich — zeigt alle Wünsche eines Bereichs,
// gruppiert nach Status (in Arbeit oben, dann offen, dann eingebaut).
// Mit Tabs für den Wechsel zwischen Welten und 'Ideen zur Seite'.
// Eintragsformular ist immer am Kopf, damit der erste Reflex ist:
// mein Wunsch dazu.

import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useWuenscheZuScope,
  stats,
  statusFarbe,
  statusLabel,
  tiefeLabel,
  tiefeBeschreibung,
  BEREICHE,
  bereichAusScope,
  type WunschBereich,
  type WunschTiefe,
  type Wunsch,
  type WunschStatus,
} from '../lib/wuensche';
import { useCurrentUser, useAuthState } from '@real-life-stack/toolkit';
import { useAnmeldung } from '../lib/anmeldung-context';
import { useProfilName } from '../lib/profil-name';
import { WoTEinladung } from '../components/WoTEinladung';
import { MarkdownText } from '../components/MarkdownText';

export function WunschlistenView() {
  const { bereich: bereichParam } = useParams<{ bereich: string }>();
  const navigate = useNavigate();

  const aktiverBereich: WunschBereich = useMemo(() => {
    const passt = BEREICHE.find(b => b.id === bereichParam);
    return passt?.id ?? 'pflanzen';
  }, [bereichParam]);

  const bereichDef = BEREICHE.find(b => b.id === aktiverBereich)!;
  const { wuensche, wuenscheAuf, loescheWunsch } = useWuenscheZuScope(bereichDef.scope);
  const { data: user } = useCurrentUser();
  const authState = useAuthState();
  const anmeldung = useAnmeldung();
  const istAngemeldet = authState.status === 'authenticated';
  const [formularOffen, setFormularOffen] = useState(false);

  const wunschStats = useMemo(() => stats(wuensche), [wuensche]);

  const gruppiert = useMemo(() => {
    return {
      inArbeit: wuensche.filter(w => w.status === 'in-arbeit'),
      offen: wuensche.filter(w => w.status === 'offen'),
      eingebaut: wuensche.filter(w => w.status === 'eingebaut'),
    };
  }, [wuensche]);

  async function neuerWunsch(titel: string, beschreibung: string, tiefe: WunschTiefe, tags: string[]) {
    await wuenscheAuf(titel, beschreibung, tiefe, tags);
    setFormularOffen(false);
  }

  return (
    <div className="wunschlisten-view">
      <header className="wunschlisten-hero">
        <span className="wunschlisten-eyebrow">Wunschliste</span>
        <h1 className="wunschlisten-titel">{bereichDef.label}</h1>
        <p className="wunschlisten-lead">
          {aktiverBereich === 'app'
            ? 'Ideen, wie wir die Seite verbessern können. Was fehlt dir? Was würde dir den Garten leichter machen?'
            : `Themen, die sich Gärtner für die Welt ${bereichDef.label} wünschen. Trag deinen Wunsch ein — die Spitzen ziehen wir regelmäßig raus und bauen sie ein.`}
        </p>
        <div className="wunschlisten-stats">
          <span className="wunschlisten-stat" style={{ borderColor: statusFarbe('offen'), color: statusFarbe('offen') }}>
            <strong>{wunschStats.offen}</strong> offen
          </span>
          <span className="wunschlisten-stat" style={{ borderColor: statusFarbe('in-arbeit'), color: statusFarbe('in-arbeit') }}>
            <strong>{wunschStats.inArbeit}</strong> in Arbeit
          </span>
          <span className="wunschlisten-stat" style={{ borderColor: statusFarbe('eingebaut'), color: statusFarbe('eingebaut') }}>
            <strong>{wunschStats.eingebaut}</strong> eingebaut
          </span>
        </div>
      </header>

      <nav className="wunschlisten-tabs">
        {BEREICHE.map(b => (
          <button
            key={b.id}
            type="button"
            className={`wunschlisten-tab ${b.id === aktiverBereich ? 'aktiv' : ''}`}
            onClick={() => navigate(`/wunschliste/${b.id}`)}
          >
            {b.label}
          </button>
        ))}
      </nav>

      <section className="wunschlisten-formular-block">
        {!formularOffen ? (
          <button
            type="button"
            className="wunschlisten-neu-knopf"
            onClick={() => setFormularOffen(true)}
          >
            Eigenen Wunsch eintragen
          </button>
        ) : istAngemeldet ? (
          <WunschFormular
            bereichLabel={bereichDef.label}
            beispiel={bereichDef.beispiel}
            onAbbrechen={() => setFormularOffen(false)}
            onAbsenden={neuerWunsch}
          />
        ) : (
          <WoTEinladung
            zweck="frage"
            onAnmelden={() => { setFormularOffen(false); anmeldung.oeffne(); }}
          />
        )}
      </section>

      {wunschStats.gesamt === 0 ? (
        <p className="wunschlisten-leer">
          Noch keine Wünsche für {bereichDef.label}. Sei der oder die Erste.
        </p>
      ) : (
        <>
          {gruppiert.inArbeit.length > 0 && (
            <WunschGruppe
              titel="In Arbeit"
              status="in-arbeit"
              wuensche={gruppiert.inArbeit}
              meineId={user?.id}
              onLoeschen={loescheWunsch}
            />
          )}
          {gruppiert.offen.length > 0 && (
            <WunschGruppe
              titel="Offene Wünsche"
              status="offen"
              wuensche={gruppiert.offen}
              meineId={user?.id}
              onLoeschen={loescheWunsch}
            />
          )}
          {gruppiert.eingebaut.length > 0 && (
            <WunschGruppe
              titel="Eingebaut"
              status="eingebaut"
              wuensche={gruppiert.eingebaut}
              meineId={user?.id}
              onLoeschen={loescheWunsch}
            />
          )}
        </>
      )}
    </div>
  );
}

// ===== WunschGruppe =====

interface WunschGruppeProps {
  titel: string;
  status: WunschStatus;
  wuensche: Wunsch[];
  meineId: string | undefined;
  onLoeschen: (id: string) => void;
}

function WunschGruppe({ titel, status, wuensche, meineId, onLoeschen }: WunschGruppeProps) {
  return (
    <section className="wunschlisten-gruppe">
      <header className="wunschlisten-gruppe-kopf" style={{ borderLeftColor: statusFarbe(status) }}>
        <h2 style={{ color: statusFarbe(status) }}>{titel}</h2>
      </header>
      <ul className="wunschlisten-liste">
        {wuensche.map(w => (
          <WunschEintrag
            key={w.id}
            wunsch={w}
            istAutor={meineId === w.autorProfilId}
            onLoeschen={() => onLoeschen(w.id)}
          />
        ))}
      </ul>
    </section>
  );
}

// ===== WunschEintrag =====

interface WunschEintragProps {
  wunsch: Wunsch;
  istAutor: boolean;
  onLoeschen: () => void;
}

function WunschEintrag({ wunsch, istAutor, onLoeschen }: WunschEintragProps) {
  const autorName = useProfilName(wunsch.autorProfilId);
  const datumStr = new Date(wunsch.erstellt).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <li className="wunschlisten-eintrag" style={{ borderLeftColor: statusFarbe(wunsch.status) }}>
      <header className="wunschlisten-eintrag-kopf">
        <h3 className="wunschlisten-eintrag-titel">{wunsch.titel}</h3>
        <span className="wunschlisten-eintrag-meta">
          <span className="wunschlisten-eintrag-autor">{autorName}</span>
          <span className="wunschlisten-trenner">·</span>
          <span>{datumStr}</span>
          <span className="wunschlisten-trenner">·</span>
          <span className="wunschlisten-eintrag-tiefe" title={tiefeBeschreibung(wunsch.tiefe)}>
            Tiefe: {tiefeLabel(wunsch.tiefe)}
          </span>
          {istAutor && (
            <button
              type="button"
              className="wunschlisten-eintrag-loesch"
              onClick={onLoeschen}
              title="Wunsch löschen"
              aria-label="Wunsch löschen"
            >×</button>
          )}
        </span>
      </header>

      {wunsch.beschreibung && (
        <div className="wunschlisten-eintrag-text">
          <MarkdownText text={wunsch.beschreibung} />
        </div>
      )}

      {wunsch.tags.length > 0 && (
        <div className="wunschlisten-eintrag-tags">
          {wunsch.tags.map(t => (
            <span key={t} className="wunschlisten-eintrag-tag">#{t}</span>
          ))}
        </div>
      )}

      {wunsch.status === 'eingebaut' && wunsch.eingebautLink && (
        <a
          href={wunsch.eingebautLink}
          className="wunschlisten-eingebaut-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          → Eingebaut, hier anschauen
        </a>
      )}
    </li>
  );
}

// ===== Eingebettetes Wunsch-Formular =====

interface WunschFormularProps {
  bereichLabel: string;
  beispiel: string;
  onAbbrechen: () => void;
  onAbsenden: (titel: string, beschreibung: string, tiefe: WunschTiefe, tags: string[]) => void;
}

function WunschFormular({ bereichLabel, beispiel, onAbbrechen, onAbsenden }: WunschFormularProps) {
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [tiefe, setTiefe] = useState<WunschTiefe>('mittel');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const bereit = titel.trim().length > 4 && beschreibung.trim().length > 10;

  function tagHinzu() {
    const sauber = tagInput.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-');
    if (!sauber || tags.includes(sauber)) {
      setTagInput('');
      return;
    }
    setTags([...tags, sauber]);
    setTagInput('');
  }

  function tagEntferne(t: string) {
    setTags(tags.filter(x => x !== t));
  }

  return (
    <div className="wunsch-formular">
      <p className="wunsch-formular-anleitung">
        Sag uns, was du in <strong>{bereichLabel}</strong> gerne hinzugefügt sehen würdest —
        z.B. {beispiel}. Je klarer deine Beschreibung, desto schneller können wir es einbauen.
      </p>

      <label className="wunsch-feld">
        <span className="wunsch-feld-label">Titel des Wunsches</span>
        <input
          type="text"
          value={titel}
          onChange={e => setTitel(e.target.value)}
          placeholder={`z.B. "${beispiel}"`}
          maxLength={140}
          autoFocus
        />
      </label>

      <label className="wunsch-feld">
        <span className="wunsch-feld-label">Tiefe</span>
        <div className="wunsch-tiefe-wahl">
          {(['kurz', 'mittel', 'tief'] as WunschTiefe[]).map(t => (
            <button
              key={t}
              type="button"
              className={`wunsch-tiefe-knopf ${tiefe === t ? 'aktiv' : ''}`}
              onClick={() => setTiefe(t)}
            >
              <span className="wunsch-tiefe-name">{tiefeLabel(t)}</span>
              <span className="wunsch-tiefe-text">{tiefeBeschreibung(t)}</span>
            </button>
          ))}
        </div>
      </label>

      <label className="wunsch-feld">
        <span className="wunsch-feld-label">Beschreibung</span>
        <textarea
          value={beschreibung}
          onChange={e => setBeschreibung(e.target.value)}
          placeholder="Was soll abgedeckt sein? Welche Quellen? Welche Nachbarschaft zu schon Vorhandenem?"
          rows={5}
        />
      </label>

      <label className="wunsch-feld">
        <span className="wunsch-feld-label">Tags (optional)</span>
        <div className="wunsch-tag-eingabe">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                tagHinzu();
              }
            }}
            placeholder="Schreib einen Tag und drück Enter"
            maxLength={40}
          />
          {tags.length > 0 && (
            <div className="wunsch-tag-chips">
              {tags.map(t => (
                <span key={t} className="wunsch-tag-chip">
                  #{t}
                  <button type="button" onClick={() => tagEntferne(t)} aria-label={`Tag ${t} entfernen`}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </label>

      <div className="wunsch-formular-fuss">
        <button type="button" className="wunsch-abbrechen" onClick={onAbbrechen}>
          Abbrechen
        </button>
        <button
          type="button"
          className="wunsch-absenden"
          onClick={() => onAbsenden(titel, beschreibung, tiefe, tags)}
          disabled={!bereit}
        >
          Wunsch eintragen
        </button>
      </div>
    </div>
  );
}

// Suppress unused-import warning
void bereichAusScope;
