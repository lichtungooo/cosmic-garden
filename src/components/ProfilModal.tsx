// Modal-Wrapper fuer die Profil-Lese-Ansicht.
// Wird vom Karten-Pin geoeffnet. Sitzt rechts, laesst die Karte sichtbar.

import { useEffect } from 'react';
import { ProfilLeseView } from '../views/ProfilLeseView';

interface Props {
  offen: boolean;
  onSchliessen: () => void;
  onBearbeiten: () => void;
  onVerbinden: () => void;
  onKontakte: () => void;
}

export function ProfilModal({ offen, onSchliessen, onBearbeiten, onVerbinden, onKontakte }: Props) {
  useEffect(() => {
    if (!offen) return;
    function aufEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onSchliessen();
    }
    document.addEventListener('keydown', aufEsc);
    return () => document.removeEventListener('keydown', aufEsc);
  }, [offen, onSchliessen]);

  if (!offen) return null;

  return (
    <aside
      className="profil-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Profil"
    >
      <button
        type="button"
        className="profil-modal-x"
        onClick={onSchliessen}
        aria-label="Profil schließen"
      >×</button>
      <div className="profil-modal-koerper">
        <ProfilLeseView
          onBearbeiten={() => { onSchliessen(); onBearbeiten(); }}
          onVerbinden={onVerbinden}
          onKontakte={onKontakte}
        />
      </div>
    </aside>
  );
}
