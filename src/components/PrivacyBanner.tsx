// Banner unten am Bildschirmrand beim allerersten Besuch.
// Klick auf "Verstanden" speichert garten_privacy_ok in localStorage,
// dann erscheint der Banner nie wieder.

import { useState } from 'react';

const STORAGE_KEY = 'garten_privacy_ok';

interface Props {
  onMehrErfahren?: () => void;
}

export function PrivacyBanner({ onMehrErfahren }: Props) {
  const [bestaetigt, setBestaetigt] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (bestaetigt) return null;

  function bestaetigen() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setBestaetigt(true);
  }

  return (
    <div className="privacy-banner" role="region" aria-label="Datenschutz-Hinweis">
      <span className="privacy-banner-symbol" aria-hidden="true">🔒</span>
      <p className="privacy-banner-text">
        <strong>Keine Cookies. Kein Tracking. Keine Werbung.</strong>{' '}
        Diese Seite respektiert deine Privatsphäre vollständig — alle Daten
        bleiben lokal in deinem Browser.
      </p>
      <div className="privacy-banner-aktionen">
        {onMehrErfahren && (
          <button
            type="button"
            className="privacy-banner-mehr"
            onClick={onMehrErfahren}
          >Mehr erfahren</button>
        )}
        <button
          type="button"
          className="privacy-banner-ok"
          onClick={bestaetigen}
        >Verstanden</button>
      </div>
    </div>
  );
}
