// Mondphasen-Symbol als SVG. Illumination 0..1, waxing=true bedeutet rechte Seite hell (Nordhalbkugel).
interface MondSymbolProps {
  illumination: number;
  waxing: boolean;
  size?: number;
  title?: string;
}

export function MondSymbol({ illumination, waxing, size = 18, title }: MondSymbolProps) {
  const r = 10;
  const cx = 12, cy = 12;
  // Konvention hier (kein Astronomie-Realismus): Vollmond schwarz, Neumond leer.
  // Schatten (= nicht-beleuchtete Seite) wird als "hell/leer" gemalt.
  const k = 1 - 2 * illumination; // -1 (Vollmond) .. +1 (Neumond)
  const ellipseRx = Math.abs(k) * r;
  const ellipseFill = '#f4ecd6';     // leer / nicht beleuchtete Seite
  const lightFill   = '#1b1c20';     // voll / beleuchtete Seite
  const ringStroke  = '#7a6e54';

  let svgInner;
  if (illumination < 0.02) {
    // Neumond: leerer Kreis mit Umriss
    svgInner = <circle cx={cx} cy={cy} r={r} fill={ellipseFill} stroke={ringStroke} strokeWidth={0.8} />;
  } else if (illumination > 0.98) {
    // Vollmond: voller schwarzer Kreis
    svgInner = <circle cx={cx} cy={cy} r={r} fill={lightFill} stroke={ringStroke} strokeWidth={0.8} />;
  } else {
    // Wir nutzen Maskierung mit clipPath für die richtige helle Seite.
    const id = `clip-${Math.round(illumination * 1000)}-${waxing ? 'w' : 'n'}`;
    // Welche Halbkreis-Seite ist hell?
    const lightSide = waxing ? 'right' : 'left';
    svgInner = (
      <>
        <circle cx={cx} cy={cy} r={r} fill={ellipseFill} stroke={ringStroke} strokeWidth={0.8} />
        <defs>
          <clipPath id={id}>
            <rect x={lightSide === 'right' ? cx : cx - r - 1} y={cy - r - 1} width={r + 1} height={2 * r + 2} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          {illumination < 0.5 ? (
            // Sichel: voller Kreis hell, minus Ellipse-Schatten
            <>
              <circle cx={cx} cy={cy} r={r} fill={lightFill} />
              <ellipse cx={cx} cy={cy} rx={ellipseRx} ry={r} fill={ellipseFill} />
            </>
          ) : (
            // Mehr als Halbmond: Halbkreis hell + Ellipse hell auf der anderen Seite
            <>
              <circle cx={cx} cy={cy} r={r} fill={lightFill} />
            </>
          )}
        </g>
        {illumination >= 0.5 && (
          // Auf der "schattigen" Seite des Halbkreises: Ellipse hell hinzufuegen
          <g clipPath={`url(#${id}-dark)`}>
            <ellipse cx={cx} cy={cy} rx={ellipseRx} ry={r} fill={lightFill} />
          </g>
        )}
        {illumination >= 0.5 && (
          <defs>
            <clipPath id={`${id}-dark`}>
              <rect x={lightSide === 'right' ? cx - r - 1 : cx} y={cy - r - 1} width={r + 1} height={2 * r + 2} />
            </clipPath>
          </defs>
        )}
      </>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={title}>
      {title && <title>{title}</title>}
      {svgInner}
    </svg>
  );
}

export function SonneSymbol({ size = 18, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={title}>
      {title && <title>{title}</title>}
      <circle cx={12} cy={12} r={5} fill="#e8a82b" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 12 + Math.cos(a) * 7.5;
        const y1 = 12 + Math.sin(a) * 7.5;
        const x2 = 12 + Math.cos(a) * 10.5;
        const y2 = 12 + Math.sin(a) * 10.5;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e8a82b" strokeWidth={1.6} strokeLinecap="round" />;
      })}
    </svg>
  );
}
