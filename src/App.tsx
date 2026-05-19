import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useConnector, useAuthState } from '@real-life-stack/toolkit';
import { KalenderView } from './views/KalenderView';
import { TagebuchView } from './views/TagebuchView';
import { WeltView } from './views/WeltView';
import { StartView } from './views/StartView';
import { KarteView } from './views/KarteView';
import { ProfilView } from './views/ProfilView';
import { GlobaleSuche } from './components/GlobaleSuche';
import { DetailSeite } from './components/DetailSeite';
import { ThemenMega } from './components/ThemenMega';
import { NutzerMenue } from './components/NutzerMenue';
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

const LazyDIDAuthScreen = lazy(() =>
  import('@real-life-stack/wot-connector/components').then((m) => ({
    default: m.DIDAuthScreen,
  })),
);

type WerkzeugTab = 'karte' | 'kalender' | 'tagebuch';
type Tab =
  | { kind: 'home' }
  | { kind: 'werkzeug'; id: WerkzeugTab }
  | { kind: 'welt'; id: WeltId }
  | { kind: 'profil' };

const WERKZEUGE: { id: WerkzeugTab; label: string }[] = [
  { id: 'karte',    label: 'Karte' },
  { id: 'kalender', label: 'Kalender' },
];

function tabSchluessel(t: Tab): string {
  if (t.kind === 'home') return 'home';
  if (t.kind === 'profil') return 'profil';
  return `${t.kind}:${t.id}`;
}

export function App() {
  const connector = useConnector();
  const authState = useAuthState();
  const istAngemeldet = authState.status === 'authenticated';

  const [tab, setTab] = useState<Tab>({ kind: 'home' });
  const [datum, setDatum] = useState(() => new Date());
  const [detailStack, setDetailStack] = useState<DetailRef[]>([]);
  const [ort, setOrt] = useState<Ort>(() => ladeStandort());
  const [themenMega, setThemenMega] = useState(false);
  const [kontakteOffen, setKontakteOffen] = useState(false);
  const [verifyOffen, setVerifyOffen] = useState(false);
  const [anmeldungOffen, setAnmeldungOffen] = useState(false);

  // Wer auf Profil-Tab will, ohne angemeldet zu sein, landet im Anmelde-Schirm.
  function wechselTabSicher(t: Tab) {
    if (t.kind === 'profil' && !istAngemeldet) {
      setAnmeldungOffen(true);
      return;
    }
    if (t.kind === 'werkzeug' && t.id === 'tagebuch' && !istAngemeldet) {
      setAnmeldungOffen(true);
      return;
    }
    wechselTab(t);
  }

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
          <div className="app-header-links">
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
          </div>

          <div className="app-header-mitte">
            <GlobaleSuche onKarte={() => wechselTab({ kind: 'werkzeug', id: 'karte' })} />
          </div>

          <div className="app-header-rechts">
            <button
              className="app-einstellungen"
              onClick={() => alert('Einstellungen folgen — hier wird man Karte, Marktplatz und Sichtbarkeit global einstellen können.')}
              aria-label="Einstellungen"
              title="Einstellungen"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.03 7.03 0 0 0-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.49.42l-.38 2.65c-.6.25-1.17.58-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.14.24.43.34.69.22l2.49-1c.52.4 1.09.73 1.69.98l.38 2.65c.05.24.25.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65c.6-.25 1.17-.58 1.69-.98l2.49 1c.26.12.55.02.69-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z" fill="currentColor"/>
              </svg>
            </button>
            <NutzerMenue
              istAngemeldet={istAngemeldet}
              onAnmelden={() => setAnmeldungOffen(true)}
              onProfil={() => wechselTabSicher({ kind: 'profil' })}
              kontakteOffen={kontakteOffen}
              setKontakteOffen={setKontakteOffen}
              verifyOffen={verifyOffen}
              setVerifyOffen={setVerifyOffen}
            />
          </div>
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
            ) : tab.kind === 'profil' ? (
              <ProfilView
                onTagebuch={() => wechselTabSicher({ kind: 'werkzeug', id: 'tagebuch' })}
                onKarte={() => wechselTab({ kind: 'werkzeug', id: 'karte' })}
                onKontakte={() => setKontakteOffen(true)}
                onVerifizieren={() => setVerifyOffen(true)}
              />
            ) : tab.kind === 'werkzeug' ? (
              <>
                {tab.id === 'karte' && (
                  <KarteView onProfil={() => wechselTabSicher({ kind: 'profil' })} />
                )}
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
              </>
            ) : (
              <WeltView weltId={tab.id} />
            )}
          </main>
        </div>

        {/* Anmeldung als Vollbild-Overlay, nur wenn ausgeloest und noch nicht angemeldet */}
        {anmeldungOffen && !istAngemeldet && (
          <div className="anmeldung-overlay">
            <button
              className="anmeldung-overlay-schliessen"
              onClick={() => setAnmeldungOffen(false)}
              aria-label="Anmeldung abbrechen"
            >×</button>
            <Suspense fallback={<div className="ladeschirm"><p>Lade Anmeldung …</p></div>}>
              <LazyDIDAuthScreen
                connector={connector as unknown as import('@real-life-stack/wot-connector').WotConnector}
                onAuthenticated={() => setAnmeldungOffen(false)}
              />
            </Suspense>
          </div>
        )}

      </div>
      </WissenContext.Provider>
      </DetailNavContext.Provider>
    </StandortContext.Provider>
  );
}
