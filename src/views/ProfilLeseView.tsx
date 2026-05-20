// Profil-Lese-Ansicht. Zeigt das eigene Profil so, wie es nach außen aussieht.
// Zahnrad oben rechts wechselt in den Bearbeiten-Modus.
// Klick auf einen verbundenen Gärtner öffnet (perspektivisch) dessen Profil.

import { useEffect, useMemo, useState } from 'react';
import {
  useConnector,
  useCurrentUser,
  useContacts,
} from '@real-life-stack/toolkit';
import { hasProfile } from '@real-life-stack/data-interface';
import { useMeinProfil } from '../lib/profil';
import { useTagebuch, artLabel, artFarbe, type TagebuchArt } from '../lib/tagebuch';
import { MarkdownText } from '../components/MarkdownText';

interface Props {
  onBearbeiten: () => void;
  onTagebuch: () => void;
  onVerbinden: () => void;
  onKontakte: () => void;
}

export function ProfilLeseView({ onBearbeiten, onTagebuch, onVerbinden, onKontakte }: Props) {
  const connector = useConnector();
  const { data: user } = useCurrentUser();
  const { profil } = useMeinProfil();
  const { activeContacts } = useContacts();
  const [bio, setBio] = useState('');

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

  const name = user?.displayName ?? '';
  const avatar = user?.avatarUrl;
  const kuerzel = (name || user?.id || '?').slice(0, 2).toUpperCase();

  function teilen() {
    const text = `🌱 Mein Garten\n${name}${profil.standort ? ' · ' + profil.standort : ''}${bio ? '\n\n' + bio : ''}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://mein-kosmischer-garten.de')}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="profil-lese">
      <header className="profil-lese-kopf">
        <div className="profil-lese-avatar-block">
          <div className="profil-lese-avatar" aria-label="Profilbild">
            {avatar ? (
              <img src={avatar} alt="" />
            ) : (
              <span className="profil-lese-kuerzel">{kuerzel}</span>
            )}
          </div>
        </div>
        <div className="profil-lese-haupt">
          <span className="profil-lese-eyebrow">Mein Garten</span>
          <h1 className="profil-lese-name">{name || 'Ohne Namen'}</h1>
          {profil.standort && <p className="profil-lese-ort">{profil.standort}</p>}
          {bio && (
            <div className="profil-lese-bio">
              <MarkdownText text={bio} />
            </div>
          )}
        </div>
        <div className="profil-lese-aktionen">
          <button
            type="button"
            className="profil-lese-aktion"
            onClick={teilen}
            title="Profil teilen"
            aria-label="Profil teilen"
          >↗</button>
          <button
            type="button"
            className="profil-lese-aktion"
            onClick={onBearbeiten}
            title="Profil bearbeiten"
            aria-label="Profil bearbeiten"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.03 7.03 0 0 0-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.49.42l-.38 2.65c-.6.25-1.17.58-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.14.24.43.34.69.22l2.49-1c.52.4 1.09.73 1.69.98l.38 2.65c.05.24.25.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65c.6-.25 1.17-.58 1.69-.98l2.49 1c.26.12.55.02.69-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </header>

      {profil.begabungen.length > 0 && (
        <section className="profil-lese-abschnitt">
          <h2>Begabungen</h2>
          <div className="profil-lese-chips">
            {profil.begabungen.map(t => <span key={t} className="profil-lese-chip chip-gabe">#{t}</span>)}
          </div>
        </section>
      )}

      {profil.beduerfnisse.length > 0 && (
        <section className="profil-lese-abschnitt">
          <h2>Bedürfnisse</h2>
          <div className="profil-lese-chips">
            {profil.beduerfnisse.map(t => <span key={t} className="profil-lese-chip chip-bedarf">#{t}</span>)}
          </div>
        </section>
      )}

      {(profil.telegramHandle || profil.telegramGruppe) && (
        <section className="profil-lese-abschnitt">
          <h2>Kontakt</h2>
          <div className="profil-lese-kontakt-knoepfe">
            {profil.telegramHandle && (
              <a
                className="profil-lese-kontakt-knopf"
                href={`https://t.me/${profil.telegramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
              >Telegram · @{profil.telegramHandle}</a>
            )}
            {profil.telegramGruppe && (
              <a
                className="profil-lese-kontakt-knopf zweit"
                href={profil.telegramGruppe}
                target="_blank"
                rel="noopener noreferrer"
              >Garten-Gruppe</a>
            )}
          </div>
        </section>
      )}

      {profil.bilder.length > 0 && (
        <section className="profil-lese-abschnitt">
          <h2>Garten-Bilder</h2>
          <div className="profil-lese-bilder">
            {profil.bilder.map((b, i) => (
              <figure key={i} className="profil-lese-bild">
                <img src={b} alt="" />
              </figure>
            ))}
          </div>
        </section>
      )}

      <TagebuchVorschauLese onAuf={onTagebuch} />

      <section className="profil-lese-abschnitt">
        <h2>Verbundene Gärtner</h2>
        {activeContacts.length === 0 ? (
          <p className="profil-lese-leer">
            Noch niemand verbunden. Im echten Leben begegnen, QR-Code tauschen.
          </p>
        ) : (
          <ul className="profil-lese-kontakte">
            {activeContacts.map(c => (
              <li key={c.id} className="profil-lese-kontakt">
                <span className="profil-lese-kontakt-name">{c.name ?? c.id.slice(-6)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="profil-lese-knopf-reihe">
          {activeContacts.length > 0 && (
            <button className="profil-aktion-zweit" onClick={onKontakte}>Alle Kontakte</button>
          )}
          <button className="profil-aktion-primary" onClick={onVerbinden}>Neuen Gärtner verbinden</button>
        </div>
      </section>
    </div>
  );
}

function TagebuchVorschauLese({ onAuf }: { onAuf: () => void }) {
  const { eintraege } = useTagebuch();
  const letzte = useMemo(
    () => eintraege.slice().sort((a, b) => b.erstellt - a.erstellt).slice(0, 5),
    [eintraege],
  );

  if (letzte.length === 0) {
    return (
      <section className="profil-lese-abschnitt">
        <h2>Mein Tagebuch</h2>
        <p className="profil-lese-leer">Noch kein Eintrag. Beobachte, säe, ernte — und halte es fest.</p>
        <div className="profil-lese-knopf-reihe">
          <button className="profil-aktion-primary" onClick={onAuf}>Erster Eintrag</button>
        </div>
      </section>
    );
  }

  return (
    <section className="profil-lese-abschnitt">
      <h2>Mein Tagebuch</h2>
      <ul className="profil-lese-tagebuch">
        {letzte.map(e => (
          <li key={e.id} className="profil-lese-tagebuch-eintrag">
            <span
              className="profil-lese-tagebuch-art"
              style={{ background: artFarbe(e.art), color: 'white' }}
            >{artLabel(e.art as TagebuchArt)}</span>
            <span className="profil-lese-tagebuch-datum">{formatDatum(e.datum)}</span>
            <p className="profil-lese-tagebuch-text">{e.text.slice(0, 200)}{e.text.length > 200 ? '…' : ''}</p>
          </li>
        ))}
      </ul>
      <div className="profil-lese-knopf-reihe">
        <button className="profil-aktion-zweit" onClick={onAuf}>Volles Tagebuch</button>
      </div>
    </section>
  );
}

function formatDatum(iso: string): string {
  const [j, m, t] = iso.split('-').map(Number);
  if (!j || !m || !t) return iso;
  return `${t.toString().padStart(2,'0')}.${m.toString().padStart(2,'0')}.${j}`;
}
