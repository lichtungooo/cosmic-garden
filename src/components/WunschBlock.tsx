// Kompakter Wunsch-Teaser am Welt-Hero. Zeigt die wichtigsten Stats (offen,
// in Arbeit, eingebaut) und zwei Knöpfe: Eigenen Wunsch eintragen → öffnet
// Formular inline, oder zur vollen Wunschliste-Seite.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useWuenscheZuScope,
  stats,
  statusFarbe,
  type WunschTiefe,
  bereichAusScope,
  tiefeLabel,
  tiefeBeschreibung,
} from '../lib/wuensche';
import { useAuthState } from '@real-life-stack/toolkit';
import { useAnmeldung } from '../lib/anmeldung-context';
import { WoTEinladung } from './WoTEinladung';

interface Props {
  scope: string;
  weltLabel: string;
  beispiel?: string;
}

export function WunschBlock({ scope, weltLabel, beispiel }: Props) {
  const { wuensche, wuenscheAuf } = useWuenscheZuScope(scope);
  const authState = useAuthState();
  const anmeldung = useAnmeldung();
  const istAngemeldet = authState.status === 'authenticated';
  const navigate = useNavigate();
  const [formularOffen, setFormularOffen] = useState(false);

  const wunschStats = useMemo(() => stats(wuensche), [wuensche]);
  const bereich = bereichAusScope(scope);

  async function neuerWunsch(titel: string, beschreibung: string, tiefe: WunschTiefe, tags: string[]) {
    await wuenscheAuf(titel, beschreibung, tiefe, tags);
    setFormularOffen(false);
  }

  function zurListe() {
    if (bereich) navigate(`/wunschliste/${bereich.id}`);
  }

  return (
    <section className="wunsch-teaser">
      <div className="wunsch-teaser-text">
        <h2>Was wünscht sich die Gemeinschaft hier?</h2>
        <p>
          Du vermisst etwas in {weltLabel}? Trag deinen Wunsch ein — die Spitzen ziehen
          wir regelmäßig heraus und bauen sie ein.
        </p>
      </div>

      {wunschStats.gesamt > 0 && (
        <div className="wunsch-teaser-stats">
          <span
            className="wunsch-teaser-stat"
            style={{ borderColor: statusFarbe('offen'), color: statusFarbe('offen') }}
          >
            <strong>{wunschStats.offen}</strong> offen
          </span>
          {wunschStats.inArbeit > 0 && (
            <span
              className="wunsch-teaser-stat"
              style={{ borderColor: statusFarbe('in-arbeit'), color: statusFarbe('in-arbeit') }}
            >
              <strong>{wunschStats.inArbeit}</strong> in Arbeit
            </span>
          )}
          {wunschStats.eingebaut > 0 && (
            <span
              className="wunsch-teaser-stat"
              style={{ borderColor: statusFarbe('eingebaut'), color: statusFarbe('eingebaut') }}
            >
              <strong>{wunschStats.eingebaut}</strong> eingebaut
            </span>
          )}
        </div>
      )}

      <div className="wunsch-teaser-aktionen">
        {!formularOffen ? (
          <>
            <button
              type="button"
              className="wunsch-teaser-eintragen"
              onClick={() => setFormularOffen(true)}
            >
              Eigenen Wunsch eintragen
            </button>
            {wunschStats.gesamt > 0 && (
              <button
                type="button"
                className="wunsch-teaser-zur-liste"
                onClick={zurListe}
              >
                Zur Wunschliste →
              </button>
            )}
          </>
        ) : istAngemeldet ? (
          <WunschKurzFormular
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
      </div>
    </section>
  );
}

interface WunschKurzFormularProps {
  weltLabel: string;
  beispiel?: string;
  onAbbrechen: () => void;
  onAbsenden: (titel: string, beschreibung: string, tiefe: WunschTiefe, tags: string[]) => void;
}

function WunschKurzFormular({ weltLabel, beispiel, onAbbrechen, onAbsenden }: WunschKurzFormularProps) {
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
        Sag uns, was du in <strong>{weltLabel}</strong> gerne hinzugefügt sehen würdest{beispiel ? ` — z.B. ${beispiel}` : ''}.
        Je klarer deine Beschreibung, desto schneller können wir es einbauen.
      </p>

      <label className="wunsch-feld">
        <span className="wunsch-feld-label">Titel des Wunsches</span>
        <input
          type="text"
          value={titel}
          onChange={e => setTitel(e.target.value)}
          placeholder={beispiel ? `z.B. "${beispiel}"` : 'Eine Zeile, klar und konkret'}
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
