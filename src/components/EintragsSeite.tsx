// Eine Seite fuer alle Eintrags-Typen — Pflanze, Arbeit, Wissen.
// Gleicher Aufbau: Kopf, Tags, Kurz, Steckbrief (typ-spezifisch), Bloecke, Verwandt.

import type { Eintrag, EintragsTyp, PflanzeEintrag, ArbeitEintrag, WissenEintrag } from '../lib/datenbank';
import { findeEintrag } from '../lib/datenbank-suche';
import { verwandtFuer, beziehungsLabel, type VerwandtTreffer } from '../lib/verwandt';
import { useDetailNav, refAusId } from '../lib/detail-navigation';
import { thunTypFarbe, thunTypLabel } from '../lib/moon';
import { weltAusKategorie, welt } from '../lib/welten';
import { pflanzen as allePflanzen } from '../lib/pflanzen';
import { MarkdownText } from './MarkdownText';

const VS_TEXT = String.fromCharCode(0xFE0E);
const MONATE = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

const TYP_LABEL: Record<EintragsTyp, string> = {
  pflanze: 'Pflanze',
  arbeit:  'Arbeit',
  wissen:  'Wissen',
  frage:   'Frage',
  antwort: 'Antwort',
};

const TYP_FARBE: Record<EintragsTyp, string> = {
  pflanze: '#4a7c3a',
  arbeit:  '#5b3a8a',
  wissen:  '#3b4b6b',
  frage:   '#c89b3a',
  antwort: '#a8423a',
};

interface Props {
  eintragId: string;
}

export function EintragsSeite({ eintragId }: Props) {
  const e = findeEintrag(eintragId);
  if (!e) return <p className="detail-leer">Eintrag nicht gefunden: {eintragId}</p>;

  const weltId = weltAusKategorie(e.kategorie);
  const w = weltId ? welt(weltId) : null;
  const akzent = e.typ === 'pflanze' || e.typ === 'arbeit'
    ? (e.typ === 'pflanze' ? thunTypFarbe(e.pflanze.thunTyp) : thunTypFarbe(e.arbeit.thunEmpfehlung))
    : (e.typ === 'wissen' && e.wissen.thunTyp ? thunTypFarbe(e.wissen.thunTyp) : (w?.farbe ?? TYP_FARBE[e.typ]));

  const verwandt = verwandtFuer(e.id, { maxTreffer: 18 });

  return (
    <article className="eintrag-seite">
      <header className="eintrag-kopf" style={{ borderTopColor: akzent }}>
        <div className="eintrag-kopf-zeile">
          {e.symbol && <span className="eintrag-symbol zodiak-glyph" style={{ color: akzent }}>{e.symbol + VS_TEXT}</span>}
          <div className="eintrag-kopf-haupt">
            <div className="eintrag-typ-badge" style={{ background: TYP_FARBE[e.typ] }}>
              {TYP_LABEL[e.typ]}
            </div>
            <h1>{e.titel}</h1>
            {e.untertitel && <p className="eintrag-untertitel">{e.untertitel}</p>}
            {w && (
              <p className="eintrag-welt-zeile">
                <span className="eintrag-welt-symbol" style={{ color: w.farbe }}>{w.symbol}</span>
                <span style={{ color: w.farbe }}>{w.name}</span>
                {e.kategorie.split('/').slice(1).map((teil, i) => (
                  <span key={i} className="eintrag-pfad-teil"> · {teil}</span>
                ))}
              </p>
            )}
          </div>
        </div>
        {e.tags.length > 0 && (
          <div className="eintrag-tags">
            {e.tags.map(t => <TagChip key={t} tag={t} />)}
          </div>
        )}
      </header>

      <p className="eintrag-kurz">{e.kurz}</p>

      <SteckbriefBlock eintrag={e} akzent={akzent} />

      {e.bloecke.length > 0 && (
        <div className="eintrag-bloecke">
          {e.bloecke.map((b, i) => (
            <section key={`${b.titel}-${i}`} className="eintrag-block">
              <h2>{b.titel}</h2>
              <MarkdownText text={b.text} />
            </section>
          ))}
        </div>
      )}

      {e.typ === 'pflanze' && <MischkulturBlock pflanzeId={e.id.split(':')[1]} />}

      <VerwandtBlock treffer={verwandt} />
    </article>
  );
}

function SteckbriefBlock({ eintrag, akzent }: { eintrag: Eintrag; akzent: string }) {
  let rows: [string, React.ReactNode][] = [];

  if (eintrag.typ === 'pflanze') rows = pflanzenSteckbrief(eintrag);
  else if (eintrag.typ === 'arbeit') rows = arbeitenSteckbrief(eintrag);
  else if (eintrag.typ === 'wissen') rows = wissenSteckbrief(eintrag);

  if (rows.length === 0) return null;

  return (
    <section className="eintrag-block eintrag-steckbrief" style={{ borderLeftColor: akzent }}>
      <h2>Steckbrief</h2>
      <dl className="steckbrief-dl">
        {rows.map(([k, v]) => (
          <div key={k} className="steckbrief-zeile">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function pflanzenSteckbrief(e: PflanzeEintrag): [string, React.ReactNode][] {
  const p = e.pflanze;
  return [
    ['Familie',           p.familie],
    ['Tagestyp',          <span style={{ color: thunTypFarbe(p.thunTyp), fontWeight: 600 }}>{thunTypLabel(p.thunTyp)}</span>],
    ['Vorzucht',          p.vorzuchtVon ? `${datumFmt(p.vorzuchtVon)} bis ${datumFmt(p.vorzuchtBis!)}` : 'keine'],
    ['Auspflanzen/Saat',  `${datumFmt(p.auspflanzenVon)} bis ${datumFmt(p.auspflanzenBis)}`],
    ['Ernte',             `${datumFmt(p.ernteVon)} bis ${datumFmt(p.ernteBis)}`],
    ['Saattiefe',         p.saattiefeCm === 0 ? 'nur andruecken' : `${p.saattiefeCm} cm`],
    ['Keimer',            p.keimerTyp === 'hell' ? 'Lichtkeimer' : p.keimerTyp === 'dunkel' ? 'Dunkelkeimer' : 'indifferent'],
    ['Keimtemperatur',    `${p.keimtempC} °C`],
    ['Keimdauer',         `${p.keimdauerTage} Tage`],
    ['Pflanzabstand',     `${p.pflanzabstandCm} cm`],
  ];
}

function arbeitenSteckbrief(e: ArbeitEintrag): [string, React.ReactNode][] {
  const a = e.arbeit;
  return [
    ['Kategorie',  a.arbeitskategorie],
    ['Tagestyp',   <span style={{ color: thunTypFarbe(a.thunEmpfehlung), fontWeight: 600 }}>{thunTypLabel(a.thunEmpfehlung)}</span>],
    ['Mondphase',  a.mondPhase],
    ['Zeitraum',   `${MONATE[a.vonMonat - 1]} bis ${MONATE[a.bisMonat - 1]}`],
  ];
}

function wissenSteckbrief(e: WissenEintrag): [string, React.ReactNode][] {
  const m = e.wissen;
  const rows: [string, React.ReactNode][] = [];
  rows.push(['Sektion', m.sektion]);
  if (m.element)      rows.push(['Element',    m.element]);
  if (m.thunTyp)      rows.push(['Tagestyp',   <span style={{ color: thunTypFarbe(m.thunTyp), fontWeight: 600 }}>{thunTypLabel(m.thunTyp)}</span>]);
  if (m.sonneSidVon)  rows.push(['Sonne siderisch', `${m.sonneSidVon} – ${m.sonneSidBis}`]);
  if (m.sonneTropVon) rows.push(['Sonne tropisch',  `${m.sonneTropVon} – ${m.sonneTropBis}`]);
  return rows;
}

function VerwandtBlock({ treffer }: { treffer: VerwandtTreffer[] }) {
  const nav = useDetailNav();
  if (treffer.length === 0) return null;

  return (
    <section className="eintrag-block eintrag-verwandt">
      <h2>Das koennte dich auch interessieren</h2>
      <div className="verwandt-grid">
        {treffer.map(v => {
          const ref = refAusId(v.eintrag.id);
          return (
            <button
              key={v.eintrag.id}
              type="button"
              className="verwandt-karte"
              style={{ borderLeftColor: TYP_FARBE[v.eintrag.typ] }}
              onClick={() => ref && nav.oeffne(ref)}
              title={`${v.punkte} Punkte · ${v.quellen.join(' · ')}`}
            >
              <div className="verwandt-kopfzeile">
                <span className="verwandt-typ" style={{ color: TYP_FARBE[v.eintrag.typ] }}>
                  {TYP_LABEL[v.eintrag.typ]}
                </span>
                {v.art && v.quellen.includes('explizit') && (
                  <span className="verwandt-art">{beziehungsLabel(v.art)}</span>
                )}
              </div>
              <div className="verwandt-titel-zeile">
                {v.eintrag.symbol && <span className="verwandt-symbol zodiak-glyph">{v.eintrag.symbol + VS_TEXT}</span>}
                <span className="verwandt-titel">{v.eintrag.titel}</span>
              </div>
              <span className="verwandt-kurz">{v.eintrag.kurz}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TagChip({ tag }: { tag: string }) {
  const nav = useDetailNav();
  return (
    <button
      type="button"
      className="tag-chip tag-chip-klickbar"
      onClick={() => nav.oeffne({ kind: 'tag', tag })}
      title={`Alle Eintraege mit #${tag}`}
    >
      #{tag}
    </button>
  );
}

function MischkulturBlock({ pflanzeId }: { pflanzeId: string }) {
  const nav = useDetailNav();
  const p = allePflanzen.find(x => x.id === pflanzeId);
  if (!p || !p.mischkultur) return null;
  const { gut = [], schlecht = [] } = p.mischkultur;
  if (gut.length === 0 && schlecht.length === 0) return null;

  return (
    <section className="eintrag-block mischkultur-block">
      <h2>Mischkultur</h2>
      <div className="mischkultur-grid">
        {gut.length > 0 && (
          <div className="mischkultur-spalte mischkultur-gut">
            <h3>Begleiter</h3>
            <div className="mischkultur-chips">
              {gut.map(id => <PflanzenChip key={id} id={id} klasse="chip-gut" nav={nav} />)}
            </div>
          </div>
        )}
        {schlecht.length > 0 && (
          <div className="mischkultur-spalte mischkultur-schlecht">
            <h3>Gegner</h3>
            <div className="mischkultur-chips">
              {schlecht.map(id => <PflanzenChip key={id} id={id} klasse="chip-schlecht" nav={nav} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PflanzenChip({ id, klasse, nav }: { id: string; klasse: string; nav: ReturnType<typeof useDetailNav> }) {
  const p = allePflanzen.find(x => x.id === id);
  const label = p ? p.name : id;
  const fehlt = !p;
  return (
    <button
      type="button"
      className={`mischkultur-chip ${klasse} ${fehlt ? 'chip-fehlt' : ''}`}
      onClick={() => p && nav.oeffne({ kind: 'pflanze', id })}
      disabled={fehlt}
      title={fehlt ? `Pflanze "${id}" noch nicht im Werk` : label}
    >
      {label}
    </button>
  );
}

function datumFmt(s: string): string {
  const [m, t] = s.split('-').map(Number);
  return `${t}. ${MONATE[m - 1]}`;
}
