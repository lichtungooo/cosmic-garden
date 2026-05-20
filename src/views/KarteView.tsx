// Karten-Voll-Seite. Leaflet-Karte mit Gärtner- und Gartenprojekt-Pins.
// Drueber: Filter (Pin-Typ + Hashtag), unten links: FAB zum Setzen eines neuen Pins.
// Klick auf Pin oeffnet rechts ein Detail-Panel.

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCurrentUser } from '@real-life-stack/toolkit';
import { useStandort } from '../lib/standort';
import {
  usePins,
  usePinAktionen,
  useMeineGaertnerPin,
  pinArtFarbe,
  pinArtLabel,
  pinArtSymbol,
  type Pin,
  type PinArt,
} from '../lib/karte';
import { useMeinProfil } from '../lib/profil';
import { HashtagEingabe } from '../components/HashtagEingabe';
import { MarkdownText } from '../components/MarkdownText';

// === Pin-Icon: Tropfen-Form mit kleinem Maennchen drin ===
// Spitze unten zeigt genau auf den Ort. Klein gehalten — viele Pins erwartet.

function pinIcon(_art: PinArt, fokus: boolean = false): L.DivIcon {
  const farbe = pinArtFarbe('gaertner');
  const breite = fokus ? 30 : 24;
  const hoehe = Math.round(breite * 1.3);
  const html = `
    <div class="garten-pin ${fokus ? 'fokus' : ''}" style="--pin-farbe:${farbe};width:${breite}px;height:${hoehe}px">
      <svg viewBox="0 0 24 32" width="${breite}" height="${hoehe}" xmlns="http://www.w3.org/2000/svg" class="garten-pin-tropfen">
        <path d="M12 0 C 5.4 0 0 5.4 0 12 C 0 21 12 32 12 32 C 12 32 24 21 24 12 C 24 5.4 18.6 0 12 0 Z" fill="${farbe}" stroke="white" stroke-width="1.6"/>
        <circle cx="12" cy="9" r="2.2" fill="white"/>
        <path d="M7 16 C 7 12.8 9.2 11 12 11 C 14.8 11 17 12.8 17 16 Z" fill="white"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'garten-pin-wrap',
    iconSize: [breite, hoehe],
    iconAnchor: [breite / 2, hoehe],  // Spitze des Tropfens zeigt auf den Ort
    popupAnchor: [0, -hoehe],
  });
}

// === Bling-Effekt für neue Pins ===

function blingIcon(): L.DivIcon {
  const html = `
    <div class="bling-effekt">
      <span class="bling-ring"></span>
      <span class="bling-ring bling-ring-2"></span>
      <span class="bling-stern bling-stern-1">✦</span>
      <span class="bling-stern bling-stern-2">✦</span>
      <span class="bling-stern bling-stern-3">✦</span>
      <span class="bling-stern bling-stern-4">✦</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'bling-wrap',
    iconSize: [80, 80],
    iconAnchor: [40, 40],
  });
}

// === Haupt-View ===

export function KarteView({ onProfil }: { onProfil: () => void }) {
  const { data: user } = useCurrentUser();
  const ort = useStandort();
  const pins = usePins();
  const aktionen = usePinAktionen();
  const meinProfilPin = useMeineGaertnerPin();
  const { profil } = useMeinProfil();

  const [fokusPin, setFokusPin] = useState<Pin | null>(null);
  const [neuModus, setNeuModus] = useState<PinArt | null>(null);
  const [neuLatLng, setNeuLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [bling, setBling] = useState<{ lat: number; lng: number; id: number } | null>(null);
  const [profilHinweis, setProfilHinweis] = useState<string | null>(null);
  const [rlnModalOffen, setRlnModalOffen] = useState(false);

  const gefiltert = pins;

  // === Leaflet-Karte einrichten ===
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const ghostMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const startKoords: L.LatLngTuple = [ort.lat, ort.lon];
    const karte = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView(startKoords, 10);

    // Zoom-Controls links mittig (Default ist topleft — wir verschieben sie via CSS).
    L.control.zoom({ position: 'topleft' }).addTo(karte);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(karte);

    mapRef.current = karte;

    return () => {
      karte.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [ort.lat, ort.lon]);

  // Klick zum Setzen eines neuen Pins
  useEffect(() => {
    const karte = mapRef.current;
    if (!karte) return;
    function onClick(e: L.LeafletMouseEvent) {
      if (!neuModus) return;
      setNeuLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
    karte.on('click', onClick);
    return () => { karte.off('click', onClick); };
  }, [neuModus]);

  // Ghost-Marker beim Setzen
  useEffect(() => {
    const karte = mapRef.current;
    if (!karte) return;
    if (ghostMarkerRef.current) {
      ghostMarkerRef.current.remove();
      ghostMarkerRef.current = null;
    }
    if (neuLatLng && neuModus) {
      const m = L.marker([neuLatLng.lat, neuLatLng.lng], {
        icon: pinIcon(neuModus, true),
        opacity: 0.7,
      }).addTo(karte);
      ghostMarkerRef.current = m;
    }
  }, [neuLatLng, neuModus]);

  // Marker bei Pin-Aenderungen syncen
  useEffect(() => {
    const karte = mapRef.current;
    if (!karte) return;

    const aktiveIds = new Set(gefiltert.map(p => p.id));

    // alte raus
    for (const [id, marker] of markersRef.current.entries()) {
      if (!aktiveIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    // neue rein / bestehende aktualisieren
    for (const pin of gefiltert) {
      const vorhanden = markersRef.current.get(pin.id);
      const istFokus = fokusPin?.id === pin.id;
      if (vorhanden) {
        vorhanden.setLatLng([pin.lat, pin.lng]);
        vorhanden.setIcon(pinIcon(pin.art, istFokus));
      } else {
        const m = L.marker([pin.lat, pin.lng], { icon: pinIcon(pin.art, istFokus) });
        m.on('click', () => setFokusPin(pin));
        m.addTo(karte);
        markersRef.current.set(pin.id, m);
      }
    }
  }, [gefiltert, fokusPin]);

  // Beim Fokus-Wechsel auf den Pin zoomen (sanft)
  useEffect(() => {
    const karte = mapRef.current;
    if (!karte || !fokusPin) return;
    karte.panTo([fokusPin.lat, fokusPin.lng], { animate: true });
  }, [fokusPin]);

  // Bling-Effekt: fluechtiger Sparkle-Marker an der Pin-Position
  const blingMarkerRef = useRef<L.Marker | null>(null);
  useEffect(() => {
    const karte = mapRef.current;
    if (!karte) return;
    if (blingMarkerRef.current) {
      blingMarkerRef.current.remove();
      blingMarkerRef.current = null;
    }
    if (!bling) return;
    const m = L.marker([bling.lat, bling.lng], { icon: blingIcon(), interactive: false, keyboard: false }).addTo(karte);
    blingMarkerRef.current = m;
    const t = setTimeout(() => {
      m.remove();
      if (blingMarkerRef.current === m) blingMarkerRef.current = null;
    }, 1800);
    return () => { clearTimeout(t); m.remove(); };
  }, [bling]);

  function abbrechen() {
    setNeuModus(null);
    setNeuLatLng(null);
  }

  // Profil-Pin: kein Formular — Geolocation, dann Daten aus dem Profil ziehen.
  async function profilPinSetzen() {
    if (!user) return;
    setProfilHinweis('Ermittle deinen Standort …');
    try {
      const koord = await new Promise<{ lat: number; lng: number } | null>((res) => {
        if (!navigator.geolocation) { res(null); return; }
        navigator.geolocation.getCurrentPosition(
          p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => res(null),
          { enableHighAccuracy: false, timeout: 8000 },
        );
      });
      if (!koord) {
        setProfilHinweis('Standort konnte nicht ermittelt werden.');
        setTimeout(() => setProfilHinweis(null), 2500);
        return;
      }
      const titel = user.displayName || 'Mein Garten';
      const tags = [
        ...profil.begabungen,
        ...profil.beduerfnisse,
        ...profil.lieblingsPflanzen,
      ];
      const text = profil.standort
        ? `Garten in ${profil.standort}.${profil.bodenart ? ' Boden: ' + profil.bodenart + '.' : ''}`
        : '';
      if (meinProfilPin) {
        await aktionen.aendere(meinProfilPin.id, meinProfilPin, {
          lat: koord.lat,
          lng: koord.lng,
          titel,
          text,
          hashtags: tags,
          ortBeschreibung: profil.standort || undefined,
        });
        setProfilHinweis('Dein Profil-Pin wurde aktualisiert.');
      } else {
        await aktionen.lege({
          art: 'gaertner',
          titel,
          text,
          hashtags: tags,
          lat: koord.lat,
          lng: koord.lng,
          ortBeschreibung: profil.standort || undefined,
        });
        setProfilHinweis('Du bist auf der Karte.');
      }
      setBling({ lat: koord.lat, lng: koord.lng, id: Date.now() });
      mapRef.current?.flyTo([koord.lat, koord.lng], 12, { duration: 0.8 });
      setTimeout(() => setProfilHinweis(null), 2500);
    } catch {
      setProfilHinweis('Da ist was schiefgegangen.');
      setTimeout(() => setProfilHinweis(null), 2500);
    }
  }

  return (
    <div className="karte-view">
      <div className="karte-buehne">
        <div ref={containerRef} className="karte-leinwand" />

        {/* Einfacher Knopf unten rechts — eigenes Profil auf die Karte setzen */}
        <button
          type="button"
          className="karte-profil-knopf"
          onClick={profilPinSetzen}
          title="Mein Profil auf die Karte setzen"
        >
          <svg viewBox="0 0 24 32" width="22" height="28" fill="currentColor" stroke="white" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 0 C 5.4 0 0 5.4 0 12 C 0 21 12 32 12 32 C 12 32 24 21 24 12 C 24 5.4 18.6 0 12 0 Z" />
            <circle cx="12" cy="9" r="2.2" fill="white" />
            <path d="M7 16 C 7 12.8 9.2 11 12 11 C 14.8 11 17 12.8 17 16 Z" fill="white" />
          </svg>
          <span>Mein Profil auf die Karte setzen</span>
        </button>

        {/* RLN-Hinweis links unten — klickbar, oeffnet Modal */}
        <button
          type="button"
          className="karte-rln-hinweis"
          onClick={() => setRlnModalOffen(true)}
        >
          <strong>Garten ist die Vorstufe</strong>
          <span>Marktplatz, Veranstaltungen und Gemeinschaftsgärten kommen im Real Life Network. Mehr erfahren →</span>
        </button>

        {rlnModalOffen && (
          <RlnModal onSchliessen={() => setRlnModalOffen(false)} />
        )}

        {/* Kurzer Profil-Hinweis (z.B. nach Profil-Pin-Aktion) */}
        {profilHinweis && (
          <div className="karte-meldung">{profilHinweis}</div>
        )}

        {/* Vorschau-Modal beim Pin-Klick: Bild + Name + Kurz */}
        {fokusPin && (
          <PinVorschau
            pin={fokusPin}
            istMeiner={!!user && fokusPin.autorId === user.id}
            onSchliessen={() => setFokusPin(null)}
            onZuProfil={onProfil}
          />
        )}
      </div>
    </div>
  );
}


// === PinVorschau — kleines Modal beim Klick auf einen Pin auf der Karte ===

function PinVorschau({ pin, istMeiner, onSchliessen, onZuProfil }: {
  pin: Pin;
  istMeiner: boolean;
  onSchliessen: () => void;
  onZuProfil: () => void;
}) {
  return (
    <aside className="karte-vorschau" role="dialog" aria-label={`Profil ${pin.titel}`}>
      <button className="karte-vorschau-x" onClick={onSchliessen} aria-label="Schließen">×</button>
      {pin.bild && (
        <div className="karte-vorschau-bild">
          <img src={pin.bild} alt="" />
        </div>
      )}
      <div className="karte-vorschau-inhalt">
        <h3 className="karte-vorschau-name">{pin.titel || pin.autorName}</h3>
        {pin.text && (
          <p className="karte-vorschau-kurz">{pin.text.length > 120 ? pin.text.slice(0, 120) + '…' : pin.text}</p>
        )}
        {pin.hashtags.length > 0 && (
          <div className="karte-vorschau-tags">
            {pin.hashtags.slice(0, 4).map(t => <span key={t} className="karte-hashtag">#{t}</span>)}
          </div>
        )}
        <button
          type="button"
          className="karte-vorschau-zumprofil"
          onClick={onZuProfil}
        >
          Profil anzeigen →
        </button>
      </div>
    </aside>
  );
}

// === RLN-Modal: erklaert was Real Life Network ist, mit Tabs + Spende-Link ===

function RlnModal({ onSchliessen }: { onSchliessen: () => void }) {
  const [tab, setTab] = useState<'vision' | 'module' | 'fundament'>('vision');

  useEffect(() => {
    function aufEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onSchliessen();
    }
    document.addEventListener('keydown', aufEsc);
    return () => document.removeEventListener('keydown', aufEsc);
  }, [onSchliessen]);

  return (
    <>
      <div className="rln-modal-overlay" onClick={onSchliessen} />
      <div className="rln-modal" role="dialog" aria-modal="true" aria-label="Real Life Network">
        <button className="rln-modal-x" onClick={onSchliessen} aria-label="Schließen">×</button>
        <header className="rln-modal-kopf">
          <span className="rln-modal-eyebrow">Wohin wir gehen</span>
          <h2>Real Life Network</h2>
          <p className="rln-modal-lead">
            Mein kosmischer Garten ist die <strong>erste Sektion</strong> eines viel größeren Werks.
            Das <strong>Real Life Network</strong> verbindet Menschen über echte Begegnung in der realen Welt —
            ohne Tracking, ohne zentrale Server, von Freunden für Freunde.
          </p>
        </header>

        <nav className="rln-modal-tabs">
          <button
            type="button"
            className={`rln-modal-tab ${tab === 'vision' ? 'aktiv' : ''}`}
            onClick={() => setTab('vision')}
          >Vision</button>
          <button
            type="button"
            className={`rln-modal-tab ${tab === 'module' ? 'aktiv' : ''}`}
            onClick={() => setTab('module')}
          >Was kommt</button>
          <button
            type="button"
            className={`rln-modal-tab ${tab === 'fundament' ? 'aktiv' : ''}`}
            onClick={() => setTab('fundament')}
          >Fundament</button>
        </nav>

        <div className="rln-modal-koerper">
          {tab === 'vision' && (
            <div className="rln-modal-inhalt">
              <p>
                Wir leveln das echte Leben draußen in der Realität. Echte Treffen, echtes
                Vertrauen, echte Begegnungen — alles, was im virtuellen Netz fehlt, holen
                wir zurück in die Welt.
              </p>
              <p>
                Der Garten ist der Anfang. Hier zeigen sich Gärtner, geben Wissen weiter,
                treffen sich am Zaun, beim Markt, im Gemeinschaftsgarten. Das Real Life
                Network wird daraus eine ganze Bewegung machen — mit allen Lebensbereichen
                drin, mit Werkzeugen für gelebte Gemeinschaft.
              </p>
            </div>
          )}
          {tab === 'module' && (
            <div className="rln-modal-inhalt">
              <ul className="rln-modal-liste">
                <li><strong>Reale Begegnungen</strong> — Handshake, Markt-Treffen, Gartenwanderungen</li>
                <li><strong>Karte mit allem Drum und Dran</strong> — nicht nur Profile, auch Marktstände, Veranstaltungen, Werkstätten</li>
                <li><strong>Marktplatz</strong> — Saatgut, Werkzeug, Begabungen, Bedürfnisse</li>
                <li><strong>Veranstaltungen</strong> — Kurse, Festivals, Erntehilfen, Schwarmaktionen</li>
                <li><strong>Gamification</strong> — Skill-Tree, Quests, Abenteuer in der echten Welt</li>
                <li><strong>Spaces</strong> — eigene Netzwerke für Gemeinden, Schulen, Höfe, Initiativen</li>
                <li><strong>AI-Begleiter</strong> — eigene KI, die dir hilft, ohne deine Daten zu verlieren</li>
              </ul>
            </div>
          )}
          {tab === 'fundament' && (
            <div className="rln-modal-inhalt">
              <p>
                Die Identität lebt im <strong>Web of Trust</strong> — zwölf Wörter,
                kein Konto, keine E-Mail, kein Server, der dich kennt. Vertrauen wächst
                durch persönliche Begegnung, Handshake für Handshake.
              </p>
              <p>
                Die Werkzeuge laufen auf dem <strong>Real Life Stack</strong> — Open-Source-
                Bausteine, die jeder Initiative gehören. Kein Konzern dazwischen, kein
                Algorithmus, der nach Reichweite optimiert.
              </p>
              <div className="rln-modal-links">
                <a href="https://web-of-trust.de" target="_blank" rel="noopener noreferrer" className="rln-modal-link">
                  Web of Trust →
                </a>
                <a href="https://real-life.network" target="_blank" rel="noopener noreferrer" className="rln-modal-link">
                  Real Life Network →
                </a>
              </div>
            </div>
          )}
        </div>

        <footer className="rln-modal-fuss">
          <p className="rln-modal-fuss-text">
            <strong>Unterstütze, was wächst.</strong> Spenden gehen direkt an Kollektiv Lichtung e.V.
            und tragen das Real Life Network.
          </p>
          <a
            href="https://www.paypal.com/donate?hosted_button_id=KOLLEKTIV_LICHTUNG"
            target="_blank"
            rel="noopener noreferrer"
            className="rln-modal-spende"
          >
            🌱 Jetzt unterstützen
          </a>
        </footer>
      </div>
    </>
  );
}
