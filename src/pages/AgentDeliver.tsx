import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DeliveryMap from '../components/DeliveryMap';
import { STORE_POS, getDelivery, upsertDelivery, type Delivery } from '../lib/delivery';
import { publishPing, snapshotFromHash } from '../lib/liveTrack';

export default function AgentDeliver() {
  const { code = '' } = useParams();
  const [d, setD] = useState<Delivery | null>(null);
  const [msg, setMsg] = useState('Loading…');
  const [sharing, setSharing] = useState(false);
  const watchId = useRef<number | null>(null);

  const load = async () => {
    const row = await getDelivery(code);
    if (row) { setD(row); setMsg(''); return; }
    // Alag phone: link ke snapshot se delivery kholo
    const snap = snapshotFromHash<Delivery>();
    setD(snap && snap.destLat ? snap : null);
    setMsg(snap && snap.destLat ? '' : 'Invalid delivery code.');
  };
  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i); }, [code]);

  const push = async (lat: number, lng: number, status?: string) => {
    if (!d) return;
    const next = { ...d, agentLat: lat, agentLng: lng, status: (status || d.status || 'onway') as Delivery['status'], updatedAt: new Date().toISOString() };
    setD(next);
    await upsertDelivery(next);
    // Live: customer ka map turant update (bina account ke)
    void publishPing(code, { lat, lng, status: next.status, ts: next.updatedAt });
  };

  const startShare = () => {
    if (!navigator.geolocation) { setMsg('GPS not supported on this device.'); return; }
    setSharing(true);
    setMsg('Live location sharing ON — keep this page open.');
    push(d?.agentLat ?? STORE_POS.lat, d?.agentLng ?? STORE_POS.lng, 'onway');
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => push(pos.coords.latitude, pos.coords.longitude),
      () => setMsg('GPS permission denied — Allow location and retry.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };
  const stopShare = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setSharing(false);
    setMsg('Sharing paused.');
  };
  useEffect(() => () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); }, []);

  const simulate = async () => {
    if (!d) return;
    // Demo: store se customer tak 5 steps me move karo
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const lat = STORE_POS.lat + ((d.destLat - STORE_POS.lat) * i) / steps;
      const lng = STORE_POS.lng + ((d.destLng - STORE_POS.lng) * i) / steps;
      await push(lat, lng, i === steps ? 'delivered' : 'onway');
      await new Promise((r) => setTimeout(r, 1200));
    }
    setMsg('Demo trip complete — delivered.');
  };

  if (!d) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f7f3ea] p-6">
        <div className="admin-card p-8 max-w-sm w-full text-center">
          <b className="font-display text-xl">Delivery</b>
          <p className="text-sm text-[#6f5b6a] mt-2">{msg}</p>
          <Link to="/" className="text-sm underline">Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3ea] p-4">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="admin-card p-5">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#c9273a]">DELIVERY AGENT · {d.code}</p>
          <h1 className="font-display font-black text-2xl mt-1">{d.customer} → delivery</h1>
          <p className="text-[13px] text-[#6f5b6a] mt-1">{d.address} · {d.phone}</p>
          <p className="text-[13px] mt-2">Status: <b className="capitalize">{d.status}</b></p>
          <div className="flex flex-wrap gap-2 mt-4">
            {!sharing
              ? <button onClick={startShare} className="bg-[#641629] text-white text-sm font-semibold rounded-full px-5 py-3">Start live location</button>
              : <button onClick={stopShare} className="border text-sm font-semibold rounded-full px-5 py-3">Stop sharing</button>}
            <button onClick={simulate} className="border text-sm font-semibold rounded-full px-5 py-3">Run demo trip</button>
            <button onClick={() => push(d.agentLat ?? STORE_POS.lat, d.agentLng ?? STORE_POS.lng, 'delivered')} className="bg-emerald-600 text-white text-sm font-semibold rounded-full px-5 py-3">Mark delivered</button>
          </div>
          {msg && <p className="text-[12.5px] mt-3 bg-black/5 rounded-xl px-3 py-2">{msg}</p>}
        </div>
        <DeliveryMap agent={d.agentLat != null && d.agentLng != null ? { lat: d.agentLat, lng: d.agentLng } : null} dest={{ lat: d.destLat, lng: d.destLng }} />
        <p className="text-center text-[11.5px] text-[#8a7584]">Keep GPS + internet ON. The owner and customer watch this location live.</p>
      </div>
    </div>
  );
}
