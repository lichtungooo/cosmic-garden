// Vote-Knopf für Fragen, Antworten und Wünsche.
// Zeigt Anzahl + Toggle. Hellgrau wenn nicht gevotet, grün wenn gevotet.

import { useVotes, type ZielArt } from '../lib/votes';
import { useAuthState } from '@real-life-stack/toolkit';
import { useAnmeldung } from '../lib/anmeldung-context';

interface Props {
  zielArt: ZielArt;
  zielId: string;
  label?: string;     // z.B. "stimmt zu" — sichtbar bei Hover
}

export function VoteKnopf({ zielArt, zielId, label }: Props) {
  const { anzahl, habGevotet, toggle } = useVotes(zielArt, zielId);
  const authState = useAuthState();
  const anmeldung = useAnmeldung();
  const istAngemeldet = authState.status === 'authenticated';

  function klick() {
    if (!istAngemeldet) {
      anmeldung.oeffne();
      return;
    }
    toggle();
  }

  const hoverLabel = label ?? (habGevotet ? 'Stimme zurücknehmen' : 'Dem stimme ich zu');

  return (
    <button
      type="button"
      className={`vote-knopf ${habGevotet ? 'gevotet' : ''}`}
      onClick={klick}
      title={hoverLabel}
      aria-label={`${hoverLabel} (${anzahl} ${anzahl === 1 ? 'Stimme' : 'Stimmen'})`}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path
          d="M12 4 L20 14 L4 14 Z"
          fill={habGevotet ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      <span className="vote-zahl">{anzahl}</span>
    </button>
  );
}
