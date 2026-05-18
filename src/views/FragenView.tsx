// Fragen & Antworten — Community-Wissen.
// Liste der Fragen, eine Frage oeffnen, Antworten lesen, voten, eigene Antwort schreiben.

import { useEffect, useMemo, useState } from 'react';
import {
  alleFragen,
  findeFrage,
  speichereFrage,
  antwortenZuFrage,
  speichereAntwort,
  toggleHerz,
  herzAnzahl,
  meinHerz,
  loescheFrage,
  loescheAntwort,
  antwortAnzahl,
  statusLabel,
  statusFarbe,
  type Frage,
  type Antwort,
} from '../lib/qanda';
import { nutzerId, nutzerName, setzeNutzerName } from '../lib/user';
import { pflanzen } from '../lib/pflanzen';
import { MarkdownText } from '../components/MarkdownText';
import { useDetailNav } from '../lib/detail-navigation';

type Modus = 'liste' | 'neu' | 'detail';

function zeitFormatieren(ts: number): string {
  const diff = Date.now() - ts;
  const tage = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (tage === 0) return 'heute';
  if (tage === 1) return 'gestern';
  if (tage < 7) return `vor ${tage} Tagen`;
  if (tage < 30) return `vor ${Math.floor(tage / 7)} Wochen`;
  const d = new Date(ts);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function FragenView() {
  const [modus, setModus] = useState<Modus>('liste');
  const [aktuelleFrageId, setAktuelleFrageId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);   // erzwingt Re-Render nach Schreib-Aktionen

  const fragen = useMemo(() => alleFragen(), [tick]);
  const aktuelleFrage = aktuelleFrageId ? findeFrage(aktuelleFrageId) : null;

  function refresh() { setTick(t => t + 1); }

  // Re-Render nach async Seeding
  useEffect(() => {
    const onSeed = () => refresh();
    window.addEventListener('qanda-seed', onSeed);
    return () => window.removeEventListener('qanda-seed', onSeed);
  }, []);

  function oeffneFrage(id: string) {
    setAktuelleFrageId(id);
    setModus('detail');
  }

  function neueFrageAnlegen(titel: string, text: string, pflanzenIds: string[]) {
    const f = speichereFrage(titel, text, pflanzenIds);
    setAktuelleFrageId(f.id);
    setModus('detail');
    refresh();
  }

  function antwortAnlegen(daten: { was: string; ergebnis: string; womit?: string; wann?: string; kontext?: string }) {
    if (!aktuelleFrageId) return;
    speichereAntwort(aktuelleFrageId, daten.was, daten.ergebnis, daten.womit, daten.wann, daten.kontext);
    refresh();
  }

  function herzGedrueckt(id: string) {
    toggleHerz(id);
    refresh();
  }

  function fragenLoeschen(id: string) {
    if (!confirm('Frage und alle Antworten dauerhaft loeschen?')) return;
    loescheFrage(id);
    setModus('liste');
    setAktuelleFrageId(null);
    refresh();
  }

  return (
    <div className="fragen-view">
      <header className="fragen-kopf">
        <div>
          <span className="fragen-eyebrow">Werkzeug</span>
          <h1 className="fragen-titel">Fragen & Antworten</h1>
          <p className="fragen-lead">
            Was tust du gegen die Schnecken? Wann saeest du Pastinake? Welcher Apfelbaum
            tregt in Hanglage? — Frage stellen, andere antworten, das Beste waechst nach oben.
          </p>
        </div>
        <NameKnopf refresh={refresh} />
      </header>

      {modus === 'liste' && (
        <>
          <div className="fragen-leiste">
            <button className="fragen-neu-btn" onClick={() => setModus('neu')}>
              + Neue Frage stellen
            </button>
            <span className="fragen-zahl">{fragen.length} Fragen insgesamt</span>
          </div>

          {fragen.length === 0 ? (
            <div className="fragen-leer">
              <p>Noch keine Frage. Stell die erste — andere im Garten wissen vielleicht eine Antwort.</p>
            </div>
          ) : (
            <ul className="fragen-liste">
              {fragen.map(f => (
                <li key={f.id}>
                  <button className="fragen-eintrag" onClick={() => oeffneFrage(f.id)}>
                    <span
                      className="fragen-status"
                      style={{ background: statusFarbe(f.status), color: 'white' }}
                    >{statusLabel(f.status)}</span>
                    <div className="fragen-eintrag-text">
                      <h3>{f.titel}</h3>
                      <p>{f.text.slice(0, 140)}{f.text.length > 140 ? '…' : ''}</p>
                    </div>
                    <div className="fragen-eintrag-meta">
                      <span>{antwortAnzahl(f.id)} Antw.</span>
                      <span>{zeitFormatieren(f.erstellt)}</span>
                      <span className="fragen-autor">{f.autorName}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {modus === 'neu' && (
        <FrageNeuForm
          onAbbrechen={() => setModus('liste')}
          onSpeichern={neueFrageAnlegen}
        />
      )}

      {modus === 'detail' && aktuelleFrage && (
        <FrageDetail
          frage={aktuelleFrage}
          onZurueck={() => { setModus('liste'); setAktuelleFrageId(null); }}
          onLoeschen={() => fragenLoeschen(aktuelleFrage.id)}
          onAntwort={antwortAnlegen}
          onAntwortLoeschen={(id) => { loescheAntwort(id); refresh(); }}
          onHerz={herzGedrueckt}
          tick={tick}
        />
      )}
    </div>
  );
}

// === Name-Knopf ===

function NameKnopf({ refresh }: { refresh: () => void }) {
  const [bearbeiten, setBearbeiten] = useState(false);
  const [wert, setWert] = useState(nutzerName());

  function speichern() {
    setzeNutzerName(wert);
    setBearbeiten(false);
    refresh();
  }

  if (bearbeiten) {
    return (
      <form
        className="fragen-name-form"
        onSubmit={(e) => { e.preventDefault(); speichern(); }}
      >
        <input
          autoFocus
          value={wert}
          onChange={(e) => setWert(e.target.value)}
          placeholder="Dein Name"
          maxLength={40}
        />
        <button type="submit">OK</button>
      </form>
    );
  }
  return (
    <button className="fragen-name-btn" onClick={() => setBearbeiten(true)} title="Dein Name fuer Fragen + Antworten">
      <span className="fragen-name-label">Du</span>
      <span className="fragen-name-wert">{nutzerName()}</span>
    </button>
  );
}

// === Neue Frage ===

interface FrageNeuFormProps {
  onAbbrechen: () => void;
  onSpeichern: (titel: string, text: string, pflanzenIds: string[]) => void;
}

function FrageNeuForm({ onAbbrechen, onSpeichern }: FrageNeuFormProps) {
  const [titel, setTitel] = useState('');
  const [text, setText] = useState('');
  const [pflanzenIds, setPflanzenIds] = useState<string[]>([]);

  const istGueltig = titel.trim().length >= 3 && text.trim().length >= 5;

  return (
    <form
      className="fragen-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!istGueltig) return;
        onSpeichern(titel, text, pflanzenIds);
      }}
    >
      <h2>Neue Frage</h2>
      <label>
        <span>Titel</span>
        <input
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="z.B. Wie schuetze ich Tomaten vor Krautfaeule?"
          maxLength={140}
          autoFocus
        />
      </label>
      <label>
        <span>Beschreibung (Markdown)</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Was beobachtest du, was hast du schon versucht, wo bist du dir unsicher?"
          rows={6}
        />
      </label>
      <PflanzenAuswahl ids={pflanzenIds} onChange={setPflanzenIds} />
      <div className="fragen-form-knoepfe">
        <button type="button" className="fragen-btn-grau" onClick={onAbbrechen}>Abbrechen</button>
        <button type="submit" className="fragen-btn" disabled={!istGueltig}>Frage stellen</button>
      </div>
    </form>
  );
}

// === Pflanzen-Auswahl ===

function PflanzenAuswahl({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const [suche, setSuche] = useState('');
  const treffer = useMemo(() => {
    if (!suche.trim()) return [];
    const q = suche.toLowerCase();
    return pflanzen.filter(p => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [suche]);

  function toggle(id: string) {
    if (ids.includes(id)) onChange(ids.filter(x => x !== id));
    else onChange([...ids, id]);
  }

  const ausgewaehlt = ids.map(id => pflanzen.find(p => p.id === id)).filter(p => p);

  return (
    <div className="fragen-pflanzen-auswahl">
      <span className="fragen-form-label">Pflanzen-Bezug (optional)</span>
      {ausgewaehlt.length > 0 && (
        <div className="fragen-pflanzen-chips">
          {ausgewaehlt.map(p => p && (
            <button key={p.id} type="button" className="fragen-pflanze-chip" onClick={() => toggle(p.id)}>
              {p.name} ×
            </button>
          ))}
        </div>
      )}
      <input
        value={suche}
        onChange={(e) => setSuche(e.target.value)}
        placeholder="Pflanze suchen…"
      />
      {treffer.length > 0 && (
        <ul className="fragen-pflanzen-treffer">
          {treffer.map(p => (
            <li key={p.id}>
              <button type="button" onClick={() => { toggle(p.id); setSuche(''); }}>
                {p.name} <span className="latein">{p.lateinisch}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// === Detail ===

interface FrageDetailProps {
  frage: Frage;
  onZurueck: () => void;
  onLoeschen: () => void;
  onAntwort: (daten: { was: string; ergebnis: string; womit?: string; wann?: string; kontext?: string }) => void;
  onAntwortLoeschen: (id: string) => void;
  onHerz: (id: string) => void;
  tick: number;
}

function FrageDetail({ frage, onZurueck, onLoeschen, onAntwort, onAntwortLoeschen, onHerz, tick }: FrageDetailProps) {
  const antworten = useMemo(() => antwortenZuFrage(frage.id), [frage.id, tick]);
  const meineFrage = frage.autorId === nutzerId();
  const nav = useDetailNav();

  return (
    <article className="frage-detail">
      <nav className="frage-detail-nav">
        <button className="fragen-btn-grau" onClick={onZurueck}>‹ Alle Fragen</button>
        {meineFrage && <button className="fragen-btn-loeschen" onClick={onLoeschen}>Loeschen</button>}
      </nav>

      <header className="frage-detail-kopf">
        <span
          className="fragen-status"
          style={{ background: statusFarbe(frage.status), color: 'white' }}
        >{statusLabel(frage.status)}</span>
        <h1>{frage.titel}</h1>
        <div className="frage-detail-meta">
          <span>{frage.autorName}</span>
          <span>·</span>
          <span>{zeitFormatieren(frage.erstellt)}</span>
          <span>·</span>
          <span>{antworten.length} {antworten.length === 1 ? 'Antwort' : 'Antworten'}</span>
        </div>
      </header>

      <div className="frage-detail-text">
        <MarkdownText text={frage.text} />
      </div>

      {frage.pflanzenIds && frage.pflanzenIds.length > 0 && (
        <div className="frage-detail-pflanzen">
          <span className="fragen-form-label">Pflanzen-Bezug</span>
          <div>
            {frage.pflanzenIds.map(id => {
              const p = pflanzen.find(x => x.id === id);
              if (!p) return null;
              return (
                <button
                  key={id}
                  type="button"
                  className="fragen-pflanze-chip fragen-pflanze-chip-link"
                  onClick={() => nav.oeffne({ kind: 'pflanze', id })}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <section className="frage-antworten">
        <h2>Antworten</h2>
        {antworten.length === 0 ? (
          <p className="fragen-leer-text">Noch keine Antwort. Sei der erste.</p>
        ) : (
          <ul className="antwort-liste">
            {antworten.map(a => (
              <AntwortEintrag
                key={a.id}
                antwort={a}
                onHerz={onHerz}
                onLoeschen={() => onAntwortLoeschen(a.id)}
              />
            ))}
          </ul>
        )}

        <AntwortForm onSpeichern={onAntwort} />
      </section>
    </article>
  );
}

// === Antwort-Eintrag ===

function AntwortEintrag({ antwort: a, onHerz, onLoeschen }: {
  antwort: Antwort;
  onHerz: (id: string) => void;
  onLoeschen: () => void;
}) {
  const anzahl = herzAnzahl(a.votes);
  const meins = meinHerz(a.votes);
  const meineAntwort = a.autorId === nutzerId();

  return (
    <li className="antwort">
      <div className="antwort-herz">
        <button
          className={`herz-btn ${meins ? 'aktiv' : ''}`}
          onClick={() => onHerz(a.id)}
          aria-label={meins ? 'Herz zuruecknehmen' : 'Herz vergeben'}
          title={meins ? 'Herz zuruecknehmen' : 'Herz vergeben'}
        >
          {meins ? '♥' : '♡'}
        </button>
        <span className="herz-zahl">{anzahl}</span>
      </div>
      <div className="antwort-inhalt">
        <div className="antwort-meta">
          <span className="antwort-autor">{a.autorName}</span>
          <span>·</span>
          <span>{zeitFormatieren(a.erstellt)}</span>
          {meineAntwort && (
            <button className="antwort-loeschen" onClick={onLoeschen}>loeschen</button>
          )}
        </div>
        <dl className="antwort-felder">
          <dt>Was</dt><dd>{a.was}</dd>
          {a.womit && (<><dt>Womit</dt><dd>{a.womit}</dd></>)}
          {a.wann && (<><dt>Wann</dt><dd>{a.wann}</dd></>)}
          <dt>Ergebnis</dt><dd>{a.ergebnis}</dd>
          {a.kontext && (<><dt>Kontext</dt><dd>{a.kontext}</dd></>)}
        </dl>
      </div>
    </li>
  );
}

// === Antwort-Form ===

function AntwortForm({ onSpeichern }: { onSpeichern: (d: { was: string; ergebnis: string; womit?: string; wann?: string; kontext?: string }) => void }) {
  const [offen, setOffen] = useState(false);
  const [was, setWas] = useState('');
  const [ergebnis, setErgebnis] = useState('');
  const [womit, setWomit] = useState('');
  const [wann, setWann] = useState('');
  const [kontext, setKontext] = useState('');

  function speichern() {
    if (was.trim().length < 3 || ergebnis.trim().length < 3) return;
    onSpeichern({ was, ergebnis, womit, wann, kontext });
    setWas(''); setErgebnis(''); setWomit(''); setWann(''); setKontext('');
    setOffen(false);
  }

  if (!offen) {
    return (
      <button className="fragen-neu-btn" onClick={() => setOffen(true)}>
        + Antwort schreiben
      </button>
    );
  }

  return (
    <form
      className="fragen-form antwort-form"
      onSubmit={(e) => { e.preventDefault(); speichern(); }}
    >
      <h3>Deine Antwort</h3>
      <p className="antwort-form-hinweis">Berichte konkret: was hast du getan, womit, wann, was kam dabei raus?</p>
      <label>
        <span>Was *</span>
        <input value={was} onChange={(e) => setWas(e.target.value)} placeholder="Konkrete Massnahme" required />
      </label>
      <label>
        <span>Womit (optional)</span>
        <input value={womit} onChange={(e) => setWomit(e.target.value)} placeholder="Mittel, Werkzeug, Mengen" />
      </label>
      <label>
        <span>Wann (optional)</span>
        <input value={wann} onChange={(e) => setWann(e.target.value)} placeholder="Zeitpunkt, Bedingung" />
      </label>
      <label>
        <span>Ergebnis *</span>
        <textarea value={ergebnis} onChange={(e) => setErgebnis(e.target.value)} placeholder="Wirkung, Erfolg, Misserfolg" rows={3} required />
      </label>
      <label>
        <span>Kontext (optional)</span>
        <input value={kontext} onChange={(e) => setKontext(e.target.value)} placeholder="Pflanze, Garten, Region, Sorte" />
      </label>
      <div className="fragen-form-knoepfe">
        <button type="button" className="fragen-btn-grau" onClick={() => setOffen(false)}>Abbrechen</button>
        <button type="submit" className="fragen-btn">Antwort speichern</button>
      </div>
    </form>
  );
}
