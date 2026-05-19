// Sektion "Was wünscht sich die Gemeinschaft hier?" am Ende einer Welt-Seite
// (und perspektivisch jeder Sektion). Wer angemeldet ist, gibt einen Wunsch
// rein — Titel, Tiefe, Beschreibung, optionale Tags. Andere sehen die Liste.
// Voting kommt mit W2.

import { useState } from 'react';
import {
  useWuenscheZuScope,
  tiefeLabel,
  tiefeBeschreibung,
  statusLabel,
  statusFarbe,
  type WunschTiefe,
  type Wunsch,
} from '../lib/wuensche';
import { useCurrentUser, useAuthState } from '@real-life-stack/toolkit';
import { useAnmeldung } from '../lib/anmeldung-context';
import { useProfilName } from '../lib/profil-name';
import { WoTEinladung } from './WoTEinladung';
import { MarkdownText } from './MarkdownText';

interface Props {
  scope: string;          // 'welt:pflanzen', 'welt:praxis', ...
  weltLabel: string;      // 'Pflanzen', 'Praxis', ...
  beispiel?: string;      // 'Topinambur', 'Mykorrhiza-Inokulation', ...
}

export function WunschBlock({ scope, weltLabel, beispiel }: Props) {
  const { wuensche, wuenscheAuf, loescheWunsch } = useWuenscheZuScope(scope);
  const { data: user } = useCurrentUser();
  const authState = useAuthState();
  const anmeldung = useAnmeldung();
  const istAngemeldet = authState.status === 'authenticated';
  const [formularOffen, setFormularOffen] = useState(false);

  async function neuerWunsch(titel: string, beschreibung: string, tiefe: WunschTiefe, tags: string[]) {
    await wuenscheAuf(titel, beschreibung, tiefe, tags);
    setFormularOffen(false);
  }

  return (
    <section className="wunsch-block">
      <header className="wunsch-block-kopf">
        <h2>Was wünscht sich die Gemeinschaft hier?</h2>
        <p className="wunsch-block-lead">
          Du vermisst etwas in {weltLabel}? Trag deinen Wunsch ein — die Spitzen ziehen
          wir regelmäßig heraus und bauen sie ein.
        </p>
      </header>

      {wuensche.length > 0 && (
        <ul className="wunsch-liste">
          {wuensche.map(w => (
            <WunschEintrag
              key={w.id}
              wunsch={w}
              istAutor={user?.id === w.autorProfilId}
              onLoeschen={() => loescheWunsch(w.id)}
            />
          ))}
        </ul>
      )}

      {!formularOffen ? (
        <button
          type="button"
          className="wunsch-neu-knopf"
          onClick={() => setFormularOffen(true)}
        >
          {wuensche.length === 0 ? `Den ersten Wunsch für ${weltLabel} eintragen` : 'Eigenen Wunsch dazu'}
        </button>
      ) : istAngemeldet ? (
        <WunschFormular
          weltLabel={weltLabel}
          beispiel={beispiel}
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
  );
}

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
    <li className="wunsch-eintrag">
      <header className="wunsch-kopf">
        <div className="wunsch-titel-zeile">
          <h3 className="wunsch-titel">{wunsch.titel}</h3>
          <span
            className="wunsch-status"
            style={{ borderColor: statusFarbe(wunsch.status), color: statusFarbe(wunsch.status) }}
            title={`Status: ${statusLabel(wunsch.status)}`}
          >
            {statusLabel(wunsch.status)}
          </span>
        </div>
        <span className="wunsch-meta">
          <span className="wunsch-autor">{autorName}</span>
          <span className="wunsch-trenner">·</span>
          <span className="wunsch-datum">{datumStr}</span>
          <span className="wunsch-trenner">·</span>
          <span className="wunsch-tiefe" title={tiefeBeschreibung(wunsch.tiefe)}>
            Tiefe: {tiefeLabel(wunsch.tiefe)}
          </span>
          {istAutor && (
            <button
              type="button"
              className="wunsch-loesch"
              onClick={onLoeschen}
              title="Wunsch löschen"
              aria-label="Wunsch löschen"
            >×</button>
          )}
        </span>
      </header>

      {wunsch.beschreibung && (
        <div className="wunsch-beschreibung">
          <MarkdownText text={wunsch.beschreibung} />
        </div>
      )}

      {wunsch.tags.length > 0 && (
        <div className="wunsch-tags">
          {wunsch.tags.map(t => (
            <span key={t} className="wunsch-tag">#{t}</span>
          ))}
        </div>
      )}

      {wunsch.status === 'eingebaut' && wunsch.eingebautLink && (
        <a
          href={wunsch.eingebautLink}
          className="wunsch-eingebaut-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          → Eingebaut, hier anschauen
        </a>
      )}
    </li>
  );
}

interface WunschFormularProps {
  weltLabel: string;
  beispiel?: string;
  onAbbrechen: () => void;
  onAbsenden: (titel: string, beschreibung: string, tiefe: WunschTiefe, tags: string[]) => void;
}

function WunschFormular({ weltLabel, beispiel, onAbbrechen, onAbsenden }: WunschFormularProps) {
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
        Sag uns, was du in <strong>{weltLabel}</strong> gerne hinzufügen würdest{beispiel ? ` — z.B. ${beispiel}` : ''}.
        Je klarer deine Beschreibung, desto schneller können wir es einbauen.
      </p>

      <label className="wunsch-feld">
        <span className="wunsch-feld-label">Titel des Wunsches</span>
        <input
          type="text"
          value={titel}
          onChange={e => setTitel(e.target.value)}
          placeholder={beispiel ? `z.B. "${beispiel} aufnehmen"` : 'Eine Zeile, klar und konkret'}
          maxLength={140}
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
            placeholder="Schreib einen Tag und drück Enter, z.B. wurzelgemuese"
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
