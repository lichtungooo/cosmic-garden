import { useCallback, useEffect, useMemo, useState } from 'react';
import { KalenderView } from './views/KalenderView';
import { TagebuchView } from './views/TagebuchView';
import { WeltView } from './views/WeltView';
import { StartView } from './views/StartView';
import { FragenView } from './views/FragenView';
import { GlobaleSuche } from './components/GlobaleSuche';
import { DetailSeite } from './components/DetailSeite';
import { ThemenMega } from './components/ThemenMega';
import { StandortContext, ladeStandort, speicherStandort, type Ort } from './lib/standort';
import { WissenContext } from './lib/wissen-context';
import { type WeltId } from './lib/welten';
import {
  DetailNavContext,
  type DetailNavigation,
  type DetailRef,
  gleichRef,
} from './lib/detail-navigation';
import { type Pflanze, type Gartenarbeit } from './lib/pflanzen';

type WerkzeugTab = 'kalender' | 'tagebuch' | 'fragen';
type Tab =
  | { kind: 'home' }
  | { kind: 'werkzeug'; id: WerkzeugTab }
  | { kind: 'welt'; id: WeltId };

const WERKZEUGE: { id: WerkzeugTab; label: string }[] = [
  { id: 'kalender', label: 'Kalender' },
  { id: 'tagebuch', label: 'Tagebuch' },
  { id: 'fragen',   label: 'Fragen' },
];

function tabSchluessel(t: Tab): string {
  if (t.kind === 'home') return 'home';
  return `${t.kind}:${t.id}`;
}

export function App() {
  const [tab, setTab] = useState<Tab>({ kind: 'home' });
  const [datum, setDatum] = useState(() => new Date());
  const [detailStack, setDetailStack] = useState<DetailRef[]>([]);
  const [ort, setOrt] = useState<Ort>(() => ladeStandort());
  const [themenMega, setThemenMega] = useState(false);

  useEffect(() => {
    speicherStandort(ort);
  }, [ort]);

  const oeffneDetail = useCallback((ref: DetailRef) => {
    setDetailStack(prev => {
      const oben = prev[prev.length - 1];
      if (oben && gleichRef(oben, ref)) return prev;
      return [...prev, ref];
    });
  }, []);

  const zurueck = useCallback(() => {
    setDetailStack(prev => prev.slice(0, -1));
  }, []);

  const springeZu = useCallback((i: number) => {
    setDetailStack(prev => prev.slice(0, i + 1));
  }, []);

  const schliesseDetail = useCallback(() => {
    setDetailStack([]);
  }, []);

  const nav: DetailNavigation = useMemo(() => ({
    oeffne: oeffneDetail,
    zurueck,
    springeZu,
    schliesse: schliesseDetail,
    stack: detailStack,
  }), [oeffneDetail, zurueck, springeZu, schliesseDetail, detailStack]);

  const oeffneWissen = useCallback((sektion: string, eintrag: string) => {
    oeffneDetail({ kind: 'wissen', sektion, eintrag });
  }, [oeffneDetail]);

  const onPflanze = useCallback((p: Pflanze) => {
    oeffneDetail({ kind: 'pflanze', id: p.id });
  }, [oeffneDetail]);

  const onArbeit = useCallback((a: Gartenarbeit) => {
    oeffneDetail({ kind: 'arbeit', id: a.id });
  }, [oeffneDetail]);

  function wechselTab(t: Tab) {
    setTab(t);
    setDetailStack([]);
    setThemenMega(false);
  }

  const inDetail = detailStack.length > 0;
  const aktiverSchluessel = tabSchluessel(tab);
  const themenAktiv = !inDetail && tab.kind === 'welt';

  return (
    <StandortContext.Provider value={ort}>
      <DetailNavContext.Provider value={nav}>
      <WissenContext.Provider value={oeffneWissen}>
      <div className="app">
        <header className="app-header">
          <button
            className="app-brand"
            onClick={() => wechselTab({ kind: 'home' })}
            aria-label="Mein kosmischer Garten — Startseite"
          >
            <img src="/logo.svg" alt="" className="app-brand-symbol" />
            <span className="app-brand-text">Mein kosmischer Garten</span>
          </button>
          <nav className="app-nav">
            {WERKZEUGE.map(w => {
              const t: Tab = { kind: 'werkzeug', id: w.id };
              const aktiv = !inDetail && tabSchluessel(t) === aktiverSchluessel;
              return (
                <button
                  key={w.id}
                  className={`tab tab-werkzeug ${aktiv ? 'tab-active' : ''}`}
                  onClick={() => wechselTab(t)}
                >
                  {w.label}
                </button>
              );
            })}
            <span className="tab-trenner" aria-hidden="true" />
            <button
              className={`tab tab-themen ${themenAktiv ? 'tab-active' : ''} ${themenMega ? 'tab-themen-offen' : ''}`}
              onClick={() => setThemenMega(o => !o)}
              aria-expanded={themenMega}
            >
              Themen
              <span className="tab-themen-pfeil" aria-hidden="true">▾</span>
            </button>
          </nav>
          <GlobaleSuche />
        </header>

        {themenMega && (
          <ThemenMega
            onWelt={(weltId) => wechselTab({ kind: 'welt', id: weltId })}
            onEintrag={(ref) => { oeffneDetail(ref); setThemenMega(false); }}
            onSchliessen={() => setThemenMega(false)}
          />
        )}

        <div className="app-body">
          <main className="app-main">
            {inDetail ? (
              <DetailSeite />
            ) : tab.kind === 'home' ? (
              <StartView
                onWerkzeug={(id) => wechselTab({ kind: 'werkzeug', id })}
                onJahreskreis={() => wechselTab({ kind: 'werkzeug', id: 'kalender' })}
                onMaya={() => wechselTab({ kind: 'werkzeug', id: 'kalender' })}
                onWelt={(weltId) => wechselTab({ kind: 'welt', id: weltId })}
                onTag={() => wechselTab({ kind: 'werkzeug', id: 'kalender' })}
              />
            ) : tab.kind === 'werkzeug' ? (
              <>
                {tab.id === 'kalender' && (
                  <KalenderView
                    datum={datum}
                    setDatum={setDatum}
                    ort={ort}
                    onOrt={setOrt}
                    onPflanze={onPflanze}
                    onArbeit={onArbeit}
                  />
                )}
                {tab.id === 'tagebuch' && <TagebuchView setDatum={(d) => { setDatum(d); setTab({ kind: 'werkzeug', id: 'kalender' }); }} />}
                {tab.id === 'fragen' && <FragenView />}
              </>
            ) : (
              <WeltView weltId={tab.id} />
            )}
          </main>
        </div>

      </div>
      </WissenContext.Provider>
      </DetailNavContext.Provider>
    </StandortContext.Provider>
  );
}
