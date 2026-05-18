import { useState } from 'react';
import type { Ort } from '../lib/standort';

interface Props {
  ort: Ort;
  onChange: (ort: Ort) => void;
}

type Status = 'idle' | 'lokalisiere' | 'fehler';

export function StandortMenu({ ort, onChange }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [fehler, setFehler] = useState<string | null>(null);

  async function bestimmeStandort() {
    if (!navigator.geolocation) {
      setStatus('fehler');
      setFehler('Geraet bietet keine Standortbestimmung.');
      return;
    }
    setStatus('lokalisiere');
    setFehler(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let name = 'Mein Standort';
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=de`
          );
          if (r.ok) {
            const data = await r.json();
            name = data.city || data.locality || data.principalSubdivision || name;
          }
        } catch { /* leise */ }
        onChange({ name, lat: latitude, lon: longitude });
        setStatus('idle');
      },
      (err) => {
        setStatus('fehler');
        if (err.code === err.PERMISSION_DENIED) setFehler('Standort nicht erlaubt');
        else if (err.code === err.POSITION_UNAVAILABLE) setFehler('Standort nicht verfuegbar');
        else if (err.code === err.TIMEOUT) setFehler('Anfrage zu lang');
        else setFehler('Fehler');
        window.setTimeout(() => { setStatus('idle'); setFehler(null); }, 3000);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }

  const label = status === 'lokalisiere' ? 'Suche …' : status === 'fehler' ? (fehler ?? 'Fehler') : ort.name;

  return (
    <button
      className={`standort-btn ${status === 'lokalisiere' ? 'standort-lokalisiert' : ''} ${status === 'fehler' ? 'standort-fehler-state' : ''}`}
      onClick={bestimmeStandort}
      disabled={status === 'lokalisiere'}
      title="Klick: Standort per GPS bestimmen"
    >
      <StandortIcon />
      <span>{label}</span>
    </button>
  );
}

function StandortIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="standort-icon">
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <line x1="12" y1="1.5" x2="12" y2="4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="19.5" x2="12" y2="22.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="1.5" y1="12" x2="4.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="19.5" y1="12" x2="22.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
