import { thunTypFarbe, thunTypLabel } from '../lib/moon';
import { findeEintrag, SEKTIONEN, type WissenEintrag } from '../lib/wissen';
import { useOeffneWissen } from '../lib/wissen-context';
import { MarkdownText } from './MarkdownText';

const VS_TEXT = String.fromCharCode(0xFE0E);

interface Props {
  eintrag: WissenEintrag;
}

export function WissenEintragView({ eintrag }: Props) {
  const farbe = eintrag.meta?.thunTyp ? thunTypFarbe(eintrag.meta.thunTyp) : 'var(--accent)';
  const oeffneWissen = useOeffneWissen();

  const verwandtEintraege = (eintrag.verwandt ?? [])
    .map(v => {
      const e = findeEintrag(v.sektion, v.eintrag);
      const s = SEKTIONEN.find(s => s.id === v.sektion);
      return e && s ? { ...v, e, sektionName: s.name } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  return (
    <article className="wissen-eintrag-detail">
      <header className="wissen-eintrag-kopf" style={{ borderTopColor: farbe }}>
        <div className="wissen-eintrag-titel">
          <span className="wissen-eintrag-symbol zodiak-glyph">
            {eintrag.symbol ? eintrag.symbol + VS_TEXT : ''}
          </span>
          <div>
            <h1>{eintrag.name}</h1>
            {eintrag.untertitel && <p className="wissen-eintrag-untertitel">{eintrag.untertitel}</p>}
          </div>
        </div>
        {eintrag.meta && (
          <dl className="wissen-eintrag-meta-dl">
            {eintrag.meta.element && <><dt>Element</dt><dd>{eintrag.meta.element}</dd></>}
            {eintrag.meta.thunTyp && <><dt>Tagestyp</dt><dd style={{ color: farbe, fontWeight: 600 }}>{thunTypLabel(eintrag.meta.thunTyp)}</dd></>}
            {eintrag.meta.sonneSidVon && <><dt>Sonne siderisch</dt><dd>{eintrag.meta.sonneSidVon} – {eintrag.meta.sonneSidBis}</dd></>}
            {eintrag.meta.sonneTropVon && <><dt>Sonne tropisch</dt><dd>{eintrag.meta.sonneTropVon} – {eintrag.meta.sonneTropBis}</dd></>}
          </dl>
        )}
      </header>

      <p className="wissen-eintrag-kurz">{eintrag.kurz}</p>

      <div className="wissen-eintrag-bloecke">
        {eintrag.bloecke.map(b => (
          <section key={b.titel} className="wissen-block">
            <h2>{b.titel}</h2>
            <MarkdownText text={b.text} />
          </section>
        ))}
      </div>

      {eintrag.pflanzen && eintrag.pflanzen.length > 0 && (
        <section className="wissen-pflanzen">
          <h2>Pflanzen-Bezug</h2>
          <ul>
            {eintrag.pflanzen.map(p => <li key={p}>{p}</li>)}
          </ul>
        </section>
      )}

      {verwandtEintraege.length > 0 && (
        <section className="wissen-verwandt">
          <h2>Verwandt</h2>
          <div className="wissen-verwandt-grid">
            {verwandtEintraege.map(v => {
              const vFarbe = v.e.meta?.thunTyp ? thunTypFarbe(v.e.meta.thunTyp) : 'var(--line-strong)';
              return (
                <button
                  key={`${v.sektion}-${v.eintrag}`}
                  className="wissen-verwandt-karte"
                  style={{ borderLeftColor: vFarbe }}
                  onClick={() => oeffneWissen?.(v.sektion, v.eintrag)}
                >
                  <span className="wissen-verwandt-sektion">{v.sektionName}</span>
                  <span className="wissen-verwandt-symbol zodiak-glyph">{v.e.symbol ? v.e.symbol + VS_TEXT : '·'}</span>
                  <span className="wissen-verwandt-name">{v.e.name}</span>
                  <span className="wissen-verwandt-kurz">{v.e.kurz}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
