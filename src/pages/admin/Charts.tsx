// Admin overview charts — zero-dependency SVG (no bundle cost).
// Bookings already loaded by Admin (cloud or local); these only visualise them.
// English labels only.

export interface ChartBooking {
  status: string;
  total?: number | null;
  subtotal?: number | null;
  created_at: string;
  items?: any[] | null;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Last 14 days revenue (excl. cancelled) */
export function RevenueCard({ bookings }: { bookings: ChartBooking[] }) {
  const days: { key: string; label: string; value: number }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: 0,
    });
  }
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const b of bookings) {
    if (!b || b.status === 'cancelled') continue;
    const k = String(b.created_at || '').slice(0, 10);
    const slot = byKey.get(k);
    if (slot) slot.value += Number(b.total ?? b.subtotal ?? 0);
  }
  const max = Math.max(1, ...days.map((d) => d.value));
  const total14 = days.reduce((a, d) => a + d.value, 0);
  const W = 620, H = 210, padL = 8, padB = 26, padT = 14;
  const bw = (W - padL * 2) / days.length;

  return (
    <div className="admin-card p-5">
      <div className="flex items-baseline gap-2">
        <b>Revenue — last 14 days</b>
        <span className="ml-auto text-[13px] font-bold text-[#8e1a4f]">₹{total14.toLocaleString('en-IN')}</span>
      </div>
      {total14 === 0 ? (
        <p className="text-[13px] text-[#8a7584] mt-3">No revenue in the last 14 days yet.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-3" role="img" aria-label="Revenue last 14 days">
          <defs>
            <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8e1a4f" />
              <stop offset="100%" stopColor="#e8c66a" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => {
            const gy = padT + (H - padB - padT) * (1 - f);
            return <line key={f} x1={padL} x2={W - padL} y1={gy} y2={gy} stroke="#1a0f1e" strokeOpacity="0.07" />;
          })}
          {days.map((d, i) => {
            const h = Math.max(3, ((H - padB - padT) * d.value) / max);
            const x = padL + i * bw + bw * 0.22;
            const y = H - padB - h;
            return (
              <g key={d.key}>
                <rect x={x} y={y} width={bw * 0.56} height={h} rx={4} fill="url(#revBar)" opacity={d.value ? 1 : 0.25} />
                {i % 2 === 0 && (
                  <text x={x + bw * 0.28} y={H - 8} textAnchor="middle" fontSize="10" fill="#8a7584">
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: '#d97706' },
  { key: 'confirmed', label: 'Confirmed', color: '#2563eb' },
  { key: 'onway', label: 'On the way', color: '#ea580c' },
  { key: 'delivered', label: 'Delivered', color: '#7c3aed' },
  { key: 'returned', label: 'Returned', color: '#059669' },
  { key: 'cancelled', label: 'Cancelled', color: '#e11d48' },
];

/** Bookings share by status */
export function StatusDonutCard({ bookings }: { bookings: ChartBooking[] }) {
  const counts = STATUS_META.map((s) => ({ ...s, n: bookings.filter((b) => b?.status === s.key).length }));
  const total = counts.reduce((a, c) => a + c.n, 0);
  const R = 54;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segs = counts.map((c) => {
    const frac = total ? c.n / total : 0;
    const s = { ...c, dash: frac * C, off: acc * C };
    acc += frac;
    return s;
  });

  return (
    <div className="admin-card p-5">
      <b>Bookings by status</b>
      {total === 0 ? (
        <p className="text-[13px] text-[#8a7584] mt-3">No bookings yet.</p>
      ) : (
        <div className="flex items-center gap-4 mt-3">
          <svg viewBox="0 0 140 140" className="w-32 h-32 shrink-0" role="img" aria-label="Bookings by status">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#1a0f1e" strokeOpacity="0.08" strokeWidth="18" />
            {segs.map((s) =>
              s.n > 0 ? (
                <circle key={s.key} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth="18"
                  strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={-s.off}
                  transform="rotate(-90 70 70)" strokeLinecap="butt" />
              ) : null
            )}
            <text x="70" y="66" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1a0f1e">{total}</text>
            <text x="70" y="82" textAnchor="middle" fontSize="10" fill="#8a7584">bookings</text>
          </svg>
          <div className="space-y-1.5 text-[12.5px] min-w-0">
            {counts.map((c) => (
              <div key={c.key} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="text-[#3d2b36]">{c.label}</span>
                <b className="ml-auto">{c.n}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Most booked outfits (by quantity across booking items) */
export function TopProductsCard({ bookings }: { bookings: ChartBooking[] }) {
  const qty = new Map<string, number>();
  for (const b of bookings) {
    if (!b || !Array.isArray(b.items)) continue;
    for (const it of b.items) {
      const raw = String(it?.name || it?.id || '').trim();
      if (!raw) continue;
      const clean = raw.replace(/\s*\(accessory only\)\s*/i, '');
      qty.set(clean, (qty.get(clean) || 0) + (Number(it?.qty) || 1));
    }
  }
  const top = [...qty.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(1, ...top.map(([, n]) => n));

  return (
    <div className="admin-card p-5">
      <div className="flex items-baseline gap-2">
        <b>Most booked outfits</b>
        <span className="ml-auto text-[12px] text-[#8a7584]">by quantity</span>
      </div>
      {top.length === 0 ? (
        <p className="text-[13px] text-[#8a7584] mt-3">Item-wise data appears once cart orders arrive.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {top.map(([name, n]) => (
            <div key={name}>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="truncate">{name}</span>
                <b className="ml-auto shrink-0">×{n}</b>
              </div>
              <div className="h-2 rounded-full bg-black/[.06] mt-1 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#8e1a4f] to-[#e8c66a]" style={{ width: `${Math.round((n / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
