// Hashtag-Eingabe — klein-tippen, Enter zum Hinzufuegen, Klick auf Tag entfernt ihn.
// Tags landen als normalisierte Strings (klein, ohne #, ohne Leerzeichen) im State.
// Die Anzeige zeigt sie mit fuehrendem #.

import { useState, type KeyboardEvent } from 'react';
import { fuegeTagHinzu, entferneTag, normalisiereTag } from '../lib/profil';

interface Props {
  tags: string[];
  onChange: (next: string[]) => void;
  platzhalter?: string;
  farbe?: string;
}

export function HashtagEingabe({ tags, onChange, platzhalter, farbe }: Props) {
  const [eingabe, setEingabe] = useState('');

  function abschicken() {
    const sauber = normalisiereTag(eingabe);
    if (!sauber) { setEingabe(''); return; }
    onChange(fuegeTagHinzu(tags, eingabe));
    setEingabe('');
  }

  function aufTaste(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      abschicken();
    } else if (e.key === 'Backspace' && eingabe === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="hashtag-eingabe">
      <div className="hashtag-liste">
        {tags.map(t => (
          <button
            key={t}
            type="button"
            className="hashtag-chip"
            onClick={() => onChange(entferneTag(tags, t))}
            title="Klick zum Entfernen"
            style={farbe ? { borderColor: farbe, color: farbe } : undefined}
          >
            <span className="hashtag-text">#{t}</span>
            <span className="hashtag-x" aria-hidden="true">×</span>
          </button>
        ))}
        <input
          type="text"
          className="hashtag-input"
          value={eingabe}
          onChange={e => setEingabe(e.target.value.toLowerCase())}
          onKeyDown={aufTaste}
          onBlur={() => { if (eingabe) abschicken(); }}
          placeholder={tags.length === 0 ? (platzhalter ?? 'tag eintippen, Enter') : '+'}
        />
      </div>
    </div>
  );
}
