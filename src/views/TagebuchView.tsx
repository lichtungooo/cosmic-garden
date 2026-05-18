import { useMemo, useState } from 'react';
import { useTagebuch, artLabel, artFarbe, type TagebuchArt } from '../lib/tagebuch';
import { thunTypFarbe, thunTypLabel } from '../lib/moon';

const WT_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONATE_LANG = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const ARTEN: TagebuchArt[] = ['beobachtung', 'aussaat', 'pflanzung', 'ernte', 'pflege', 'frage'];

interface Props {
  setDatum: (d: Date) => void;
}

export function TagebuchView({ setDatum }: Props) {
  const { eintraege, loesche } = useTagebuch();
  const [filterArt, setFilterArt] = useState<TagebuchArt | 'alle'>('alle');
  const [suche, setSuche] = useState('');

  const gefiltert = useMemo(() => {
    return eintraege
      .filter(e => filterArt === 'alle' || e.art === filterArt)
      .filter(e => !suche.trim() || e.text.toLowerCase().includes(suche.toLowerCase()))
      .sort((a, b) => b.erstellt - a.erstellt);
  }, [eintraege, filterArt, suche]);

  const stats = useMemo(() => {
    const counts: Record<TagebuchArt, number> = {
      'beobachtung': 0, 'aussaat': 0, 'pflanzung': 0, 'ernte': 0, 'pflege': 0, 'frage': 0,
    };
    eintraege.forEach(e => { counts[e.art]++; });
    return counts;
  }, [eintraege]);

  function springeZuTag(datum: string) {
    const [j, m, t] = datum.split('-').map(Number);
    setDatum(new Date(j, m - 1, t));
  }

  return (
    <div className="tagebuch-view">
      <header className="tagebuch-view-kopf">
        <div>
          <h1>Garten-Tagebuch</h1>
          <p className="tagebuch-view-lead">
            Was beobachtet wurde, was gewachsen ist, was gefragt bleibt. Mit dem Tagestyp aus
            dem Mondkalender. Goethe sagte: erst beobachten, dann denken.
          </p>
        </div>
        <div className="tagebuch-stats">
          {ARTEN.map(a => (
            <button
              key={a}
              className={`tagebuch-stat ${filterArt === a ? 'aktiv' : ''}`}
              style={filterArt === a ? { background: artFarbe(a), borderColor: artFarbe(a), color: 'white' } : { borderLeftColor: artFarbe(a) }}
              onClick={() => setFilterArt(a === filterArt ? 'alle' : a)}
            >
              <span className="tagebuch-stat-zahl">{stats[a]}</span>
              <span className="tagebuch-stat-name">{artLabel(a)}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="tagebuch-filter">
        <input
          type="search"
          placeholder="Suche in den Eintraegen..."
          value={suche}
          onChange={e => setSuche(e.target.value)}
          className="tagebuch-such-input"
        />
        {filterArt !== 'alle' && (
          <button className="tagebuch-filter-loeschen" onClick={() => setFilterArt('alle')}>
            Filter zuruecksetzen
          </button>
        )}
      </div>

      {gefiltert.length === 0 ? (
        <div className="tagebuch-leer-gross">
          {eintraege.length === 0 ? (
            <>
              <h2>Noch keine Eintraege.</h2>
              <p>Wechsle zum Kalender, waehle einen Tag und schreibe deine erste Beobachtung.</p>
            </>
          ) : (
            <p>Mit diesem Filter wurde nichts gefunden.</p>
          )}
        </div>
      ) : (
        <ul className="tagebuch-chrono-liste">
          {gefiltert.map(e => {
            const datum = (() => {
              const [j, m, t] = e.datum.split('-').map(Number);
              return new Date(j, m - 1, t);
            })();
            return (
              <li key={e.id} className="tagebuch-chrono-eintrag" style={{ borderLeftColor: artFarbe(e.art) }}>
                <button
                  type="button"
                  className="tagebuch-chrono-datum"
                  onClick={() => springeZuTag(e.datum)}
                  title="Im Kalender oeffnen"
                >
                  <span className="tagebuch-chrono-tag">{datum.getDate()}</span>
                  <span className="tagebuch-chrono-monat">{MONATE_LANG[datum.getMonth()].slice(0, 3)}</span>
                  <span className="tagebuch-chrono-jahr">{datum.getFullYear()}</span>
                  <span className="tagebuch-chrono-wt">{WT_KURZ[datum.getDay()]}</span>
                </button>

                <div className="tagebuch-chrono-inhalt">
                  <header className="tagebuch-chrono-kopf">
                    <span className="tagebuch-eintrag-art" style={{ background: artFarbe(e.art) }}>
                      {artLabel(e.art)}
                    </span>
                    {e.thunTyp && (
                      <span className="tagebuch-eintrag-thun" style={{ color: thunTypFarbe(e.thunTyp) }}>
                        {thunTypLabel(e.thunTyp)}{e.zeichenName ? ` · ${e.zeichenName}` : ''}
                      </span>
                    )}
                    <button
                      type="button"
                      className="tagebuch-loeschen"
                      onClick={() => { if (confirm('Eintrag wirklich loeschen?')) loesche(e.id); }}
                    >×</button>
                  </header>
                  <p className="tagebuch-eintrag-text">{e.text}</p>
                  <span className="tagebuch-eintrag-zeit">
                    {new Date(e.erstellt).toLocaleString('de-DE', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
