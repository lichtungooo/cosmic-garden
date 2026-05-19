// Kleiner Link am Ende einer Detailseite: "Hier stimmt etwas nicht?".
// Klick öffnet ein Inline-Formular. Eingegangene Hinweise bleiben privat
// und werden später in einer Admin-Ansicht von Timo und Eli abgearbeitet.

import { useState } from 'react';
import { useKorrekturenZuScope } from '../lib/korrektur';
import { useAuthState } from '@real-life-stack/toolkit';
import { useAnmeldung } from '../lib/anmeldung-context';
import { WoTEinladung } from './WoTEinladung';

interface Props {
  scope: string;
  kontextLabel: string;
}

export function KorrekturKnopf({ scope, kontextLabel }: Props) {
  const { korrekturen, sendeKorrektur } = useKorrekturenZuScope(scope);
  const authState = useAuthState();
  const anmeldung = useAnmeldung();
  const istAngemeldet = authState.status === 'authenticated';
  const [offen, setOffen] = useState(false);
  const [abschnitt, setAbschnitt] = useState('');
  const [hinweis, setHinweis] = useState('');
  const [quelle, setQuelle] = useState('');
  const [bestaetigt, setBestaetigt] = useState(false);

  const bereit = hinweis.trim().length > 5;
  const eigeneAnzahl = korrekturen.length;

  async function absenden() {
    if (!bereit) return;
    await sendeKorrektur(abschnitt, hinweis, quelle);
    setAbschnitt('');
    setHinweis('');
    setQuelle('');
    setOffen(false);
    setBestaetigt(true);
    setTimeout(() => setBestaetigt(false), 4000);
  }

  return (
    <div className="korrektur-knopf-wrap">
      {!offen && !bestaetigt && (
        <button
          type="button"
          className="korrektur-link"
          onClick={() => setOffen(true)}
        >
          ⚐ Hier stimmt etwas nicht? Sag Bescheid
          {eigeneAnzahl > 0 && (
            <span className="korrektur-eigene-zahl">· {eigeneAnzahl} eigene</span>
          )}
        </button>
      )}

      {bestaetigt && (
        <div className="korrektur-bestaetigt">
          ✓ Danke für den Hinweis — er ist eingegangen. Wir gehen ihn durch und passen den Eintrag an, wenn er stimmt.
        </div>
      )}

      {offen && !istAngemeldet && (
        <WoTEinladung
          zweck="korrektur"
          onAnmelden={() => { setOffen(false); anmeldung.oeffne(); }}
        />
      )}

      {offen && istAngemeldet && (
        <div className="korrektur-formular">
          <p className="korrektur-formular-anleitung">
            Was an <strong>{kontextLabel}</strong> ist nicht ganz richtig? Sag kurz, wo und was —
            wir gehen es durch und passen den Eintrag an, wenn dein Hinweis stimmt.
            Der Hinweis erscheint <em>nicht</em> öffentlich, sondern landet in unserer Korrektur-Liste.
          </p>

          <label className="korrektur-feld">
            <span className="korrektur-feld-label">Wo genau (optional)</span>
            <input
              type="text"
              value={abschnitt}
              onChange={e => setAbschnitt(e.target.value)}
              placeholder="z.B. Block Pflege, Satz zur Düngung"
              maxLength={120}
            />
          </label>

          <label className="korrektur-feld">
            <span className="korrektur-feld-label">Was stimmt nicht</span>
            <textarea
              value={hinweis}
              onChange={e => setHinweis(e.target.value)}
              placeholder="Beschreibe knapp, was deiner Erfahrung nach anders ist."
              rows={3}
            />
          </label>

          <label className="korrektur-feld">
            <span className="korrektur-feld-label">Quelle oder Beleg (optional)</span>
            <input
              type="text"
              value={quelle}
              onChange={e => setQuelle(e.target.value)}
              placeholder="Buch, Website, eigene Erfahrung"
              maxLength={200}
            />
          </label>

          <div className="korrektur-formular-fuss">
            <button
              type="button"
              className="korrektur-abbrechen"
              onClick={() => {
                setOffen(false);
                setAbschnitt('');
                setHinweis('');
                setQuelle('');
              }}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className="korrektur-absenden"
              onClick={absenden}
              disabled={!bereit}
            >
              Hinweis schicken
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
