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

const ALLE_ARTEN: PinArt[] = ['gaertner', 'gartenprojekt', 'veranstaltung', 'angebot'];

// === Pin-Icons (lucide-style SVG-Pfade inline) ===

const ICON_PFADE: Record<PinArt, string> = {
  // gaertner = Sprout: zwei Bogenblätter aus einem Stiel
  gaertner: '<path d="M7 17.6c0-5.3 5-9.6 10-9.6-1 3.6-3 6.4-6 8.2"/><path d="M2 22c0-5.3 3.4-7.4 9.5-7.4"/><path d="M14 5c0-1.7 1.3-3 3-3s3 1.3 3 3-1.3 3-3 3"/>',
  // gartenprojekt = Haus mit Garten-Symbol drinnen (Logo-Anlehnung)
  gartenprojekt: '<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 14c-1.5-1-1.5-3 0-4 1.5 1 1.5 3 0 4z"/>',
  // veranstaltung = Kalender mit Datums-Kreis
  veranstaltung: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/><circle cx="12" cy="15" r="2" fill="currentColor"/>',
  // angebot = Marktstand: Dach + Theke
  angebot: '<path d="M3 9l2-5h14l2 5"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/><path d="M3 9h18"/><path d="M8 21v-6h8v6"/>',
};

function pinIcon(art: PinArt, fokus: boolean = false): L.DivIcon {
  const farbe = pinArtFarbe(art);
  const size = fokus ? 44 : 38;
  const symbolPfad = ICON_PFADE[art];
  const html = `
    <div class="garten-pin ${fokus ? 'fokus' : ''}" style="--pin-farbe:${farbe};width:${size}px;height:${size}px">
      <svg viewBox="0 0 40 50" width="${size}" height="${size * 1.25}" xmlns="http://www.w3.org/2000/svg" class="garten-pin-shape">
        <path d="M20 0 C 9 0 0 9 0 20 C 0 35 20 50 20 50 C 20 50 40 35 40 20 C 40 9 31 0 20 0 Z" fill="${farbe}" stroke="white" stroke-width="2.5"/>
        <circle cx="20" cy="19" r="12" fill="white"/>
      </svg>
      <svg viewBox="0 0 24 24" class="garten-pin-icon" width="${size * 0.5}" height="${size * 0.5}" fill="none" stroke="${farbe}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        ${symbolPfad}
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'garten-pin-wrap',
    iconSize: [size, size * 1.25],
    iconAnchor: [size / 2, size * 1.25],
    popupAnchor: [0, -size],
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

  function fabAuswahl(art: PinArt) {
    setFokusPin(null);
    if (art === 'gaertner') {
      profilPinSetzen();
      return;
    }
    setNeuModus(art);
  }

  return (
    <div className="karte-view">
      <div className="karte-buehne">
        <div ref={containerRef} className="karte-leinwand" />

        {/* Hinweis-Banner bei Setz-Modus */}
        {neuModus && !neuLatLng && (
          <div className="karte-hinweis-banner">
            <span>Klick auf die Karte, um deinen <strong>{pinArtLabel(neuModus)}</strong>-Pin zu setzen.</span>
            <button className="karte-banner-knopf" onClick={abbrechen}>Abbrechen</button>
          </div>
        )}

        {/* FAB unten rechts */}
        {!neuModus && (
          <PinFab onAuswahl={fabAuswahl} />
        )}

        {/* Kurzer Profil-Hinweis (z.B. nach Profil-Pin-Aktion) */}
        {profilHinweis && (
          <div className="karte-meldung">{profilHinweis}</div>
        )}

        {/* Modal für neuen Pin */}
        {neuModus && neuLatLng && neuModus !== 'gaertner' && (
          <NeuPinFormular
            art={neuModus}
            lat={neuLatLng.lat}
            lng={neuLatLng.lng}
            onSpeichern={async (entwurf) => {
              const lat = neuLatLng.lat;
              const lng = neuLatLng.lng;
              await aktionen.lege({ ...entwurf, art: neuModus, lat, lng });
              abbrechen();
              setBling({ lat, lng, id: Date.now() });
            }}
            onAbbrechen={abbrechen}
          />
        )}

        {/* Pin-Detail-Panel */}
        {fokusPin && (
          <PinDetailPanel
            pin={fokusPin}
            istMeiner={!!user && fokusPin.autorId === user.id}
            onSchliessen={() => setFokusPin(null)}
            onLoeschen={async () => {
              if (confirm(`Pin "${fokusPin.titel}" wirklich loeschen?`)) {
                await aktionen.loesche(fokusPin.id);
                setFokusPin(null);
              }
            }}
            onProfil={fokusPin.art === 'gaertner' && fokusPin.autorId === user?.id ? onProfil : undefined}
          />
        )}
      </div>
    </div>
  );
}

// === FAB ===

function PinFab({ onAuswahl }: { onAuswahl: (art: PinArt) => void }) {
  const [offen, setOffen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);

  // Klick ausserhalb schließt das Menue
  useEffect(() => {
    if (!offen) return;
    function aufKlick(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setOffen(false);
      }
    }
    function aufEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOffen(false);
    }
    document.addEventListener('mousedown', aufKlick);
    document.addEventListener('keydown', aufEsc);
    return () => {
      document.removeEventListener('mousedown', aufKlick);
      document.removeEventListener('keydown', aufEsc);
    };
  }, [offen]);

  return (
    <div className={`karte-fab ${offen ? 'offen' : ''}`} ref={wrap}>
      {offen && (
        <div className="karte-fab-liste">
          {ALLE_ARTEN.map(a => (
            <button
              key={a}
              className="karte-fab-eintrag"
              onClick={() => { setOffen(false); onAuswahl(a); }}
              style={{ '--art-farbe': pinArtFarbe(a) } as React.CSSProperties}
            >
              <span className="karte-fab-symbol">{pinArtSymbol(a)}</span>
              <span>{pinArtLabel(a)}</span>
            </button>
          ))}
        </div>
      )}
      {!offen && (
        <button
          className="karte-fab-haupt"
          onClick={() => setOffen(true)}
          aria-label="Pin setzen"
        >+</button>
      )}
    </div>
  );
}

// === Formular für neuen Pin ===

async function komprimiereBild(datei: File, maxKante = 1024, qualitaet = 0.78): Promise<string | null> {
  try {
    const url = URL.createObjectURL(datei);
    try {
      const bild = await new Promise<HTMLImageElement>((res, rej) => {
        const b = new Image();
        b.onload = () => res(b);
        b.onerror = rej;
        b.src = url;
      });
      const skala = Math.min(1, maxKante / Math.max(bild.naturalWidth, bild.naturalHeight));
      const w = Math.max(1, Math.round(bild.naturalWidth * skala));
      const h = Math.max(1, Math.round(bild.naturalHeight * skala));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(bild, 0, 0, w, h);
      return c.toDataURL('image/jpeg', qualitaet);
    } finally { URL.revokeObjectURL(url); }
  } catch { return null; }
}

interface PinEntwurf {
  titel: string;
  text: string;
  hashtags: string[];
  ortBeschreibung?: string;
  bild?: string;
  datum?: string;
  preis?: string;
}

function NeuPinFormular({
  art, lat, lng, onSpeichern, onAbbrechen,
}: {
  art: PinArt;
  lat: number;
  lng: number;
  onSpeichern: (entwurf: PinEntwurf) => Promise<void>;
  onAbbrechen: () => void;
}) {
  const [titel, setTitel] = useState('');
  const [text, setText] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [datum, setDatum] = useState('');
  const [preis, setPreis] = useState('');
  const [ortBeschreibung, setOrtBeschreibung] = useState('');
  const [bild, setBild] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const bildEingabe = useRef<HTMLInputElement | null>(null);

  const istGueltig = titel.trim().length >= 2;

  async function bildWaehlen(datei: File | undefined) {
    if (!datei) return;
    const url = await komprimiereBild(datei);
    if (url) setBild(url);
  }

  async function speichern() {
    if (!istGueltig) return;
    setBusy(true);
    try {
      await onSpeichern({
        titel: titel.trim(),
        text: text.trim(),
        hashtags,
        ortBeschreibung: ortBeschreibung.trim() || undefined,
        bild,
        datum: art === 'veranstaltung' ? datum || undefined : undefined,
        preis: art === 'angebot' ? preis || undefined : undefined,
      });
    } finally { setBusy(false); }
  }

  // Escape schliesst
  useEffect(() => {
    function aufEsc(e: KeyboardEvent) { if (e.key === 'Escape') onAbbrechen(); }
    window.addEventListener('keydown', aufEsc);
    return () => window.removeEventListener('keydown', aufEsc);
  }, [onAbbrechen]);

  return (
    <div className="karte-modal-overlay" onClick={onAbbrechen}>
      <div className="karte-modal" role="dialog" onClick={e => e.stopPropagation()}>
        <header className="karte-modal-kopf">
          <h2>
            <span
              className="karte-panel-symbol"
              style={{ background: pinArtFarbe(art), color: 'white' }}
            >{pinArtSymbol(art)}</span>
            Neue {pinArtLabel(art)}
          </h2>
          <button className="karte-panel-x" onClick={onAbbrechen}>×</button>
        </header>
        <div className="karte-modal-koerper">
          <label className="karte-feld">
            <span>Titel</span>
            <input value={titel} onChange={e => setTitel(e.target.value)} autoFocus placeholder="Kurz und treffend" />
          </label>
          {art === 'veranstaltung' && (
            <label className="karte-feld">
              <span>Datum & Uhrzeit</span>
              <input type="datetime-local" value={datum} onChange={e => setDatum(e.target.value)} />
            </label>
          )}
          <label className="karte-feld">
            <span>Ort (Adresse, frei beschrieben)</span>
            <input
              value={ortBeschreibung}
              onChange={e => setOrtBeschreibung(e.target.value)}
              placeholder="z.B. Stadtgarten Kassel, Wilhelmshöher Allee 12"
            />
            <span className="karte-koords">Pin sitzt bei {lat.toFixed(5)}, {lng.toFixed(5)}</span>
          </label>
          <label className="karte-feld">
            <span>Beschreibung (Markdown)</span>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              placeholder="Was wartet hier? Verweise auf Pflanzen wie [Tomate](pflanze:tomate) gehen."
            />
          </label>
          <div className="karte-feld">
            <span>Bild (optional)</span>
            <div className="karte-bild-wahl">
              {bild ? (
                <div className="karte-bild-vorschau">
                  <img src={bild} alt="" />
                  <button type="button" className="karte-bild-loeschen" onClick={() => setBild(undefined)}>×</button>
                </div>
              ) : (
                <button type="button" className="karte-bild-knopf" onClick={() => bildEingabe.current?.click()}>
                  Bild wählen
                </button>
              )}
              <input
                ref={bildEingabe}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { bildWaehlen(e.target.files?.[0]); e.target.value = ''; }}
              />
            </div>
          </div>
          {art === 'angebot' && (
            <label className="karte-feld">
              <span>Preis / Tausch (optional)</span>
              <input
                value={preis}
                onChange={e => setPreis(e.target.value)}
                placeholder="z.B. 2 EUR/kg oder Tausch gegen Saatgut"
              />
            </label>
          )}
          <div className="karte-feld">
            <span>Hashtags</span>
            <HashtagEingabe tags={hashtags} onChange={setHashtags} platzhalter="z.B. tomate, saatgut" />
          </div>
        </div>
        <footer className="karte-modal-fuss">
          <button className="karte-knopf-zweit" onClick={onAbbrechen} disabled={busy}>Abbrechen</button>
          <button className="karte-knopf-primary" onClick={speichern} disabled={!istGueltig || busy}>
            {busy ? 'Lege Pin …' : 'Pin setzen'}
          </button>
        </footer>
      </div>
    </div>
  );
}

// === Pin-Detail-Panel ===

function PinDetailPanel({
  pin, istMeiner, onSchliessen, onLoeschen, onProfil,
}: {
  pin: Pin;
  istMeiner: boolean;
  onSchliessen: () => void;
  onLoeschen: () => void;
  onProfil?: () => void;
}) {
  return (
    <aside className="karte-panel karte-panel-detail" role="dialog">
      <header className="karte-panel-kopf">
        <h2>
          <span
            className="karte-panel-symbol"
            style={{ background: pinArtFarbe(pin.art), color: 'white' }}
          >{pinArtSymbol(pin.art)}</span>
          {pin.titel}
        </h2>
        <button className="karte-panel-x" onClick={onSchliessen}>×</button>
      </header>
      <div className="karte-panel-koerper">
        {pin.bild && (
          <div className="karte-detail-bild">
            <img src={pin.bild} alt="" />
          </div>
        )}
        <p className="karte-meta-zeile">
          <span className="karte-art-tag" style={{ background: pinArtFarbe(pin.art), color: 'white' }}>
            {pinArtLabel(pin.art)}
          </span>
          <span>von {pin.autorName}</span>
        </p>
        {pin.datum && (
          <p className="karte-detail-datum">{new Date(pin.datum).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' })}</p>
        )}
        {pin.ortBeschreibung && (
          <p className="karte-detail-ort">📍 {pin.ortBeschreibung}</p>
        )}
        {pin.preis && (
          <p className="karte-detail-preis"><strong>{pin.preis}</strong></p>
        )}
        {pin.text && (
          <div className="karte-detail-text">
            <MarkdownText text={pin.text} />
          </div>
        )}
        {pin.hashtags.length > 0 && (
          <div className="karte-detail-hashtags">
            {pin.hashtags.map(t => <span key={t} className="karte-hashtag">#{t}</span>)}
          </div>
        )}
      </div>
      <footer className="karte-panel-fuss">
        {onProfil && (
          <button className="karte-knopf-zweit" onClick={onProfil}>Mein Profil bearbeiten</button>
        )}
        {istMeiner && (
          <button className="karte-knopf-loeschen" onClick={onLoeschen}>Pin löschen</button>
        )}
        <button className="karte-knopf-zweit" onClick={onSchliessen}>Schließen</button>
      </footer>
    </aside>
  );
}
