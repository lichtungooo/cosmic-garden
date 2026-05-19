// Sektion "Fragen" am Ende einer Detailseite.
// Frage stellen → öffnet Formular mit Titel, Beobachtung, Pflicht-Erst-Antwort.
// Bestehende Fragen werden mit ihren Antworten gelistet.

import { useState, useEffect, useRef } from 'react';
import { useFragenZuScope, useAntworten, type Frage } from '../lib/fragen';
import { useCurrentUser, useAuthState } from '@real-life-stack/toolkit';
import { MarkdownText } from './MarkdownText';
import { WoTEinladung } from './WoTEinladung';
import { useAnmeldung } from '../lib/anmeldung-context';
import { useProfilName } from '../lib/profil-name';

interface Props {
  scope: string;          // z.B. 'pflanze:kopfsalat'
  kontextLabel: string;   // z.B. 'Kopfsalat' — wird im Formular angezeigt
}

export function FragenBlock({ scope, kontextLabel }: Props) {
  const { fragen, stelleFrage, loescheFrage } = useFragenZuScope(scope);
  const { data: user } = useCurrentUser();
  const authState = useAuthState();
  const anmeldung = useAnmeldung();
  const istAngemeldet = authState.status === 'authenticated';
  const [formularOffen, setFormularOffen] = useState(false);

  async function neueFrageMitAntwort(titel: string, beobachtung: string, ersteAntwort: string) {
    const frage = await stelleFrage(titel, beobachtung, 'frage');
    if (!frage) return;
    // Pflicht-Erst-Antwort wird hier nicht via Hook geschrieben, weil useAntworten
    // an eine andere FrageId gebunden ist. Wir lösen das, indem die Komponente
    // FragenEintrag die Antwort schreibt.
    setOffeneAntworten(prev => ({ ...prev, [frage.id]: ersteAntwort }));
    setFormularOffen(false);
  }

  // Übergabe der Pflicht-Erst-Antwort an die FragenEintrag-Komponente,
  // die sie beim ersten Render schreibt.
  const [offeneAntworten, setOffeneAntworten] = useState<Record<string, string>>({});

  return (
    <section className="fragen-block">
      <header className="fragen-block-kopf">
        <h2>Fragen zu {kontextLabel}</h2>
        <span className="fragen-anzahl">{fragen.length}</span>
      </header>

      {fragen.length === 0 && !formularOffen && (
        <p className="fragen-leer">
          Noch keine Frage. Was beschäftigt dich an {kontextLabel}?
        </p>
      )}

      <ul className="fragen-liste">
        {fragen.map(f => (
          <FrageEintrag
            key={f.id}
            frage={f}
            istAutor={user?.id === f.autorProfilId}
            onLoeschen={() => loescheFrage(f.id)}
            ersteAntwortText={offeneAntworten[f.id]}
            onErsteAntwortGeschrieben={() => {
              setOffeneAntworten(prev => {
                const neu = { ...prev };
                delete neu[f.id];
                return neu;
              });
            }}
          />
        ))}
      </ul>

      {!formularOffen ? (
        <button
          type="button"
          className="fragen-neu-knopf"
          onClick={() => setFormularOffen(true)}
        >
          Eine Frage stellen
        </button>
      ) : istAngemeldet ? (
        <FrageStellenFormular
          kontextLabel={kontextLabel}
          onAbbrechen={() => setFormularOffen(false)}
          onAbsenden={neueFrageMitAntwort}
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

interface FrageEintragProps {
  frage: Frage;
  istAutor: boolean;
  onLoeschen: () => void;
  ersteAntwortText?: string;
  onErsteAntwortGeschrieben: () => void;
}

function FrageEintrag({ frage, istAutor, onLoeschen, ersteAntwortText, onErsteAntwortGeschrieben }: FrageEintragProps) {
  const { antworten, schreibeAntwort, loescheAntwort } = useAntworten(frage.id);
  const { data: user } = useCurrentUser();
  const authState = useAuthState();
  const anmeldung = useAnmeldung();
  const istAngemeldet = authState.status === 'authenticated';
  const autorName = useProfilName(frage.autorProfilId);
  const [antwortFormular, setAntwortFormular] = useState(false);
  const [antwortEntwurf, setAntwortEntwurf] = useState('');
  const ersteAntwortGeschrieben = useRef(false);

  // Pflicht-Erst-Antwort schreiben, sobald die Frage erstellt ist und
  // die Komponente in der Liste auftaucht.
  useEffect(() => {
    if (ersteAntwortText && !ersteAntwortGeschrieben.current) {
      ersteAntwortGeschrieben.current = true;
      schreibeAntwort(ersteAntwortText).then(() => onErsteAntwortGeschrieben());
    }
  }, [ersteAntwortText, schreibeAntwort, onErsteAntwortGeschrieben]);

  async function antwortAbsenden() {
    if (!antwortEntwurf.trim()) return;
    await schreibeAntwort(antwortEntwurf);
    setAntwortEntwurf('');
    setAntwortFormular(false);
  }

  const datumStr = new Date(frage.erstellt).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <li className="fragen-eintrag">
      <header className="frage-kopf">
        <h3 className="frage-titel">{frage.titel}</h3>
        <span className="frage-meta">
          <span className="frage-autor">{autorName}</span>
          <span className="frage-trenner">·</span>
          <span className="frage-datum">{datumStr}</span>
          {istAutor && (
            <button
              type="button"
              className="frage-loesch"
              onClick={onLoeschen}
              title="Frage löschen"
              aria-label="Frage löschen"
            >×</button>
          )}
        </span>
      </header>
      {frage.text && (
        <div className="frage-text">
          <MarkdownText text={frage.text} />
        </div>
      )}

      <div className="antworten-liste">
        {antworten.map(a => (
          <AntwortEintrag
            key={a.id}
            antwort={a}
            istAutor={user?.id === a.autorProfilId}
            onLoeschen={() => loescheAntwort(a.id)}
          />
        ))}
      </div>

      {!antwortFormular ? (
        <button
          type="button"
          className="antwort-neu-knopf"
          onClick={() => setAntwortFormular(true)}
        >
          Antworten
        </button>
      ) : !istAngemeldet ? (
        <WoTEinladung
          zweck="antwort"
          onAnmelden={() => { setAntwortFormular(false); anmeldung.oeffne(); }}
        />
      ) : (
        <div className="antwort-formular">
          <textarea
            value={antwortEntwurf}
            onChange={e => setAntwortEntwurf(e.target.value)}
            placeholder="Deine Antwort — was hast du erlebt, was vermutest du?"
            rows={4}
            autoFocus
          />
          <div className="antwort-formular-fuss">
            <button
              type="button"
              className="antwort-abbrechen"
              onClick={() => { setAntwortFormular(false); setAntwortEntwurf(''); }}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className="antwort-absenden"
              onClick={antwortAbsenden}
              disabled={!antwortEntwurf.trim()}
            >
              Antwort schicken
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

interface AntwortEintragProps {
  antwort: { id: string; text: string; erstellt: number; autorProfilId: string };
  istAutor: boolean;
  onLoeschen: () => void;
}

function AntwortEintrag({ antwort, istAutor, onLoeschen }: AntwortEintragProps) {
  const autorName = useProfilName(antwort.autorProfilId);
  const datumStr = new Date(antwort.erstellt).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'short',
  });
  return (
    <article className="antwort-eintrag">
      <div className="antwort-text">
        <MarkdownText text={antwort.text} />
      </div>
      <footer className="antwort-fuss">
        <span className="antwort-autor">{autorName}</span>
        <span className="antwort-trenner">·</span>
        <span className="antwort-datum">{datumStr}</span>
        {istAutor && (
          <button
            type="button"
            className="antwort-loesch"
            onClick={onLoeschen}
            title="Antwort löschen"
            aria-label="Antwort löschen"
          >×</button>
        )}
      </footer>
    </article>
  );
}

interface FrageStellenFormularProps {
  kontextLabel: string;
  onAbbrechen: () => void;
  onAbsenden: (titel: string, beobachtung: string, ersteAntwort: string) => void;
}

function FrageStellenFormular({ kontextLabel, onAbbrechen, onAbsenden }: FrageStellenFormularProps) {
  const [titel, setTitel] = useState('');
  const [beobachtung, setBeobachtung] = useState('');
  const [ersteAntwort, setErsteAntwort] = useState('');

  const bereit = titel.trim().length > 5 && beobachtung.trim().length > 10 && ersteAntwort.trim().length > 5;

  return (
    <div className="frage-formular">
      <p className="frage-formular-anleitung">
        Eine gute Frage zu <strong>{kontextLabel}</strong> nennt deine konkrete Beobachtung,
        deine Region oder Saison, und deine eigene Vermutung. Eine eigene Antwort gehört dazu —
        kein Konsum, sondern Gespräch.
      </p>

      <label className="frage-formular-feld">
        <span className="frage-formular-label">Titel der Frage</span>
        <input
          type="text"
          value={titel}
          onChange={e => setTitel(e.target.value)}
          placeholder={`Was ist deine Frage zu ${kontextLabel}?`}
          maxLength={120}
        />
      </label>

      <label className="frage-formular-feld">
        <span className="frage-formular-label">Beobachtung</span>
        <textarea
          value={beobachtung}
          onChange={e => setBeobachtung(e.target.value)}
          placeholder="Was hast du gesehen? Wo, wann, in welcher Situation?"
          rows={4}
        />
      </label>

      <label className="frage-formular-feld">
        <span className="frage-formular-label">Deine erste Antwort</span>
        <textarea
          value={ersteAntwort}
          onChange={e => setErsteAntwort(e.target.value)}
          placeholder="Was vermutest oder weißt du selbst? Pflicht — keine Frage ohne Eigen-Vorschlag."
          rows={4}
        />
      </label>

      <div className="frage-formular-fuss">
        <button type="button" className="frage-abbrechen" onClick={onAbbrechen}>
          Abbrechen
        </button>
        <button
          type="button"
          className="frage-absenden"
          onClick={() => onAbsenden(titel, beobachtung, ersteAntwort)}
          disabled={!bereit}
        >
          Frage stellen
        </button>
      </div>
    </div>
  );
}
