import { useMemo, useState, useEffect, useRef } from 'react';
import { sucheVolltext } from '../lib/datenbank-suche';
import type { Eintrag, EintragsTyp } from '../lib/datenbank';
import { useDetailNav, refAusId } from '../lib/detail-navigation';
import { useWotSuche, pinTrefferFarbe, pinTrefferKategorie, type WotTreffer } from '../lib/wot-suche';

const TYP_LABEL: Record<EintragsTyp, string> = {
  pflanze:  'Pflanze',
  arbeit:   'Arbeit',
  wissen:   'Wissen',
  frage:    'Frage',
  antwort:  'Antwort',
};

const TYP_FARBE: Record<EintragsTyp, string> = {
  pflanze:  '#4a7c3a',
  arbeit:   '#5b3a8a',
  wissen:   '#3b4b6b',
  frage:    '#c89b3a',
  antwort:  '#a8423a',
};

interface Props {
  onKarte?: (pinId: string) => void;
}

export function GlobaleSuche({ onKarte }: Props = {}) {
  const [q, setQ] = useState('');
  const [offen, setOffen] = useState(false);
  const [filterTyp, setFilterTyp] = useState<EintragsTyp | 'alle'>('alle');
  const wrap = useRef<HTMLDivElement>(null);
  const nav = useDetailNav();
  const wotTreffer = useWotSuche(q);

  const treffer = useMemo(() => {
    if (!q.trim()) return [];
    const opt = filterTyp === 'alle' ? {} : { typen: [filterTyp] };
    return sucheVolltext(q, opt).slice(0, 15);
  }, [q, filterTyp]);

  const gruppiert = useMemo(() => {
    const groups: Partial<Record<EintragsTyp, typeof treffer>> = {};
    for (const t of treffer) {
      if (!groups[t.eintrag.typ]) groups[t.eintrag.typ] = [];
      groups[t.eintrag.typ]!.push(t);
    }
    return groups;
  }, [treffer]);

  useEffect(() => {
    function click(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOffen(false);
    }
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, []);

  function waehle(eintrag: Eintrag) {
    const ref = refAusId(eintrag.id);
    if (ref) nav.oeffne(ref);
    setOffen(false);
    setQ('');
  }

  function waehleWot(t: WotTreffer) {
    if (t.kind === 'pin' && onKarte) {
      onKarte(t.pin.id);
    }
    setOffen(false);
    setQ('');
  }

  return (
    <div className="suche-wrap" ref={wrap}>
      <svg className="suche-lupe" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <line x1="14.5" y1="14.5" x2="19" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        placeholder="Suche über alles — Pflanze, Arbeit, Wissen…"
        value={q}
        onChange={e => { setQ(e.target.value); setOffen(true); }}
        onFocus={() => setOffen(true)}
        className="suche-input"
      />
      {offen && q.trim() && (
        <div className="suche-dropdown global-suche-dropdown">
          <div className="global-suche-filter">
            <button
              className={`global-filter-chip ${filterTyp === 'alle' ? 'aktiv' : ''}`}
              onClick={() => setFilterTyp('alle')}
            >alle ({treffer.length})</button>
            {(['pflanze', 'arbeit', 'wissen'] as EintragsTyp[]).map(t => (
              <button
                key={t}
                className={`global-filter-chip ${filterTyp === t ? 'aktiv' : ''}`}
                onClick={() => setFilterTyp(t)}
                style={filterTyp === t ? { background: TYP_FARBE[t], borderColor: TYP_FARBE[t], color: 'white' } : { borderLeftColor: TYP_FARBE[t] }}
              >
                {TYP_LABEL[t]} ({gruppiert[t]?.length ?? 0})
              </button>
            ))}
          </div>

          {treffer.length === 0 && wotTreffer.length === 0 ? (
            <div className="suche-leer">Kein Treffer für „{q}“</div>
          ) : (
            <ul className="global-suche-liste">
              {treffer.map(t => (
                <li
                  key={t.eintrag.id}
                  className="global-suche-eintrag"
                  onClick={() => waehle(t.eintrag)}
                  style={{ borderLeftColor: TYP_FARBE[t.eintrag.typ] }}
                >
                  <span className="global-suche-typ" style={{ background: TYP_FARBE[t.eintrag.typ] }}>
                    {TYP_LABEL[t.eintrag.typ]}
                  </span>
                  <div className="global-suche-info">
                    <span className="global-suche-titel">{t.eintrag.titel}</span>
                    {t.eintrag.untertitel && <span className="global-suche-untertitel">{t.eintrag.untertitel}</span>}
                    <span className="global-suche-kurz">{t.eintrag.kurz}</span>
                  </div>
                </li>
              ))}
              {wotTreffer.slice(0, 10).map(t => {
                const farbe = pinTrefferFarbe(t);
                const kategorie = pinTrefferKategorie(t);
                const titel = t.kind === 'pin' ? t.pin.titel : t.name;
                const kurz = t.kind === 'pin'
                  ? (t.pin.text.slice(0, 100) || t.pin.hashtags.map(h => '#' + h).join(' '))
                  : t.hashtags.map(h => '#' + h).join(' ');
                return (
                  <li
                    key={t.kind + ':' + (t.kind === 'pin' ? t.pin.id : t.profilId)}
                    className="global-suche-eintrag"
                    onClick={() => waehleWot(t)}
                    style={{ borderLeftColor: farbe }}
                  >
                    <span className="global-suche-typ" style={{ background: farbe }}>
                      {kategorie}
                    </span>
                    <div className="global-suche-info">
                      <span className="global-suche-titel">{titel}</span>
                      <span className="global-suche-kurz">{kurz}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
