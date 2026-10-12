import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DeliveryMap from '../components/DeliveryMap';
import Logo from '../components/Logo';
import { STORE } from '../data/store';
import { STORE_POS, etaMin, getDelivery, haversineKm, type Delivery } from '../lib/delivery';
import { snapshotFromHash, subscribeTrack } from '../lib/liveTrack';

const STEPS = ['assigned', 'picked', 'onway', 'delivered'];

export default function CustomerTrack() {
  const { code = '' } = useParams();
  const [d, setD] = useState<Delivery | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const load = async () => {
      const row = await getDelivery(code);
      if (row) { setD(row); return; }
      // Different phone/browser: first paint from the link snapshot
      const snap = snapshotFromHash<Delivery>();
      if (snap && snap.destLat) setD(snap);
      else setD(null);
    };
    load();
    const i = setInterval(load, 6000);
    // Live GPS stream (no account needed) — map updates as the agent moves
    const unsub = subscribeTrack(code, (p) => {
      setLive(true);
      setD((prev) => (prev ? { ...prev, agentLat: p.lat, agentLng: p.lng, status: p.status as Delivery['status'], updatedAt: p.ts } : prev));
    });
    return () => { clearInterval(i); unsub(); };
  }, [code]);

  if (!d) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#fdf9f0] p-6 text-center">
        <div className="card p-8 max-w-sm w-full">
          <p className="eyebrow">Live tracking</p>
          <h1 className="font-display font-black text-2xl mt-2">Finding your delivery…</h1>
          <p className="text-sm text-[#6f5b6a] mt-2">Please verify code <b>{code.toUpperCase()}</b> — the owner must have shared this link.</p>
          <Link to="/" className="underline text-sm font-semibold">Back to store</Link>
        </div>
      </div>
    );
  }

  const agent = d.agentLat != null && d.agentLng != null ? { lat: d.agentLat, lng: d.agentLng } : null;
  const km = agent ? haversineKm(agent.lat, agent.lng, d.destLat, d.destLng) : null;
  const storeKm = haversineKm(STORE_POS.lat, STORE_POS.lng, d.destLat, d.destLng);
  const stepIdx = Math.max(0, STEPS.indexOf(d.status));

  return (
    <div className="min-h-screen bg-[#fdf9f0]">
      <div className="container-x py-6 sm:py-8 max-w-3xl">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-9 h-9" />
          <b className="font-display text-lg whitespace-nowrap">{STORE.brand} Atelier</b>
        </Link>
        <p className="eyebrow mt-5">Live delivery · {d.code} {live && <span className="text-emerald-600 font-bold">· LIVE ●</span>}</p>
        <h1 className="font-display font-black text-[26px] sm:text-4xl mt-2 leading-tight">Your outfit is {d.status === 'delivered' ? 'delivered' : 'on its way'}.</h1>
        <p className="text-[13px] text-[#6f5b6a] mt-2 break-words">{d.customer} · {d.address} · Agent: {d.agent} ({d.agentPhone})</p>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
          <div className="card p-3 sm:p-4 text-center"><p className="text-[10px] font-bold text-[#8a7584]">DISTANCE</p><b className="font-display text-base sm:text-xl">{km !== null ? `${km.toFixed(1)} km` : `${storeKm.toFixed(1)} km`}</b></div>
          <div className="card p-3 sm:p-4 text-center"><p className="text-[10px] font-bold text-[#8a7584]">ETA</p><b className="font-display text-base sm:text-xl">{km !== null ? `~${etaMin(km)} min` : 'Soon'}</b></div>
          <div className="card p-3 sm:p-4 text-center"><p className="text-[10px] font-bold text-[#8a7584]">STATUS</p><b className="font-display text-base sm:text-xl capitalize">{d.status}</b></div>
        </div>

        <div className="flex items-center gap-1.5 mt-5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 min-w-0">
              <div className={`h-1.5 rounded-full ${i <= stepIdx ? 'bg-[#641629]' : 'bg-black/10'}`} />
              <p className={`text-[9.5px] sm:text-[10.5px] font-bold capitalize mt-1.5 truncate ${i <= stepIdx ? '' : 'text-[#8a7584]'}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:mt-5">
          <DeliveryMap agent={agent} dest={{ lat: d.destLat, lng: d.destLng }} height={320} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11.5px] text-[#6f5b6a]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#641629' }} /> Dispatch hub</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#e8590c' }} /> Delivery partner</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#0f9d58' }} /> Your address</span>
          <span className="ml-auto">Updated: {d.updatedAt ? new Date(d.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
        </div>
      </div>
    </div>
  );
}
