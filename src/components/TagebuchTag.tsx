import { useState } from 'react';
import { useTagebuch, eintraegeFuerTag, artLabel, artFarbe, type TagebuchArt } from '../lib/tagebuch';
import { thunTypFarbe, thunTypLabel } from '../lib/moon';

const ARTEN: TagebuchArt[] = ['beobachtung', 'aussaat', 'pflanzung', 'ernte', 'pflege', 'frage'];

interface Props {
  datum: Date;
  kompakt?: boolean;
}

export function TagebuchTag({ datum, kompakt = false }: Props) {
  const { eintraege, fuegeHinzu, loesche } = useTagebuch();
  const tagEintraege = eintraegeFuerTag(eintraege, datum);
  const [neu, setNeu] = useState('');
  const [art, setArt] = useState<TagebuchArt>('beobachtung');
  const [eingabeOffen, setEingabeOffen] = useState(false);

  function speichern(e: React.FormEvent) {
    e.preventDefault();
    if (!neu.trim()) return;
    fuegeHinzu(neu.trim(), datum, art);
    setNeu('');
    setEingabeOffen(false);
  }

  return (
    <section className={`tagebuch-tag ${kompakt ? 'kompakt' : ''}`}>
      <header className="tagebuch-tag-kopf">
        <h3>Tagebuch</h3>
        <button
          type="button"
          className="tagebuch-neu-btn"
          onClick={() => setEingabeOffen(o => !o)}
        >
          {eingabeOffen ? '×' : '+ Eintrag'}
        </button>
      </header>

      {eingabeOffen && (
        <form className="tagebuch-eingabe" onSubmit={speichern}>
          <div className="tagebuch-art-wahl">
            {ARTEN.map(a => (
              <button
                key={a}
                type="button"
                className={`tagebuch-art-chip ${art === a ? 'aktiv' : ''}`}
                onClick={() => setArt(a)}
                style={art === a ? { background: artFarbe(a), borderColor: artFarbe(a), color: 'white' } : undefined}
              >
                {artLabel(a)}
              </button>
            ))}
          </div>
          <textarea
            className="tagebuch-textarea"
            placeholder={`Was hast du heute beobachtet? Was wurde gesät, gepflegt, geerntet? Welche Frage hast du?`}
            value={neu}
            onChange={e => setNeu(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="tagebuch-eingabe-buttons">
            <button type="button" className="tagebuch-abbrechen" onClick={() => { setNeu(''); setEingabeOffen(false); }}>
              Abbrechen
            </button>
            <button type="submit" className="tagebuch-speichern" disabled={!neu.trim()}>
              Speichern
            </button>
          </div>
        </form>
      )}

      {tagEintraege.length === 0 ? (
        <p className="tagebuch-leer">{kompakt ? 'Noch keine Einträge.' : 'Noch nichts notiert. Beobachtung, Aussaat, Ernte — alles findet hier Platz.'}</p>
      ) : (
        <ul className="tagebuch-liste">
          {tagEintraege.map(e => (
            <li key={e.id} className="tagebuch-eintrag" style={{ borderLeftColor: artFarbe(e.art) }}>
              <header className="tagebuch-eintrag-kopf">
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
                  title="Loeschen"
                >×</button>
              </header>
              <p className="tagebuch-eintrag-text">{e.text}</p>
              <span className="tagebuch-eintrag-zeit">{new Date(e.erstellt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
