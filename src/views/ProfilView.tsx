// Profil-Voll-Seite. Erreichbar über Avatar-Klick.
// - Name + Bio + Avatar -> Antons WoT-Doc (updateMyProfile)
// - Alles andere -> garten-profil-extension Item
// - Sichtbarkeits-Wahl pro Abschnitt (öffentlich | kontakte | nur-ich)

import { useEffect, useMemo, useState } from 'react';
import {
  useConnector,
  useCurrentUser,
  useContacts,
} from '@real-life-stack/toolkit';
import { hasProfile } from '@real-life-stack/data-interface';
import { useMeinProfil, type GartenProfil, type Sichtbarkeit, type SichtbarkeitsMap } from '../lib/profil';
import { useMeineGaertnerPin, usePinAktionen } from '../lib/karte';
import { HashtagEingabe } from '../components/HashtagEingabe';
import { BilderUpload } from '../components/BilderUpload';
import { useTagebuch, artLabel, artFarbe, type TagebuchArt } from '../lib/tagebuch';
import { MarkdownText } from '../components/MarkdownText';

interface Props {
  onTagebuch: () => void;
  onKarte: () => void;
  onVerifizieren: () => void;
  onKontakte: () => void;
}

export function ProfilView({ onTagebuch, onKarte, onVerifizieren, onKontakte }: Props) {
  const connector = useConnector();
  const { data: user } = useCurrentUser();
  const { profil, speichere } = useMeinProfil();
  const { activeContacts } = useContacts();

  // === Lokaler Bearbeitungs-Zustand (Auto-Save on blur/aenderung) ===
  const [name, setName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatarUrl);
  const [werk, setWerk] = useState<GartenProfil>(profil);
  const [meldung, setMeldung] = useState<string | null>(null);

  useEffect(() => { setName(user?.displayName ?? ''); setAvatar(user?.avatarUrl); }, [user?.displayName, user?.avatarUrl]);
  useEffect(() => { setWerk(profil); }, [profil]);

  // Bio nachladen aus Antons doc.profile
  useEffect(() => {
    let alive = true;
    if (!hasProfile(connector)) return;
    connector.getMyProfile().then(item => {
      if (!alive || !item) return;
      const d = item.data as Record<string, unknown>;
      if (typeof d.bio === 'string') setBio(d.bio);
    });
    return () => { alive = false; };
  }, [connector]);

  async function meldungZeigen(text: string) {
    setMeldung(text);
    setTimeout(() => setMeldung(null), 1800);
  }

  async function speichereMaster() {
    if (!hasProfile(connector)) return;
    await connector.updateMyProfile({ name: name.trim(), bio: bio.trim(), avatar });
    meldungZeigen('Gespeichert');
  }

  async function speichereExtra(patch: Partial<GartenProfil>) {
    const next = { ...werk, ...patch, sichtbarkeit: { ...werk.sichtbarkeit, ...(patch.sichtbarkeit ?? {}) } };
    setWerk(next);
    await speichere(patch);
    meldungZeigen('Gespeichert');
  }

  function setzeSicht(feld: keyof SichtbarkeitsMap, wert: Sichtbarkeit) {
    speichereExtra({ sichtbarkeit: { [feld]: wert } });
  }

  // === Avatar-Upload ===
  async function avatarHochladen(file: File) {
    const url = URL.createObjectURL(file);
    try {
      const bild = await new Promise<HTMLImageElement>((res, rej) => {
        const b = new Image();
        b.onload = () => res(b);
        b.onerror = rej;
        b.src = url;
      });
      const skala = Math.min(1, 320 / Math.max(bild.naturalWidth, bild.naturalHeight));
      const w = Math.max(1, Math.round(bild.naturalWidth * skala));
      const h = Math.max(1, Math.round(bild.naturalHeight * skala));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(bild, 0, 0, w, h);
      const daten = c.toDataURL('image/jpeg', 0.82);
      setAvatar(daten);
      if (hasProfile(connector)) {
        await connector.updateMyProfile({ name: name.trim(), bio: bio.trim(), avatar: daten });
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const kuerzel = (name || user?.id || '?').slice(0, 2).toUpperCase();

  return (
    <div className="profil-seite">
      <header className="profil-seite-kopf">
        <div className="profil-avatar-block">
          <label className="profil-avatar-wahl">
            {avatar ? (
              <img src={avatar} alt="" className="profil-avatar-bild" />
            ) : (
              <span className="profil-avatar-kuerzel">{kuerzel}</span>
            )}
            <span className="profil-avatar-hinweis">Bild wählen</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) avatarHochladen(f); e.target.value = ''; }}
            />
          </label>
        </div>
        <div className="profil-name-block">
          <span className="profil-eyebrow">Mein Garten</span>
          <input
            className="profil-name-eingabe"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={speichereMaster}
            placeholder="Dein Gartenname"
          />
          <p className="profil-meta">
            {activeContacts.length} verbundene Gärtner
            {werk.standort && <> · {werk.standort}</>}
          </p>
        </div>
        {meldung && <span className="profil-meldung">{meldung}</span>}
      </header>

      <Abschnitt
        titel="Über mich"
        feld="bio"
        sichtbarkeit={werk.sichtbarkeit.bio}
        onSichtbarkeit={setzeSicht}
      >
        <textarea
          className="profil-textarea"
          value={bio}
          onChange={e => setBio(e.target.value)}
          onBlur={speichereMaster}
          placeholder="Wer du bist, was dich treibt, woran dein Herz hängt. Markdown geht."
          rows={3}
        />
      </Abschnitt>


      <Abschnitt
        titel="Begabungen"
        feld="begabungen"
        sichtbarkeit={werk.sichtbarkeit.begabungen}
        onSichtbarkeit={setzeSicht}
        beschreibung="Was du gut kannst, gerne weitergibst, anbietest. Klein tippen, Enter."
      >
        <HashtagEingabe
          tags={werk.begabungen}
          onChange={(begabungen) => speichereExtra({ begabungen })}
          platzhalter="z.B. tomate-ziehen, mulchen, samen-tausch"
          farbe="#4a8a3a"
        />
      </Abschnitt>

      <Abschnitt
        titel="Bedürfnisse"
        feld="beduerfnisse"
        sichtbarkeit={werk.sichtbarkeit.beduerfnisse}
        onSichtbarkeit={setzeSicht}
        beschreibung="Wonach du gerade suchst, wo du Hilfe gebrauchen könntest."
      >
        <HashtagEingabe
          tags={werk.beduerfnisse}
          onChange={(beduerfnisse) => speichereExtra({ beduerfnisse })}
          platzhalter="z.B. schneckenhilfe, gartenbau-tipps"
          farbe="#c0432f"
        />
      </Abschnitt>

      <Abschnitt
        titel="Auf der Karte"
        feld="ort"
        sichtbarkeit={werk.sichtbarkeit.ort}
        onSichtbarkeit={setzeSicht}
        beschreibung="Zeig dich auf der Karte, damit andere Gärtner sehen, wo du in etwa bist. Dein genauer Ort bleibt bei dir — nur die ungefähre Position erscheint als Pin."
      >
        <AufKarteZeigen
          name={name}
          standort={werk.standort}
          onZurKarte={onKarte}
        />
      </Abschnitt>

      <Abschnitt
        titel="Kontakt"
        feld="kontakt"
        sichtbarkeit={werk.sichtbarkeit.kontakt}
        onSichtbarkeit={setzeSicht}
        beschreibung="Per Telegram. Wenn du eine Garten-Gruppe verlinkst, kannst du Tagebuch-Einträge direkt dort teilen."
      >
        <div className="profil-felder-grid">
          <label className="profil-feldzeile">
            <span>Telegram-Handle</span>
            <input
              value={werk.telegramHandle}
              onChange={e => setWerk({ ...werk, telegramHandle: e.target.value.replace(/^@/, '') })}
              onBlur={() => speichereExtra({ telegramHandle: werk.telegramHandle })}
              placeholder="dein.handle"
            />
          </label>
          <label className="profil-feldzeile">
            <span>Telegram-Gruppe (optional)</span>
            <input
              value={werk.telegramGruppe}
              onChange={e => setWerk({ ...werk, telegramGruppe: e.target.value })}
              onBlur={() => speichereExtra({ telegramGruppe: werk.telegramGruppe })}
              placeholder="https://t.me/..."
            />
          </label>
        </div>
      </Abschnitt>

      <Abschnitt
        titel="Garten-Bilder"
        feld="bilder"
        sichtbarkeit={werk.sichtbarkeit.bilder}
        onSichtbarkeit={setzeSicht}
        beschreibung="Was bei dir wächst. Werden klein gerechnet, damit der Garten leicht bleibt."
      >
        <BilderUpload
          bilder={werk.bilder}
          onChange={(bilder) => speichereExtra({ bilder })}
        />
      </Abschnitt>

      <Abschnitt
        titel="Mein Tagebuch"
        feld="tagebuch"
        sichtbarkeit={werk.sichtbarkeit.tagebuch}
        onSichtbarkeit={setzeSicht}
        beschreibung="Beobachtungen, Aussaaten, Ernten. Standard: nur du siehst es."
      >
        <TagebuchVorschau onAuf={onTagebuch} />
      </Abschnitt>

      <section className="profil-abschnitt">
        <header className="profil-abschnitt-kopf">
          <h2 className="profil-abschnitt-titel">Verbundene Gärtner</h2>
        </header>
        <p className="profil-text-leise">
          Menschen, denen du im echten Leben begegnet bist und mit denen du den Schlüssel
          getauscht hast. {activeContacts.length} verbunden.
        </p>
        {activeContacts.length === 0 ? (
          <p className="profil-text-leise">
            Noch niemand verbunden. Im echten Leben begegnen, QR-Code tauschen.
          </p>
        ) : (
          <ul className="profil-kontakt-liste">
            {activeContacts.map(c => (
              <li key={c.id} className="profil-kontakt-eintrag">
                <span className="profil-kontakt-name">{c.name ?? c.id.slice(-6)}</span>
                <span className="profil-kontakt-marke">verbunden</span>
              </li>
            ))}
          </ul>
        )}
        <div className="profil-knopf-reihe">
          <button className="profil-aktion-zweit" onClick={onKontakte}>Alle Kontakte</button>
          <button className="profil-aktion-primary" onClick={onVerifizieren}>Neuen Gärtner verbinden</button>
        </div>
      </section>

    </div>
  );
}

// === Abschnitt-Wrapper mit Sichtbarkeits-Wahl ===

function Abschnitt({
  titel,
  feld,
  beschreibung,
  sichtbarkeit,
  onSichtbarkeit,
  children,
}: {
  titel: string;
  feld: keyof SichtbarkeitsMap;
  beschreibung?: string;
  sichtbarkeit?: Sichtbarkeit;
  onSichtbarkeit: (feld: keyof SichtbarkeitsMap, wert: Sichtbarkeit) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="profil-abschnitt">
      <header className="profil-abschnitt-kopf">
        <h2 className="profil-abschnitt-titel">{titel}</h2>
        <SichtbarkeitsWahl
          wert={sichtbarkeit ?? 'oeffentlich'}
          onChange={(w) => onSichtbarkeit(feld, w)}
        />
      </header>
      {beschreibung && <p className="profil-text-leise">{beschreibung}</p>}
      {children}
    </section>
  );
}

function SichtbarkeitsWahl({ wert, onChange }: { wert: Sichtbarkeit; onChange: (w: Sichtbarkeit) => void }) {
  const optionen: { id: Sichtbarkeit; label: string; symbol: string; hinweis: string }[] = [
    { id: 'oeffentlich', label: 'Welt', symbol: '◉', hinweis: 'Jeder sieht es' },
    { id: 'kontakte',    label: 'Kontakte', symbol: '◐', hinweis: 'Nur verbundene Gärtner' },
    { id: 'nur-ich',     label: 'Nur ich', symbol: '○', hinweis: 'Privat' },
  ];
  return (
    <div className="sicht-wahl" role="group" aria-label="Sichtbarkeit">
      {optionen.map(o => (
        <button
          key={o.id}
          type="button"
          className={`sicht-knopf ${wert === o.id ? 'aktiv' : ''}`}
          onClick={() => onChange(o.id)}
          title={o.hinweis}
        >
          <span className="sicht-symbol" aria-hidden="true">{o.symbol}</span>
          <span className="sicht-label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// === Tagebuch-Vorschau ===

function TagebuchVorschau({ onAuf }: { onAuf: () => void }) {
  const { eintraege } = useTagebuch();
  const letzte = useMemo(
    () => eintraege.slice().sort((a, b) => b.erstellt - a.erstellt).slice(0, 5),
    [eintraege],
  );

  if (letzte.length === 0) {
    return (
      <div className="profil-leer-block">
        <p>Noch kein Tagebuch-Eintrag. Beobachte, säe, ernte — und halte es fest.</p>
        <button className="profil-aktion-primary" onClick={onAuf}>Erster Eintrag</button>
      </div>
    );
  }

  return (
    <div>
      <ul className="profil-tagebuch-liste">
        {letzte.map(e => (
          <li key={e.id} className="profil-tagebuch-eintrag">
            <span
              className="profil-tagebuch-art"
              style={{ background: artFarbe(e.art), color: 'white' }}
            >{artLabel(e.art as TagebuchArt)}</span>
            <span className="profil-tagebuch-datum">{formatDatum(e.datum)}</span>
            <p className="profil-tagebuch-text">{e.text.slice(0, 200)}{e.text.length > 200 ? '…' : ''}</p>
          </li>
        ))}
      </ul>
      <div className="profil-knopf-reihe">
        <button className="profil-aktion-zweit" onClick={onAuf}>Volles Tagebuch</button>
      </div>
    </div>
  );
}

function formatDatum(iso: string): string {
  const [j, m, t] = iso.split('-').map(Number);
  if (!j || !m || !t) return iso;
  return `${t.toString().padStart(2,'0')}.${m.toString().padStart(2,'0')}.${j}`;
}

// === Auf-Karte-Zeigen ===

function AufKarteZeigen({ name, standort, onZurKarte }: { name: string; standort: string; onZurKarte: () => void }) {
  const meinPin = useMeineGaertnerPin();
  const aktionen = usePinAktionen();
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function holeStandort(): Promise<{ lat: number; lng: number } | null> {
    if (!navigator.geolocation) {
      setFehler('Dein Browser kann den Standort nicht ermitteln.');
      return null;
    }
    return new Promise((res) => {
      navigator.geolocation.getCurrentPosition(
        p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        e => { setFehler('Standort konnte nicht ermittelt werden: ' + e.message); res(null); },
        { enableHighAccuracy: false, timeout: 8000 },
      );
    });
  }

  async function aufKarte() {
    setFehler(null);
    setBusy(true);
    try {
      const koord = await holeStandort();
      if (!koord) return;
      if (meinPin) {
        await aktionen.aendere(meinPin.id, meinPin, {
          lat: koord.lat,
          lng: koord.lng,
          titel: name || meinPin.titel,
          text: standort ? `Garten in ${standort}.` : meinPin.text,
        });
      } else {
        await aktionen.lege({
          art: 'gaertner',
          titel: name || 'Mein Garten',
          text: standort ? `Garten in ${standort}.` : '',
          lat: koord.lat,
          lng: koord.lng,
          hashtags: [],
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function entfernen() {
    if (!meinPin) return;
    if (!confirm('Deinen Karten-Pin wirklich entfernen?')) return;
    setBusy(true);
    try { await aktionen.loesche(meinPin.id); } finally { setBusy(false); }
  }

  if (meinPin) {
    return (
      <div className="profil-karte-block">
        <div className="profil-karte-status">
          <span className="profil-karte-marker">☘</span>
          <span>Du bist auf der Karte sichtbar — {meinPin.lat.toFixed(4)}, {meinPin.lng.toFixed(4)}</span>
        </div>
        <div className="profil-knopf-reihe">
          <button className="profil-aktion-zweit" onClick={onZurKarte}>Zur Karte</button>
          <button className="profil-aktion-zweit" onClick={aufKarte} disabled={busy}>
            {busy ? 'Aktualisiere …' : 'Standort aktualisieren'}
          </button>
          <button className="profil-aktion-zweit" onClick={entfernen} disabled={busy}>
            Vom Pin entfernen
          </button>
        </div>
        {fehler && <p className="profil-fehler">{fehler}</p>}
      </div>
    );
  }

  return (
    <div className="profil-karte-block">
      <p className="profil-text-leise">
        Lass andere Gärtner sehen, wo du gärtnerst. Der Standort wird einmalig per
        Browser ermittelt. Genauigkeit reicht für die Nachbarschaft, nicht fürs Haustor.
      </p>
      <div className="profil-knopf-reihe">
        <button className="profil-aktion-primary" onClick={aufKarte} disabled={busy}>
          {busy ? 'Setze Pin …' : 'Mich auf der Karte zeigen'}
        </button>
      </div>
      {fehler && <p className="profil-fehler">{fehler}</p>}
    </div>
  );
}

