import { useEffect, useRef } from 'react';

interface Options {
  onLeft?: () => void;
  onRight?: () => void;
  minDistance?: number;
}

export function useSwipe(ref: React.RefObject<HTMLElement | null>, { onLeft, onRight, minDistance = 60 }: Options) {
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleStart(e: TouchEvent) {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    }
    function handleEnd(e: TouchEvent) {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < minDistance) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.2) return; // vertikales Scrollen
      if (dx > 0 && onRight) onRight();
      else if (dx < 0 && onLeft) onLeft();
    }

    el.addEventListener('touchstart', handleStart, { passive: true });
    el.addEventListener('touchend', handleEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchend', handleEnd);
    };
  }, [ref, onLeft, onRight, minDistance]);
}
