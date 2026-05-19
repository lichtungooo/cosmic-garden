// Modal "Unter Freunden" — drei Tabs: Freundeskreis · Recht · Datenschutz.
// Stellt den Garten in den Rahmen des Internationalen Privatrechts.
// Erreichbar über den Footer der App.

import { useState, useEffect } from 'react';

type Tab = 'freundeskreis' | 'recht' | 'datenschutz';

interface Props {
  offen: boolean;
  onSchliessen: () => void;
  startTab?: Tab;
}

export function FreundeskreisModal({ offen, onSchliessen, startTab = 'freundeskreis' }: Props) {
  const [tab, setTab] = useState<Tab>(startTab);

  useEffect(() => {
    if (offen) setTab(startTab);
  }, [offen, startTab]);

  useEffect(() => {
    if (!offen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onSchliessen();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [offen, onSchliessen]);

  if (!offen) return null;

  return (
    <>
      <div className="fk-overlay" onClick={onSchliessen} />
      <div className="fk-modal" role="dialog" aria-modal="true" aria-label="Unter Freunden">
        <header className="fk-kopf">
          <h2>Unter Freunden</h2>
          <button
            type="button"
            className="fk-schliessen"
            onClick={onSchliessen}
            aria-label="Schließen"
          >×</button>
        </header>

        <nav className="fk-tabs">
          <button
            type="button"
            className={`fk-tab ${tab === 'freundeskreis' ? 'aktiv' : ''}`}
            onClick={() => setTab('freundeskreis')}
          >Freundeskreis</button>
          <button
            type="button"
            className={`fk-tab ${tab === 'recht' ? 'aktiv' : ''}`}
            onClick={() => setTab('recht')}
          >Recht</button>
          <button
            type="button"
            className={`fk-tab ${tab === 'datenschutz' ? 'aktiv' : ''}`}
            onClick={() => setTab('datenschutz')}
          >Datenschutz</button>
        </nav>

        <div className="fk-koerper">
          {tab === 'freundeskreis' && <TabFreundeskreis />}
          {tab === 'recht' && <TabRecht />}
          {tab === 'datenschutz' && <TabDatenschutz />}
        </div>
      </div>
    </>
  );
}

function TabFreundeskreis() {
  return (
    <>
      <p className="fk-lead">
        Mein kosmischer Garten ist kein Forum, kein soziales Netz. Er ist ein
        Freundeskreis von Gärtnern, in dem Erfahrungswissen, Beobachtungen und
        Verbindungen unter echten Menschen geteilt werden — persönlich, auf
        Vertrauensbasis, ohne kommerziellen Rahmen.
      </p>

      <FkSektion titel="Warum agieren wir so?">
        <p>
          Seit Jahrtausenden geben Gärtner ihr Wissen Hand zu Hand weiter. Was
          als Erfahrungswissen von Mensch zu Mensch wandert, braucht keinen
          Server, keinen Algorithmus, keine Werbeplattform — es braucht
          Vertrauen, echte Begegnung und die Bereitschaft, einander
          wertzuschätzen.
        </p>
        <p>
          Im Freundeskreis gibt es keine Kunden und keine Anbieter. Es gibt
          Menschen, die einander kennen, sich begegnet sind und füreinander
          einstehen. Wissen wird nicht verkauft, sondern geschenkt — als
          Geste der Wertschätzung gegenüber denen, die nach uns kommen.
        </p>
      </FkSektion>

      <FkSektion titel="Web of Trust — die technische Grundlage">
        <p>
          Beim Anmelden bekommst du <strong>zwölf Wörter</strong>. Sie sind
          dein Schlüssel — niemand sonst kann darauf zugreifen, nicht mal wir.
          Schreib sie auf, verwahr sie an einem sicheren Ort. Vergrab sie im
          Garten unter deinem Lieblingsbeet, wenn du magst.
        </p>
        <p>
          Dein Profil, deine Beobachtungen, deine Begegnungen bleiben bei dir.
          Sie wandern E2E-verschlüsselt zwischen deinen Geräten und denen
          deiner Vertrauten — niemals über einen zentralen Server. Das ist
          <strong> Selbstbestimmung</strong> statt Server-Abhängigkeit.
        </p>
      </FkSektion>

      <div className="fk-prinzipien">
        <FkPrinzip
          symbol="🤝"
          titel="Reale Begegnung"
          text="Verbindungen entstehen durch Handshake — auf dem Markt, im Garten, am Zaun. Kein Konto-Zwang, keine anonyme Registrierung."
        />
        <FkPrinzip
          symbol="🌱"
          titel="Freiwilliges Teilen"
          text="Wissen, Pflanzen, Saatgut, Zeit. Was geschenkt wird, bleibt Geschenk. Kein Preis, kein Abo, keine Pflicht."
        />
        <FkPrinzip
          symbol="🔑"
          titel="Geschlossener Kreis"
          text="Wer mitmachen will, lässt sich von einem bestehenden Gärtner einladen. Kein offener Marktplatz, kein anonymer Beitritt."
        />
        <FkPrinzip
          symbol="📖"
          titel="Erfahrungswissen"
          text="Alles stammt aus persönlicher Beobachtung, überlieferten Traditionen (Maria Thun, Demeter, Permakultur) und ehrlicher Recherche."
        />
      </div>

      <p className="fk-zitat">
        "Ein Garten gehört dem, der ihn pflegt — und das Wissen darüber
        gehört denen, die einander vertrauen."
      </p>
    </>
  );
}

function TabRecht() {
  return (
    <>
      <div className="fk-leitkasten">
        <p>
          Der private Austausch unter Freunden ist durch das älteste Rechtssystem
          der Welt geschützt: das <strong>internationale Privatrecht</strong>.
          Wir agieren nicht im Handelsrecht, nicht im Verbraucherrecht und nicht
          im Gewerberecht — sondern im Raum der privaten Vereinbarung zwischen
          souveränen Menschen.
        </p>
      </div>

      <FkSektion titel="Warum internationales Privatrecht?">
        <p>
          Das internationale Privatrecht (IPR) regelt die Rechtsbeziehungen
          zwischen Privatpersonen über Ländergrenzen hinweg. Es ist älter als
          jedes Handelsrecht und schützt die grundlegendste Form menschlicher
          Interaktion: den freiwilligen Austausch unter Gleichen.
        </p>
        <p>
          Indem wir als Freundeskreis agieren — ohne Gewerbe, ohne Handel, ohne
          feste Preise — bewegen wir uns vollständig im Bereich des Privatrechts.
          Das ist kein Schlupfloch, sondern die natürliche Rechtsform des
          menschlichen Miteinanders.
        </p>
      </FkSektion>

      <h3 className="fk-recht-ueberschrift">Deutsches Recht</h3>
      <div className="fk-gesetze">
        <FkGesetz
          paragraph="Art. 2 Abs. 1 GG"
          titel="Allgemeine Handlungsfreiheit (Privatautonomie)"
          beschreibung="Jeder Mensch hat das Recht, seine privaten Angelegenheiten frei zu gestalten — einschließlich des freien Austauschs von Wissen im privaten Kreis. Dieses Grundrecht ist die Basis unseres Handelns."
        />
        <FkGesetz
          paragraph="§ 311 Abs. 1 BGB"
          titel="Vertragsfreiheit"
          beschreibung="Private Vereinbarungen zwischen Freunden sind durch die Vertragsfreiheit geschützt. Form, Inhalt und Gegenleistung bestimmen die Beteiligten selbst. Es besteht keine Formvorschrift."
        />
        <FkGesetz
          paragraph="§ 516 BGB"
          titel="Schenkung"
          beschreibung="Eine Zuwendung ohne vertragliche Gegenleistung gilt als Schenkung. Geteiltes Saatgut, geteiltes Wissen — Geschenk, kein Kauf."
        />
        <FkGesetz
          paragraph="§ 13/14 BGB"
          titel="Verbraucher vs. Unternehmer"
          beschreibung="Wer nicht geschäftsmäßig handelt, ist kein Unternehmer im Sinne des Gesetzes. Im Freundeskreis handeln alle als Privatpersonen. Das Verbraucherschutzrecht (Widerruf, AGB, Gewährleistung) greift daher nicht."
        />
        <FkGesetz
          paragraph="§ 1 GewO"
          titel="Gewerbefreiheit (Umkehrschluss)"
          beschreibung="Die Gewerbeordnung gilt nur für gewerbsmäßige Tätigkeiten. Wer nicht gewerbsmäßig handelt, benötigt keine Gewerbeanmeldung, kein Impressum nach § 5 TMG und keine AGB."
        />
      </div>

      <h3 className="fk-recht-ueberschrift">Internationales Privatrecht</h3>
      <div className="fk-gesetze">
        <FkGesetz
          paragraph="Art. 3 Rom I-VO"
          titel="Freie Rechtswahl"
          beschreibung="Bei grenzüberschreitenden privaten Vereinbarungen können die Beteiligten das anwendbare Recht frei wählen. Der Freundeskreis vereinbart deutsches Privatrecht als Grundlage."
        />
        <FkGesetz
          paragraph="Art. 4 Rom I-VO"
          titel="Mangels Rechtswahl"
          beschreibung="Ohne ausdrückliche Rechtswahl gilt das Recht des Landes, in dem der Leistungserbringer seinen gewöhnlichen Aufenthalt hat — in unserem Fall Deutschland."
        />
        <FkGesetz
          paragraph="Art. 6 Rom I-VO"
          titel="Verbraucherverträge"
          beschreibung="Die besonderen Verbraucherschutzvorschriften greifen NUR bei geschäftsmäßigem Handeln eines Unternehmers gegenüber einem Verbraucher. Da im Freundeskreis alle als Privatpersonen handeln, ist Art. 6 nicht anwendbar."
        />
        <FkGesetz
          paragraph="Art. 3-5 EGBGB"
          titel="Eingangsbestimmungen zum BGB"
          beschreibung="Das deutsche internationale Privatrecht regelt, welches Recht bei Sachverhalten mit Auslandsbezug gilt. Die Privatautonomie wird als höchstes Gut geschützt."
        />
        <FkGesetz
          paragraph="Haager Übereinkommen"
          titel="Internationale Zuständigkeit"
          beschreibung="Für private, nicht-kommerzielle Vereinbarungen gelten vereinfachte Zuständigkeitsregeln. Der Gerichtsstand richtet sich nach dem Wohnsitz der beteiligten Privatpersonen."
        />
        <FkGesetz
          paragraph="UN-Kaufrecht (CISG)"
          titel="Ausschluss"
          beschreibung="Das UN-Kaufrecht gilt nur für gewerbliche Kaufverträge. Da im Freundeskreis keine Kaufverträge geschlossen werden, ist das CISG nicht anwendbar."
        />
      </div>

      <div className="fk-zusammenfassung">
        <p>
          <strong>Zusammengefasst:</strong> Der private Austausch unter Freunden
          ist durch Grundgesetz, BGB und europäisches Recht geschützt. Es gibt
          keine Kaufverträge, keine Gewährleistung und keine Widerrufsrechte —
          weil es sich nicht um Geschäfte handelt, sondern um freiwilligen
          Austausch unter souveränen Privatpersonen auf Vertrauensbasis. Das ist
          der älteste und natürlichste Rechtsrahmen der Menschheit.
        </p>
      </div>
    </>
  );
}

function TabDatenschutz() {
  return (
    <>
      <div className="fk-leitkasten">
        <h3 className="fk-leitkasten-titel">🔒 Deine Privatsphäre ist uns heilig</h3>
        <p>
          Mein kosmischer Garten respektiert deine Privatsphäre vollständig.
          Wir tracken nichts, wir analysieren nichts, wir verkaufen nichts. Punkt.
        </p>
      </div>

      <div className="fk-ds-liste">
        <FkDsCard typ="nein" titel="Keine Cookies"
          text="Diese Webseite setzt keine Cookies — weder eigene noch von Drittanbietern. Kein Cookie-Banner nötig, weil es keine Cookies gibt."
        />
        <FkDsCard typ="nein" titel="Kein Tracking"
          text="Kein Google Analytics, kein Facebook Pixel, kein Matomo, kein Hotjar — gar nichts. Wir wissen nicht, woher du kommst oder was du klickst."
        />
        <FkDsCard typ="nein" titel="Keine Werbung"
          text="Keine Werbeanzeigen, keine Affiliate-Links, keine gesponserten Inhalte. Alles hier dient dem Wissensaustausch, nicht dem Profit."
        />
        <FkDsCard typ="nein" titel="Keine Weitergabe"
          text="Deine Daten werden an niemanden weitergegeben — nicht an Behörden, nicht an Werbepartner, nicht an Dritte."
        />
        <FkDsCard typ="nein" titel="Keine serverseitige Speicherung"
          text="Dein Profil, deine Beobachtungen und deine Pins leben in deinem Browser. Die Synchronisation läuft E2E-verschlüsselt über das Web of Trust — niemals über einen zentralen Server."
        />
        <FkDsCard typ="ja" titel="SSL-Verschlüsselung"
          text="Die gesamte Verbindung ist per SSL/TLS verschlüsselt. Niemand kann mitlesen."
        />
        <FkDsCard typ="ja" titel="Lokale Datenspeicherung"
          text="Dein Profil, Tagebuch und Karten-Pins werden ausschließlich lokal in deinem Browser (IndexedDB) gespeichert. Du hast die volle Kontrolle und kannst alles jederzeit löschen."
        />
        <FkDsCard typ="ja" titel="Mnemonic-basiert"
          text="Deine zwölf Wörter sind dein einziger Schlüssel. Niemand kann sie sehen, nicht mal wir. Wenn du sie verlierst, kommt niemand mehr an deine Daten — also gut aufbewahren."
        />
        <FkDsCard typ="ja" titel="Quelloffener Code"
          text="Der gesamte Code dieser Webseite ist öffentlich einsehbar auf github.com/lichtungooo/cosmic-garden. Du kannst selbst prüfen, dass wir halten, was wir versprechen."
        />
      </div>

      <div className="fk-zusammenfassung">
        <p>
          <strong>Dein Recht (DSGVO):</strong> Da wir keine personenbezogenen
          Daten serverseitig verarbeiten, entfallen die meisten DSGVO-Pflichten.
          Deine lokal gespeicherten Daten kannst du jederzeit selbst löschen
          (Browser-Daten leeren). Art. 17 DSGVO (Recht auf Löschung) wird damit
          automatisch erfüllt. Es gibt keinen Verantwortlichen im Sinne von Art.
          4 Nr. 7 DSGVO, weil keine Verarbeitung stattfindet.
        </p>
      </div>
    </>
  );
}

// ===== Helfer =====

function FkSektion({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="fk-sektion">
      <h3>{titel}</h3>
      <div className="fk-sektion-text">{children}</div>
    </section>
  );
}

function FkPrinzip({ symbol, titel, text }: { symbol: string; titel: string; text: string }) {
  return (
    <div className="fk-prinzip">
      <span className="fk-prinzip-symbol">{symbol}</span>
      <h4>{titel}</h4>
      <p>{text}</p>
    </div>
  );
}

function FkGesetz({ paragraph, titel, beschreibung }: { paragraph: string; titel: string; beschreibung: string }) {
  return (
    <div className="fk-gesetz">
      <span className="fk-gesetz-paragraph">{paragraph}</span>
      <div className="fk-gesetz-inhalt">
        <h4>{titel}</h4>
        <p>{beschreibung}</p>
      </div>
    </div>
  );
}

function FkDsCard({ typ, titel, text }: { typ: 'ja' | 'nein'; titel: string; text: string }) {
  return (
    <div className="fk-ds-card">
      <span className={`fk-ds-marker fk-ds-marker-${typ}`}>
        {typ === 'ja' ? '✓' : '✕'}
      </span>
      <div>
        <h4>{titel}</h4>
        <p>{text}</p>
      </div>
    </div>
  );
}
