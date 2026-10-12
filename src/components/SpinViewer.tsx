// 360° spin viewer — drag with finger/mouse on the photo to rotate the dress.
// Frames = product photos (first = front, following ones = angles, in order).
// More angles = smoother spin. Add lines in Admin → Products → Photos.

import { useEffect, useRef, useState } from 'react';

export default function SpinViewer({ photos, name }: { photos: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(false);
  const drag = useRef<{ x: number; idx: number } | null>(null);
  const n = Math.max(photos.length, 1);

  useEffect(() => { setIdx(0); setAuto(false); }, [photos.join('|')]);

  useEffect(() => {
    photos.forEach((src) => { const im = new Image(); im.src = src; });
  }, [photos.join('|')]);

  useEffect(() => {
    if (!auto || n < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), 900);
    return () => clearInterval(t);
  }, [auto, n]);

  const step = (d: number) => {
    setAuto(false);
    setIdx((i) => (((i + d) % n) + n) % n);
  };

  return (
    <div className="relative w-full h-full select-none">
      <div
        className="w-full h-full cursor-ew-resize touch-none"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          setAuto(false);
          drag.current = { x: e.clientX, idx };
        }}
        onPointerMove={(e) => {
          const dr = drag.current;
          if (!dr) return;
          const s = Math.trunc((e.clientX - dr.x) / 14);
          if (s !== 0) setIdx((((dr.idx + s) % n) + n) % n);
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <img
          key={photos[idx] ?? ''}
          src={photos[idx] ?? ''}
          alt={name}
          draggable={false}
          decoding="async"
          onDragStart={(e) => e.preventDefault()}
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      <span className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white text-[10.5px] font-semibold rounded-full px-3 py-1.5 whitespace-nowrap">
        Drag to rotate · {idx + 1} / {n}
      </span>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur rounded-full px-2 py-1.5">
        <button onClick={() => step(-1)} aria-label="Previous angle" className="w-9 h-9 grid place-items-center rounded-full text-white hover:bg-white/20 transition text-sm font-bold">‹</button>
        <div className="flex gap-1 items-center">
          {photos.map((src, i) => (
            <button key={`${src}-${i}`} onClick={() => { setAuto(false); setIdx(i); }} aria-label={`Angle ${i + 1}`} className="p-1">
              <span className={`block h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`} />
            </button>
          ))}
        </div>
        <button onClick={() => step(1)} aria-label="Next angle" className="w-9 h-9 grid place-items-center rounded-full text-white hover:bg-white/20 transition text-sm font-bold">›</button>
        <button onClick={() => setAuto((v) => !v)} aria-label="Auto rotate"
          className={`h-9 px-2.5 rounded-full text-[11px] font-bold transition ${auto ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>
          {auto ? '❚❚' : '▶'}
        </button>
      </div>
    </div>
  );
}
