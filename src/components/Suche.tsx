import { useMemo, useState, useEffect, useRef } from 'react';
import { pflanzen, gartenarbeiten } from '../lib/pflanzen';
import { thunTypFarbe } from '../lib/moon';

export interface SucheTreffer {
  art: 'pflanze' | 'arbeit';
  id: string;
  titel: string;
  unter: string;
}

interface SucheProps {
  onTreffer: (treffer: SucheTreffer) => void;
}

export function Suche({ onTreffer }: SucheProps) {
  const [q, setQ] = useState('');
  const [offen, setOffen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const treffer = useMemo<SucheTreffer[]>(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    const out: SucheTreffer[] = [];
    for (const p of pflanzen) {
      if (
        p.name.toLowerCase().includes(lower) ||
        p.lateinisch.toLowerCase().includes(lower) ||
        p.familie.toLowerCase().includes(lower) ||
        p.tipps.toLowerCase().includes(lower)
      ) {
        out.push({ art: 'pflanze', id: p.id, titel: p.name, unter: `${p.familie} · ${p.lateinisch}` });
      }
    }
    for (const a of gartenarbeiten) {
      if (
        a.name.toLowerCase().includes(lower) ||
        a.kategorie.toLowerCase().includes(lower) ||
        a.tipps.toLowerCase().includes(lower)
      ) {
        out.push({ art: 'arbeit', id: a.id, titel: a.name, unter: `Arbeit · ${a.kategorie}` });
      }
    }
    return out.slice(0, 12);
  }, [q]);

  useEffect(() => {
    function click(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOffen(false);
    }
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, []);

  return (
    <div className="suche-wrap" ref={wrap}>
      <svg className="suche-lupe" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <line x1="14.5" y1="14.5" x2="19" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        placeholder="Pflanze, Arbeit, Familie suchen…"
        value={q}
        onChange={e => { setQ(e.target.value); setOffen(true); }}
        onFocus={() => setOffen(true)}
        className="suche-input"
      />
      {offen && treffer.length > 0 && (
        <ul className="suche-dropdown">
          {treffer.map(t => (
            <li
              key={`${t.art}-${t.id}`}
              onClick={() => { onTreffer(t); setOffen(false); setQ(''); }}
            >
              <span
                className="treffer-art"
                style={{ background: t.art === 'pflanze' ? thunTypFarbe('blatt') : '#5b3a8a' }}
              >
                {t.art === 'pflanze' ? 'Pflanze' : 'Arbeit'}
              </span>
              <span className="treffer-titel">{t.titel}</span>
              <span className="treffer-unter">{t.unter}</span>
            </li>
          ))}
        </ul>
      )}
      {offen && q && treffer.length === 0 && (
        <ul className="suche-dropdown">
          <li className="suche-leer">Nichts gefunden.</li>
        </ul>
      )}
    </div>
  );
}
