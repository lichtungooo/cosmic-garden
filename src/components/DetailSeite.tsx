import { useEffect, useRef } from 'react';
import { useDetailNav, refSchluessel, type DetailRef } from '../lib/detail-navigation';
import { EintragsSeite } from './EintragsSeite';
import { TagSeite } from './TagSeite';

function refToEintragId(ref: DetailRef): string | null {
  if (ref.kind === 'pflanze') return `pflanze:${ref.id}`;
  if (ref.kind === 'arbeit')  return `arbeit:${ref.id}`;
  if (ref.kind === 'wissen')  return `wissen:${ref.sektion}:${ref.eintrag}`;
  return null;
}

export function DetailSeite() {
  const nav = useDetailNav();
  const stack = nav.stack;
  const inhaltRef = useRef<HTMLDivElement>(null);

  const obenKey = stack.length > 0 ? refSchluessel(stack[stack.length - 1]) : '';
  useEffect(() => {
    inhaltRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [obenKey]);

  if (stack.length === 0) return null;

  const oben = stack[stack.length - 1];

  return (
    <div className="detail-seite">
      <div className="detail-inhalt" ref={inhaltRef}>
        {oben.kind === 'tag' ? (
          <TagSeite tag={oben.tag} />
        ) : (
          <EintragsSeite eintragId={refToEintragId(oben)!} />
        )}
      </div>
    </div>
  );
}
