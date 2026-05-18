import type { WetterKlasse } from '../lib/wetter';

interface Props {
  klasse: WetterKlasse;
  size?: number;
  title?: string;
}

export function WetterSymbol({ klasse, size = 14, title }: Props) {
  const colors = {
    sun: '#e8a82b',
    cloud: '#9aa3ad',
    rain: '#4a7ea8',
    snow: '#c6d4dd',
    storm: '#5b3a8a',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={title || klasse}>
      {title && <title>{title}</title>}
      {klasse === 'klar' && <>
        <circle cx="12" cy="12" r="5" fill={colors.sun} />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x1 = 12 + Math.cos(a) * 7.5;
          const y1 = 12 + Math.sin(a) * 7.5;
          const x2 = 12 + Math.cos(a) * 10.5;
          const y2 = 12 + Math.sin(a) * 10.5;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.sun} strokeWidth="1.6" strokeLinecap="round" />;
        })}
      </>}
      {klasse === 'wolkig' && <>
        <circle cx="9" cy="10" r="3.5" fill={colors.sun} opacity="0.7" />
        <path d="M 6,17 a 4 4 0 0 1 1,-7.8 a 5 5 0 0 1 9.7,1.3 a 3.5 3.5 0 0 1 0.3,6.5 z" fill={colors.cloud} />
      </>}
      {klasse === 'nebel' && <>
        <line x1="4" y1="9" x2="20" y2="9" stroke={colors.cloud} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="2" y1="13" x2="22" y2="13" stroke={colors.cloud} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="5" y1="17" x2="19" y2="17" stroke={colors.cloud} strokeWidth="1.8" strokeLinecap="round" />
      </>}
      {(klasse === 'regen' || klasse === 'schauer') && <>
        <path d="M 5,12 a 4 4 0 0 1 1,-7.5 a 5 5 0 0 1 9.5,1.3 a 3.5 3.5 0 0 1 0.3,6.2 z" fill={colors.cloud} />
        <line x1="8" y1="17" x2="7" y2="21" stroke={colors.rain} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="12" y1="17" x2="11" y2="22" stroke={colors.rain} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="16" y1="17" x2="15" y2="21" stroke={colors.rain} strokeWidth="1.8" strokeLinecap="round" />
      </>}
      {klasse === 'schnee' && <>
        <path d="M 5,12 a 4 4 0 0 1 1,-7.5 a 5 5 0 0 1 9.5,1.3 a 3.5 3.5 0 0 1 0.3,6.2 z" fill={colors.cloud} />
        <text x="6.5" y="22" fontSize="6" fill={colors.snow} stroke={colors.cloud} strokeWidth="0.3">❄ ❄</text>
      </>}
      {klasse === 'gewitter' && <>
        <path d="M 5,12 a 4 4 0 0 1 1,-7.5 a 5 5 0 0 1 9.5,1.3 a 3.5 3.5 0 0 1 0.3,6.2 z" fill={colors.cloud} />
        <polygon points="11,14 8,20 11,20 9,24 15,17 12,17 14,14" fill={colors.storm} />
      </>}
    </svg>
  );
}
