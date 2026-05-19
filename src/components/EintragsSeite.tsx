// Eine Seite für alle Eintrags-Typen — Pflanze, Arbeit, Wissen.
// Gleicher Aufbau: Kopf, Tags, Kurz, Steckbrief (typ-spezifisch), Bloecke, Verwandt.

import type { Eintrag, EintragsTyp, PflanzeEintrag, ArbeitEintrag, WissenEintrag } from '../lib/datenbank';
import { findeEintrag } from '../lib/datenbank-suche';
import { verwandtFuer, beziehungsLabel, type VerwandtTreffer } from '../lib/verwandt';
import { useDetailNav, refAusId } from '../lib/detail-navigation';
import { thunTypFarbe, thunTypLabel } from '../lib/moon';
import { weltAusKategorie, welt } from '../lib/welten';
import { pflanzen as allePflanzen, type Pflanze } from '../lib/pflanzen';
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

      {e.typ === 'pflanze' && (() => {
        const pflanzeId = e.id.split(':')[1];
        const voll = allePflanzen.find(x => x.id === pflanzeId);
        return voll ? <PflanzenSteckbrief p={voll} /> : null;
      })()}

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
      <h2>Das könnte dich auch interessieren</h2>
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
      title={`Alle Einträge mit #${tag}`}
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

// === Pflanzen-Steckbrief: 10 thematische Bloecke, leer wird ausgeblendet ===

function PflanzenSteckbrief({ p }: { p: Pflanze }) {
  return (
    <div className="pflanze-details">
      <Sektion titel="Wesen" hasContent={!!(p.herkunft || p.lebenszyklus || p.wuchsform || p.hoehe)}>
        <Faktenliste>
          {p.herkunft && <Fakt label="Herkunft" wert={p.herkunft} />}
          {p.lebenszyklus && <Fakt label="Lebenszyklus" wert={lebenszyklusLabel(p.lebenszyklus)} />}
          {p.wuchsform && <Fakt label="Wuchsform" wert={p.wuchsform} />}
          {p.hoehe && <Fakt label="Höhe" wert={p.hoehe} />}
        </Faktenliste>
      </Sektion>

      <Sektion titel="Standort & Boden" hasContent={!!(p.licht || p.bodenart?.length || p.phBereich || p.naehrstoffbedarf || p.frosthaerte)}>
        <Faktenliste>
          {p.licht && <Fakt label="Licht" wert={lichtLabel(p.licht)} />}
          {p.bodenart && p.bodenart.length > 0 && <Fakt label="Boden" wert={<ChipReihe items={p.bodenart} />} />}
          {p.phBereich && <Fakt label="pH-Wert" wert={p.phBereich} />}
          {p.naehrstoffbedarf && <Fakt label="Nährstoffe" wert={naehrstoffLabel(p.naehrstoffbedarf)} />}
          {p.frosthaerte && <Fakt label="Frosthärte" wert={p.frosthaerte} />}
        </Faktenliste>
      </Sektion>

      <Sektion titel="Kosmischer Bezug" hasContent={!!(p.aussaatMondphase || p.ernteMondphase || p.mondrichtungAussaat || p.planetenbezug)}>
        <Faktenliste>
          {p.aussaatMondphase && <Fakt label="Aussaat-Mondphase" wert={p.aussaatMondphase} />}
          {p.mondrichtungAussaat && <Fakt label="Mondrichtung Aussaat" wert={p.mondrichtungAussaat} />}
          {p.ernteMondphase && <Fakt label="Ernte-Mondphase" wert={p.ernteMondphase} />}
          {p.planetenbezug && <Fakt label="Planeten-Bezug" wert={p.planetenbezug} />}
        </Faktenliste>
      </Sektion>

      <Sektion titel="Aussaat & Vorzucht" hasContent={!!(p.aussaatMethode || p.vorkulturDauer || p.reihenabstandCm || p.saatzeitNotiz)}>
        <Faktenliste>
          {p.aussaatMethode && <Fakt label="Methode" wert={aussaatMethodeLabel(p.aussaatMethode)} />}
          {p.vorkulturDauer && <Fakt label="Vorkultur-Dauer" wert={p.vorkulturDauer} />}
          {p.reihenabstandCm && <Fakt label="Reihenabstand" wert={`${p.reihenabstandCm} cm`} />}
          {p.saatzeitNotiz && <Fakt label="Hinweis" wert={<MarkdownInline text={p.saatzeitNotiz} />} />}
        </Faktenliste>
      </Sektion>

      <Sektion titel="Pflege" hasContent={!!(p.wasserbedarf || p.duengung || p.stuetzung || p.rueckschnitt || p.mulchen || p.spezialpflege)}>
        <Faktenliste>
          {p.wasserbedarf && <Fakt label="Wasser" wert={wasserLabel(p.wasserbedarf)} />}
          {p.duengung && <Fakt label="Düngung" wert={<MarkdownInline text={p.duengung} />} />}
          {p.stuetzung && <Fakt label="Stützung" wert={<MarkdownInline text={p.stuetzung} />} />}
          {p.rueckschnitt && <Fakt label="Rückschnitt" wert={<MarkdownInline text={p.rueckschnitt} />} />}
          {p.mulchen && <Fakt label="Mulchen" wert={<MarkdownInline text={p.mulchen} />} />}
          {p.spezialpflege && <Fakt label="Besonders" wert={<MarkdownInline text={p.spezialpflege} />} />}
        </Faktenliste>
      </Sektion>

      <Sektion titel="Ernte" hasContent={!!(p.reifezeichen || p.erntemethode || p.mehrfachernte != null || p.ernteTagestyp)}>
        <Faktenliste>
          {p.reifezeichen && <Fakt label="Reifezeichen" wert={p.reifezeichen} />}
          {p.erntemethode && <Fakt label="Methode" wert={p.erntemethode} />}
          {p.mehrfachernte != null && <Fakt label="Mehrfachernte" wert={p.mehrfachernte ? 'ja' : 'nein'} />}
          {p.ernteTagestyp && (
            <Fakt label="Optimaler Tagestyp" wert={
              <span style={{ color: thunTypFarbe(p.ernteTagestyp), fontWeight: 600 }}>{thunTypLabel(p.ernteTagestyp)}</span>
            } />
          )}
        </Faktenliste>
      </Sektion>

      <Sektion titel="Verarbeitung & Lagerung" hasContent={!!(p.trocknung || p.verarbeitung || p.lagerung || p.saatgutGewinnung)}>
        <Faktenliste>
          {p.trocknung && <Fakt label="Trocknung" wert={<MarkdownInline text={p.trocknung} />} />}
          {p.verarbeitung && <Fakt label="Verarbeitung" wert={<MarkdownInline text={p.verarbeitung} />} />}
          {p.lagerung && <Fakt label="Lagerung" wert={<MarkdownInline text={p.lagerung} />} />}
          {p.saatgutGewinnung && <Fakt label="Saatgut" wert={<MarkdownInline text={p.saatgutGewinnung} />} />}
        </Faktenliste>
      </Sektion>

      <Sektion titel="Verwendung" hasContent={!!(p.kueche || p.heilkundeKurz)}>
        <Faktenliste>
          {p.kueche && <Fakt label="Küche" wert={p.kueche} />}
          {p.heilkundeKurz && <Fakt label="Heilkunde" wert={<MarkdownInline text={p.heilkundeKurz} />} />}
        </Faktenliste>
      </Sektion>

      <Sektion titel="Schutz & Stärkung" hasContent={!!(
        p.schaedlinge?.length || p.krankheiten?.length || p.anfaelligkeit ||
        p.staerkungJauche?.length || p.vermeiden || p.schutzbegleiter?.length
      )}>
        <Faktenliste>
          {p.anfaelligkeit && <Fakt label="Anfälligkeit" wert={anfaelligkeitLabel(p.anfaelligkeit)} />}
          {p.schaedlinge && p.schaedlinge.length > 0 && (
            <Fakt label="Schädlinge" wert={<WissenChips ids={p.schaedlinge} sektion="schaedlinge" farbe="#a8423a" />} />
          )}
          {p.krankheiten && p.krankheiten.length > 0 && (
            <Fakt label="Krankheiten" wert={<WissenChips ids={p.krankheiten} sektion="schaedlinge" farbe="#7a3a8a" />} />
          )}
          {p.staerkungJauche && p.staerkungJauche.length > 0 && (
            <Fakt label="Stärkung" wert={<WissenChips ids={p.staerkungJauche} sektion="schaedlinge" farbe="#4a8a3a" />} />
          )}
          {p.schutzbegleiter && p.schutzbegleiter.length > 0 && (
            <Fakt label="Schutz-Begleiter" wert={<PflanzenChips ids={p.schutzbegleiter} />} />
          )}
          {p.vermeiden && <Fakt label="Vermeiden" wert={<MarkdownInline text={p.vermeiden} />} />}
        </Faktenliste>
      </Sektion>

      <Sektion titel="Sorten" hasContent={!!(p.sortenempfehlung || p.alteSorten?.length || p.regionenEignung)}>
        <Faktenliste>
          {p.sortenempfehlung && <Fakt label="Empfehlung" wert={sortenLabel(p.sortenempfehlung)} />}
          {p.alteSorten && p.alteSorten.length > 0 && <Fakt label="Alte Sorten" wert={<ChipReihe items={p.alteSorten} />} />}
          {p.regionenEignung && <Fakt label="Regionen" wert={p.regionenEignung} />}
        </Faktenliste>
      </Sektion>
    </div>
  );
}

function Sektion({ titel, hasContent, children }: { titel: string; hasContent: boolean; children: React.ReactNode }) {
  if (!hasContent) return null;
  return (
    <section className="eintrag-block pflanze-sektion">
      <h2>{titel}</h2>
      {children}
    </section>
  );
}

function Faktenliste({ children }: { children: React.ReactNode }) {
  return <dl className="steckbrief-dl">{children}</dl>;
}

function Fakt({ label, wert }: { label: string; wert: React.ReactNode }) {
  return (
    <div className="steckbrief-zeile">
      <dt>{label}</dt>
      <dd>{wert}</dd>
    </div>
  );
}

function ChipReihe({ items }: { items: string[] }) {
  return (
    <div className="fakt-chips">
      {items.map(t => <span key={t} className="fakt-chip">{t}</span>)}
    </div>
  );
}

function MarkdownInline({ text }: { text: string }) {
  return <div className="fakt-markdown"><MarkdownText text={text} /></div>;
}

function WissenChips({ ids, sektion, farbe }: { ids: string[]; sektion: string; farbe: string }) {
  const nav = useDetailNav();
  return (
    <div className="fakt-chips">
      {ids.map(id => {
        const eintrag = findeEintrag(`wissen:${sektion}:${id}`);
        const label = eintrag?.titel ?? id;
        return (
          <button
            key={id}
            type="button"
            className="fakt-chip fakt-chip-link"
            onClick={() => nav.oeffne({ kind: 'wissen', sektion, eintrag: id })}
            style={{ borderColor: farbe, color: farbe }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function PflanzenChips({ ids }: { ids: string[] }) {
  const nav = useDetailNav();
  return (
    <div className="fakt-chips">
      {ids.map(id => {
        const p = allePflanzen.find(x => x.id === id);
        return (
          <button
            key={id}
            type="button"
            className="fakt-chip fakt-chip-link"
            onClick={() => p && nav.oeffne({ kind: 'pflanze', id })}
            disabled={!p}
            style={{ borderColor: '#4a8a3a', color: '#4a8a3a' }}
          >
            {p?.name ?? id}
          </button>
        );
      })}
    </div>
  );
}

// === Label-Helfer ===
function lichtLabel(l: string): string {
  return { sonnig: 'sonnig', halbschattig: 'halbschattig', schattig: 'schattig' }[l] ?? l;
}
function lebenszyklusLabel(l: string): string {
  return { einjaehrig: 'einjährig', zweijaehrig: 'zweijährig', mehrjaehrig: 'mehrjährig' }[l] ?? l;
}
function naehrstoffLabel(n: string): string {
  return { schwach: 'Schwachzehrer', mittel: 'Mittelzehrer', stark: 'Starkzehrer' }[n] ?? n;
}
function wasserLabel(w: string): string {
  return { gering: 'wenig — Trockenheits-Verträger', mittel: 'mittel — gleichmäßig', hoch: 'viel — durstig' }[w] ?? w;
}
function aussaatMethodeLabel(m: string): string {
  return {
    direktsaat: 'Direktsaat ins Beet',
    vorzucht: 'Vorzucht im Haus, später auspflanzen',
    steckling: 'Stecklinge',
    knolle: 'Knolle setzen',
    wurzelteilung: 'Wurzelteilung',
    pfropfen: 'Pfropfen / Veredeln',
  }[m] ?? m;
}
function anfaelligkeitLabel(a: string): string {
  return { robust: 'robust', mittel: 'mittel', empfindlich: 'empfindlich' }[a] ?? a;
}
function sortenLabel(s: string): string {
  return {
    samenfest: 'samenfest — eigene Vermehrung möglich',
    F1: 'F1-Hybride — nur einmal kaufen',
    beides: 'samenfest und F1 verfügbar',
  }[s] ?? s;
}
