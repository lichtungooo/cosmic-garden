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

// === Pin-Icon: kleines menschliches Symbol fuer Gaertner-Pins ===
// Klein gehalten, weil viele Pins auf der Karte erwartet werden.

function pinIcon(_art: PinArt, fokus: boolean = false): L.DivIcon {
  const farbe = pinArtFarbe('gaertner');
  const size = fokus ? 30 : 24;
  const html = `
    <div class="garten-pin ${fokus ? 'fokus' : ''}" style="--pin-farbe:${farbe};width:${size}px;height:${size}px">
      <svg viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" fill="${farbe}" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="garten-pin-figur">
        <circle cx="12" cy="7" r="3.5"/>
        <path d="M5 22 C 5 16 8 13 12 13 C 16 13 19 16 19 22 Z"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'garten-pin-wrap',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
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

  return (
    <div className="karte-view">
      <div className="karte-buehne">
        <div ref={containerRef} className="karte-leinwand" />

        {/* Einfacher Knopf unten rechts — eigenes Profil auf die Karte setzen */}
        <button
          type="button"
          className="karte-profil-knopf"
          onClick={profilPinSetzen}
          title={meinProfilPin ? 'Profil-Pin aktualisieren' : 'Mein Profil auf die Karte'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="white" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 22 C 5 16 8 13 12 13 C 16 13 19 16 19 22 Z" />
          </svg>
          <span>{meinProfilPin ? 'Mein Pin aktualisieren' : 'Mich auf die Karte setzen'}</span>
        </button>

        {/* RLN-Hinweis links unten */}
        <div className="karte-rln-hinweis">
          <strong>Garten ist die Vorstufe</strong>
          <span>Marktplatz, Veranstaltungen und Gemeinschaftsgärten kommen im Real Life Network — bald.</span>
        </div>

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
          {istMeiner ? 'Mein Profil bearbeiten →' : 'Zum Profil →'}
        </button>
      </div>
    </aside>
  );
}
