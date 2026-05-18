import { useMemo } from 'react';
import { TagSpalte } from '../components/TagSpalte';
import type { Pflanze, Gartenarbeit } from '../lib/pflanzen';

interface Props {
  start: Date;
  onTag: (datum: Date) => void;
  onPflanze: (p: Pflanze) => void;
  onArbeit: (a: Gartenarbeit) => void;
}

export function WocheView({ start, onTag, onPflanze, onArbeit }: Props) {
  const tage = useMemo(() => {
    const d = new Date(start);
    const offset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - offset);
    return Array.from({ length: 7 }, (_, i) => {
      const t = new Date(d);
      t.setDate(d.getDate() + i);
      return t;
    });
  }, [start]);

  const heute = new Date();

  return (
    <div className="woche-spalten">
      {tage.map(t => (
        <TagSpalte
          key={t.toISOString()}
          datum={t}
          fokus={false}
          istHeute={t.toDateString() === heute.toDateString()}
          onClick={() => onTag(t)}
          onPflanze={onPflanze}
          onArbeit={onArbeit}
          variante="woche"
        />
      ))}
    </div>
  );
}
