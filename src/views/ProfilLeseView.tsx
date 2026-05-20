// Profil-Lese-Ansicht. Zeigt das eigene Profil so, wie es nach außen aussieht.
// Zahnrad oben rechts wechselt in den Bearbeiten-Modus.
// Klick auf einen verbundenen Gärtner öffnet (perspektivisch) dessen Profil.

import { useEffect, useState } from 'react';
import {
  useConnector,
  useCurrentUser,
  useContacts,
} from '@real-life-stack/toolkit';
import { hasProfile } from '@real-life-stack/data-interface';
import { useMeinProfil } from '../lib/profil';
import { MarkdownText } from '../components/MarkdownText';

interface Props {
  onBearbeiten: () => void;
  onVerbinden: () => void;
  onKontakte: () => void;
}

export function ProfilLeseView({ onBearbeiten, onVerbinden, onKontakte }: Props) {
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
          <button
            type="button"
            className="profil-lese-qr-badge"
            onClick={onVerbinden}
            title="Verbindung teilen"
            aria-label="Verbindung teilen, QR-Code zeigen"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <rect x="3"  y="3"  width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6"/>
              <rect x="14" y="3"  width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6"/>
              <rect x="3"  y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6"/>
              <rect x="5"  y="5"  width="3" height="3" fill="currentColor"/>
              <rect x="16" y="5"  width="3" height="3" fill="currentColor"/>
              <rect x="5"  y="16" width="3" height="3" fill="currentColor"/>
              <rect x="14" y="14" width="3" height="3" fill="currentColor"/>
              <rect x="19" y="14" width="2" height="2" fill="currentColor"/>
              <rect x="14" y="19" width="2" height="2" fill="currentColor"/>
              <rect x="17" y="17" width="4" height="4" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <div className="profil-lese-haupt">
          <span className="profil-lese-eyebrow">Gärtnerin</span>
          <h1 className="profil-lese-name">{name || 'Ohne Namen'}</h1>
          {bio && (
            <div className="profil-lese-bio">
              <MarkdownText text={bio} />
            </div>
          )}
          {profil.standort && <p className="profil-lese-ort">{profil.standort}</p>}
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
                <img src={b.url} alt="" />
                {b.caption && (
                  <figcaption className="profil-lese-bild-caption">
                    <MarkdownText text={b.caption} />
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {activeContacts.length > 0 && (
        <section className="profil-lese-abschnitt">
          <h2>Verbundene Gärtner</h2>
          <ul className="profil-lese-kontakte">
            {activeContacts.map(c => (
              <li key={c.id} className="profil-lese-kontakt">
                <span className="profil-lese-kontakt-name">{c.name ?? c.id.slice(-6)}</span>
              </li>
            ))}
          </ul>
          <div className="profil-lese-knopf-reihe">
            <button className="profil-aktion-zweit" onClick={onKontakte}>Alle Kontakte</button>
          </div>
        </section>
      )}
    </div>
  );
}
