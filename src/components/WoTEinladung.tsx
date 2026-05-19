// Einladungskarte fuer nicht-angemeldete User. Erklaert, warum die Anmeldung
// wichtig ist — Begegnung in der realen Welt, Vertrauen, Handshake, Phrasen.
// Wird im FragenBlock und KorrekturKnopf gezeigt, wenn jemand mitmachen will.

interface Props {
  zweck: 'frage' | 'antwort' | 'korrektur';
  onAnmelden?: () => void;
}

const ZWECK_LABEL: Record<Props['zweck'], string> = {
  frage:     'Eine Frage stellen',
  antwort:   'Antworten',
  korrektur: 'Einen Hinweis schicken',
};

export function WoTEinladung({ zweck, onAnmelden }: Props) {
  return (
    <div className="wot-einladung">
      <header className="wot-einladung-kopf">
        <h3>{ZWECK_LABEL[zweck]} — dazu meldest du dich an</h3>
      </header>

      <div className="wot-einladung-inhalt">
        <p className="wot-einladung-lead">
          Damit dein Beitrag mit deinem Namen unter dir steht und andere Gärtner
          ihn nachvollziehen können, brauchen wir eine eigene Anmeldung — aber
          <strong> ohne E-Mail, ohne Passwort, ohne Server</strong>.
        </p>

        <div className="wot-einladung-baustein">
          <h4>🌱 Warum überhaupt anmelden?</h4>
          <p>
            Wir bauen an einem Vertrauens-Netzwerk von Gärtnern, die sich in
            der <em>realen Welt</em> begegnen — nicht in einem virtuellen Forum.
            Damit jeder Beitrag, jede Frage, jede Antwort eine Person dahinter
            hat, die du irgendwann auf der Karte sehen, kennenlernen und treffen
            kannst.
          </p>
        </div>

        <div className="wot-einladung-baustein">
          <h4>🤝 Begegnung statt Bildschirm</h4>
          <p>
            Du wirst auf der Karte sehen: <em>"Da ist ja eine Gärtnerin um die Ecke,
            da ist jemand."</em> Du kannst dich mit ihr verbinden, ihren Garten
            besuchen, dich treffen — und beim Handshake wirklich Hand in Hand
            stehen. Das ist die erste Stufe von Vertrauen: Auge in Auge, in der Erde.
          </p>
        </div>

        <div className="wot-einladung-baustein">
          <h4>🔑 Deine Schlüssel-Phrase ist dein Garten-Schlüssel</h4>
          <p>
            Beim Anmelden bekommst du zwölf Wörter. Schreibe sie auf, vergrab sie
            in einer Konservenbüchse unter deinem Lieblingsbeet, leg sie ins
            Erd-Tresor. Wer die Wörter hat, kommt überall an dein Profil — und
            niemand sonst kann es nehmen, nicht mal wir. Das ist Selbstbestimmung:
            <strong> dein Profil gehört dir, nicht einem Server</strong>.
          </p>
        </div>

        <div className="wot-einladung-baustein">
          <h4>✨ Vorstufe zu etwas Größerem</h4>
          <p>
            Was du hier siehst, ist die Vorstufe vom <strong>Real Life Network</strong> —
            einer Bewegung, Menschen über vertraute Netzwerke in der realen Welt
            zusammenzubringen. Garten ist der Anfang. Nachbarschaften, Märkte,
            Werkstätten, Schulen kommen dazu. Alles ohne Tracking, ohne Werbung,
            ohne den ganzen virtuellen Quatsch.
          </p>
        </div>

        {onAnmelden && (
          <div className="wot-einladung-fuss">
            <button
              type="button"
              className="wot-einladung-knopf"
              onClick={onAnmelden}
            >
              Anmelden — zwölf Wörter holen
            </button>
            <p className="wot-einladung-fein">
              Dauert eine Minute. Keine E-Mail nötig, kein Passwort. Du bekommst
              eine Phrase aus zwölf Wörtern — schreib sie auf einen Zettel und
              bewahr sie sicher auf.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
