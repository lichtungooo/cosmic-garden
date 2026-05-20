// Schlichte Bilder-Galerie fuers Garten-Profil.
// Lokal: konvertiert Bilder in Data-URLs und speichert sie im Profil-Item.
// Wir komprimieren grob auf ~800px Kante, damit der Yjs-Doc nicht explodiert.
// Jedes Bild traegt einen Markdown-Text als Caption.

import { useRef } from 'react';
import type { GartenBild } from '../lib/profil';

const MAX_KANTE = 800;
const QUALITAET = 0.78;

interface Props {
  bilder: GartenBild[];
  onChange: (next: GartenBild[]) => void;
}

async function komprimiere(datei: File): Promise<string | null> {
  try {
    const url = URL.createObjectURL(datei);
    try {
      const bild = await new Promise<HTMLImageElement>((res, rej) => {
        const b = new Image();
        b.onload = () => res(b);
        b.onerror = rej;
        b.src = url;
      });
      const skala = Math.min(1, MAX_KANTE / Math.max(bild.naturalWidth, bild.naturalHeight));
      const w = Math.max(1, Math.round(bild.naturalWidth * skala));
      const h = Math.max(1, Math.round(bild.naturalHeight * skala));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(bild, 0, 0, w, h);
      return c.toDataURL('image/jpeg', QUALITAET);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}

export function BilderUpload({ bilder, onChange }: Props) {
  const eingabe = useRef<HTMLInputElement | null>(null);

  async function aufDateien(dateien: FileList | null) {
    if (!dateien || dateien.length === 0) return;
    const neue: GartenBild[] = [];
    for (const d of Array.from(dateien)) {
      if (!d.type.startsWith('image/')) continue;
      const url = await komprimiere(d);
      if (url) neue.push({ url, caption: '' });
    }
    if (neue.length > 0) onChange([...bilder, ...neue]);
  }

  function aendereCaption(index: number, caption: string) {
    onChange(bilder.map((b, i) => i === index ? { ...b, caption } : b));
  }

  function loesche(index: number) {
    onChange(bilder.filter((_, i) => i !== index));
  }

  return (
    <div className="bilder-upload">
      <div className="bilder-galerie">
        {bilder.map((b, i) => (
          <div key={i} className="bilder-eintrag">
            <div className="bilder-bild-rahmen">
              <img src={b.url} alt={`Garten-Bild ${i + 1}`} loading="lazy" />
              <button
                type="button"
                className="bilder-loeschen"
                onClick={() => loesche(i)}
                aria-label="Bild entfernen"
              >×</button>
            </div>
            <textarea
              className="bilder-caption"
              value={b.caption}
              onChange={(e) => aendereCaption(i, e.target.value)}
              placeholder="Bildunterschrift, Markdown geht (z.B. **Tomaten** im August)"
              rows={2}
            />
          </div>
        ))}
        <button
          type="button"
          className="bilder-hinzufuegen"
          onClick={() => eingabe.current?.click()}
        >
          <span className="bilder-plus">+</span>
          <span className="bilder-hinweis">Bild hinzufügen</span>
        </button>
      </div>
      <input
        ref={eingabe}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => { aufDateien(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}
