import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useConnector, useAuthState } from '@real-life-stack/toolkit';
import { KalenderView } from './views/KalenderView';
import { TagebuchView } from './views/TagebuchView';
import { WunschlistenView } from './views/WunschlistenView';
import { WeltView } from './views/WeltView';
import { StartView } from './views/StartView';
import { KarteView } from './views/KarteView';
import { ProfilView } from './views/ProfilView';
import { ProfilLeseView } from './views/ProfilLeseView';
import { EintragsSeite } from './components/EintragsSeite';
import { TagSeite } from './components/TagSeite';
import { GlobaleSuche } from './components/GlobaleSuche';
import { ThemenMega } from './components/ThemenMega';
import { NutzerMenue } from './components/NutzerMenue';
import { FreundeskreisModal } from './components/FreundeskreisModal';
import { PrivacyBanner } from './components/PrivacyBanner';
import { StandortContext, ladeStandort, speicherStandort, type Ort } from './lib/standort';
import { WissenContext } from './lib/wissen-context';
import { type WeltId } from './lib/welten';
import {
  DetailNavContext,
  type DetailNavigation,
  type DetailRef,
  refZuPfad,
} from './lib/detail-navigation';
import { AnmeldungContext } from './lib/anmeldung-context';
import { type Pflanze, type Gartenarbeit } from './lib/pflanzen';

const LazyDIDAuthScreen = lazy(() =>
  import('@real-life-stack/wot-connector/components').then((m) => ({
    default: m.DIDAuthScreen,
  })),
);

interface WerkzeugDef { id: WerkzeugRoute; label: string; pfad: string; icon: React.ReactNode }
type WerkzeugRoute = 'karte' | 'kalender' | 'tagebuch';

const KarteIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14" />
    <path d="M15 6v14" />
  </svg>
);

const KalenderIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);

const WERKZEUGE: WerkzeugDef[] = [
  { id: 'karte',    label: 'Karte',    pfad: '/karte',    icon: KarteIcon },
  { id: 'kalender', label: 'Kalender', pfad: '/kalender', icon: KalenderIcon },
];

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const connector = useConnector();
  const authState = useAuthState();
  const istAngemeldet = authState.status === 'authenticated';

  const [datum, setDatum] = useState(() => new Date());
  const [ort, setOrt] = useState<Ort>(() => ladeStandort());
  const [themenMega, setThemenMega] = useState(false);
  const [kontakteOffen, setKontakteOffen] = useState(false);
  const [verifyOffen, setVerifyOffen] = useState(false);
  const [anmeldungOffen, setAnmeldungOffen] = useState(false);
  const [freundeskreisTab, setFreundeskreisTab] = useState<'freundeskreis' | 'recht' | 'datenschutz' | null>(null);

  useEffect(() => { speicherStandort(ort); }, [ort]);

  // Themen-Mega bei Navigation schliessen
  useEffect(() => { setThemenMega(false); }, [location.pathname]);

  // === Detail-Navigation: alles geht ueber Router ===
  const oeffneDetail = useCallback((ref: DetailRef) => {
    navigate(refZuPfad(ref));
  }, [navigate]);

  const oeffneWissen = useCallback((sektion: string, eintrag: string) => {
    oeffneDetail({ kind: 'wissen', sektion, eintrag });
  }, [oeffneDetail]);

  const nav: DetailNavigation = useMemo(() => ({
    oeffne: oeffneDetail,
    zurueck: () => navigate(-1),
    springeZu: () => navigate('/'),
    schliesse: () => navigate('/'),
    stack: [],
  }), [oeffneDetail, navigate]);

  // === Navigation mit Anmelde-Pruefung ===
  function gehZu(pfad: string, brauchtAnmeldung = false) {
    if (brauchtAnmeldung && !istAngemeldet) {
      setAnmeldungOffen(true);
      return;
    }
    navigate(pfad);
  }

  const onPflanze = useCallback((p: Pflanze) => oeffneDetail({ kind: 'pflanze', id: p.id }), [oeffneDetail]);
  const onArbeit  = useCallback((a: Gartenarbeit) => oeffneDetail({ kind: 'arbeit',  id: a.id }), [oeffneDetail]);

  // === Aktiver Tab fuer Header-Styling ===
  const aktiveWerkzeug = (() => {
    for (const w of WERKZEUGE) {
      if (location.pathname === w.pfad || location.pathname.startsWith(w.pfad + '/')) return w.id;
    }
    return null;
  })();
  const themenAktiv = location.pathname.startsWith('/welt/');
  // Auf Karte und Kalender keinen Footer zeigen — beide brauchen den vollen Bildschirm
  const footerAnzeigen = location.pathname !== '/karte'
    && location.pathname !== '/kalender'
    && !location.pathname.startsWith('/karte/')
    && !location.pathname.startsWith('/kalender/');

  const anmeldungWert = useMemo(() => ({
    oeffne: () => setAnmeldungOffen(true),
  }), []);

  return (
    <StandortContext.Provider value={ort}>
      <DetailNavContext.Provider value={nav}>
      <WissenContext.Provider value={oeffneWissen}>
      <AnmeldungContext.Provider value={anmeldungWert}>
      <div className="app">
        <header className="app-header">
          <div className="app-header-links">
            <button
              className="app-brand"
              onClick={() => navigate('/')}
              aria-label="Mein kosmischer Garten — Startseite"
              title="Startseite"
            >
              <img src="/logo.svg" alt="" className="app-brand-symbol" />
              <span className="app-brand-text">Mein kosmischer Garten</span>
            </button>
            <nav className="app-nav">
              {WERKZEUGE.map(w => (
                <button
                  key={w.id}
                  className={`tab tab-werkzeug ${aktiveWerkzeug === w.id ? 'tab-active' : ''}`}
                  onClick={() => navigate(w.pfad)}
                  aria-label={w.label}
                  title={w.label}
                >
                  <span className="tab-icon" aria-hidden="true">{w.icon}</span>
                  <span className="tab-text">{w.label}</span>
                </button>
              ))}
              <span className="tab-trenner" aria-hidden="true" />
              <button
                className={`tab tab-themen ${themenAktiv ? 'tab-active' : ''} ${themenMega ? 'tab-themen-offen' : ''}`}
                onClick={() => setThemenMega(o => !o)}
                aria-expanded={themenMega}
                aria-label="Themen"
                title="Themen"
              >
                <span className="tab-icon tab-themen-hamburger" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </svg>
                </span>
                <span className="tab-text">Themen</span>
                <span className="tab-themen-pfeil tab-text" aria-hidden="true">▾</span>
              </button>
            </nav>
          </div>

          <div className="app-header-mitte">
            <GlobaleSuche onKarte={() => navigate('/karte')} />
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
              onProfil={() => gehZu('/profil/bearbeiten', true)}
              kontakteOffen={kontakteOffen}
              setKontakteOffen={setKontakteOffen}
              verifyOffen={verifyOffen}
              setVerifyOffen={setVerifyOffen}
            />
          </div>
        </header>

        {themenMega && (
          <ThemenMega
            onWelt={(weltId) => navigate(`/welt/${weltId}`)}
            onEintrag={(ref) => { oeffneDetail(ref); setThemenMega(false); }}
            onSchliessen={() => setThemenMega(false)}
          />
        )}

        <div className="app-body">
          <main className="app-main">
            <Routes>
              <Route path="/" element={
                <StartView
                  onWelt={(weltId) => navigate(`/welt/${weltId}`)}
                  onTag={() => navigate('/kalender')}
                />
              } />
              <Route path="/karte" element={
                <KarteView onProfil={() => gehZu('/profil', true)} />
              } />
              <Route path="/kalender" element={
                <KalenderView
                  datum={datum}
                  setDatum={setDatum}
                  ort={ort}
                  onOrt={setOrt}
                  onPflanze={onPflanze}
                  onArbeit={onArbeit}
                />
              } />
              <Route path="/tagebuch" element={
                istAngemeldet
                  ? <TagebuchView setDatum={(d) => { setDatum(d); navigate('/kalender'); }} />
                  : <AnmeldenHinweis onAnmelden={() => setAnmeldungOffen(true)} />
              } />
              <Route path="/profil" element={
                istAngemeldet
                  ? <ProfilLeseView
                      onBearbeiten={() => navigate('/profil/bearbeiten')}
                      onTagebuch={() => navigate('/tagebuch')}
                      onKontakte={() => setKontakteOffen(true)}
                      onVerbinden={() => setVerifyOffen(true)}
                    />
                  : <AnmeldenHinweis onAnmelden={() => setAnmeldungOffen(true)} />
              } />
              <Route path="/profil/bearbeiten" element={
                istAngemeldet
                  ? <ProfilView
                      onTagebuch={() => navigate('/tagebuch')}
                      onKarte={() => navigate('/karte')}
                      onKontakte={() => setKontakteOffen(true)}
                      onVerifizieren={() => setVerifyOffen(true)}
                    />
                  : <AnmeldenHinweis onAnmelden={() => setAnmeldungOffen(true)} />
              } />
              <Route path="/welt/:weltId" element={<WeltRoute />} />
              <Route path="/pflanze/:id" element={<EintragRoute typ="pflanze" />} />
              <Route path="/arbeit/:id" element={<EintragRoute typ="arbeit" />} />
              <Route path="/wissen/:sektion/:eintrag" element={<WissenRoute />} />
              <Route path="/tag/:tag" element={<TagRoute />} />
              <Route path="/wunschliste" element={<WunschlistenView />} />
              <Route path="/wunschliste/:bereich" element={<WunschlistenView />} />
              <Route path="*" element={<NichtGefunden />} />
            </Routes>

            {footerAnzeigen && (
              <footer className="app-fuss">
                <div className="app-fuss-zeile">
                  <span className="app-fuss-marke">Mein kosmischer Garten</span>
                  <span className="app-fuss-trenner">·</span>
                  <button
                    type="button"
                    className="app-fuss-link"
                    onClick={() => setFreundeskreisTab('freundeskreis')}
                  >Unter Freunden</button>
                  <span className="app-fuss-trenner">·</span>
                  <button
                    type="button"
                    className="app-fuss-link"
                    onClick={() => setFreundeskreisTab('recht')}
                  >Recht</button>
                  <span className="app-fuss-trenner">·</span>
                  <button
                    type="button"
                    className="app-fuss-link"
                    onClick={() => setFreundeskreisTab('datenschutz')}
                  >Datenschutz</button>
                </div>
                <p className="app-fuss-zusatz">
                  Im internationalen Privatrecht — von Freunden für Freunde. Kein
                  Tracking, kein Impressum, keine Werbung.
                </p>
              </footer>
            )}
          </main>
        </div>

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

        <FreundeskreisModal
          offen={freundeskreisTab !== null}
          onSchliessen={() => setFreundeskreisTab(null)}
          startTab={freundeskreisTab ?? 'freundeskreis'}
        />

        <PrivacyBanner onMehrErfahren={() => setFreundeskreisTab('datenschutz')} />

      </div>
      </AnmeldungContext.Provider>
      </WissenContext.Provider>
      </DetailNavContext.Provider>
    </StandortContext.Provider>
  );
}

// === Route-Komponenten ===

function WeltRoute() {
  const { weltId } = useParams<{ weltId: string }>();
  return <WeltView weltId={weltId as WeltId} />;
}

function EintragRoute({ typ }: { typ: 'pflanze' | 'arbeit' }) {
  const { id } = useParams<{ id: string }>();
  if (!id) return <NichtGefunden />;
  return (
    <div className="detail-seite">
      <div className="detail-inhalt">
        <EintragsSeite eintragId={`${typ}:${id}`} />
      </div>
    </div>
  );
}

function WissenRoute() {
  const { sektion, eintrag } = useParams<{ sektion: string; eintrag: string }>();
  if (!sektion || !eintrag) return <NichtGefunden />;
  return (
    <div className="detail-seite">
      <div className="detail-inhalt">
        <EintragsSeite eintragId={`wissen:${sektion}:${eintrag}`} />
      </div>
    </div>
  );
}

function TagRoute() {
  const { tag } = useParams<{ tag: string }>();
  if (!tag) return <NichtGefunden />;
  return (
    <div className="detail-seite">
      <div className="detail-inhalt">
        <TagSeite tag={decodeURIComponent(tag)} />
      </div>
    </div>
  );
}

function NichtGefunden() {
  const navigate = useNavigate();
  return (
    <div className="detail-leer">
      <p>Diese Seite gibt es nicht.</p>
      <button className="profil-aktion-zweit" onClick={() => navigate('/')}>Zur Startseite</button>
    </div>
  );
}

function AnmeldenHinweis({ onAnmelden }: { onAnmelden: () => void }) {
  return (
    <div className="anmelden-hinweis">
      <h2>Anmeldung nötig</h2>
      <p>Dafür brauchst du einen Schlüssel — leg einen an oder melde dich mit deinen 12 Wörtern an.</p>
      <button className="profil-aktion-primary" onClick={onAnmelden}>Jetzt anmelden</button>
    </div>
  );
}
