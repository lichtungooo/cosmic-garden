import { useOeffneWissen } from '../lib/wissen-context';

interface Props {
  sektionId: string;
  eintragId: string;
  titel?: string;
}

export function InfoIcon({ sektionId, eintragId, titel }: Props) {
  const oeffne = useOeffneWissen();
  if (!oeffne) return null;
  return (
    <button
      type="button"
      className="info-icon"
      onClick={(e) => { e.stopPropagation(); oeffne(sektionId, eintragId); }}
      title={titel ?? 'Mehr erfahren'}
      aria-label={titel ?? 'Mehr erfahren'}
    >
      i
    </button>
  );
}
