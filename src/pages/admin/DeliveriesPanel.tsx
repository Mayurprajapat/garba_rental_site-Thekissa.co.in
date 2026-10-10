import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Copy, ExternalLink, Navigation, Plus, Trash2, Truck } from 'lucide-react';
import DeliveryMap, { ICON_HOME } from '../../components/DeliveryMap';
import { STORE_POS, getLocalDeliveries, listDeliveries, makeCode, saveLocalDeliveries, upsertDelivery, type Delivery } from '../../lib/delivery';
import { encodeSnapshot, publishPing } from '../../lib/liveTrack';

function PickMap({ lat, lng, onPick }: { lat: number; lng: number; onPick: (a: number, b: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current).setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.marker([STORE_POS.lat, STORE_POS.lng]).addTo(map).bindTooltip('Dispatch hub');
    markerRef.current = L.marker([lat, lng], { icon: ICON_HOME, draggable: true }).addTo(map);
    markerRef.current.on('dragend', () => {
      const p = markerRef.current!.getLatLng();
      onPick(Number(p.lat.toFixed(4)), Number(p.lng.toFixed(4)));
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      markerRef.current!.setLatLng(e.latlng);
      onPick(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    markerRef.current?.setLatLng([lat, lng]);
  }, [lat, lng]);

  return <div ref={ref} className="rounded-2xl overflow-hidden border" style={{ height: 320 }} />;
}

export default function DeliveriesPanel({ bookings }: { bookings: any[] }) {
  const [list, setList] = useState<Delivery[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ bookingId: '', customer: '', phone: '', address: '', lat: 22.7196, lng: 75.8577, agent: '', agentPhone: '' });

  const refresh = async () => setList(await listDeliveries());
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 6000);
    const onU = () => refresh();
    window.addEventListener('raasleela-deliveries-updated', onU);
    return () => { clearInterval(i); window.removeEventListener('raasleela-deliveries-updated', onU); };
  }, []);

  const active = list.filter((d) => d.status !== 'delivered');
  const current = list.find((d) => d.code === focus) ?? active[0] ?? list[0] ?? null;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.customer.trim() || !f.agent.trim()) { alert('Customer + agent name required'); return; }
    const d: Delivery = {
      code: makeCode(), bookingId: f.bookingId || Date.now(),
      customer: f.customer, phone: f.phone, address: f.address || 'Indore',
      destLat: Number(f.lat), destLng: Number(f.lng),
      agent: f.agent, agentPhone: f.agentPhone,
      status: 'assigned', agentLat: STORE_POS.lat, agentLng: STORE_POS.lng,
      updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    };
    await upsertDelivery(d);
    setShowForm(false);
    setF({ bookingId: '', customer: '', phone: '', address: '', lat: 22.7196, lng: 75.8577, agent: '', agentPhone: '' });
    refresh();
  };

  const remove = async (code: string) => {
    if (!confirm(`Delete delivery ${code}?`)) return;
    saveLocalDeliveries(getLocalDeliveries().filter((x) => x.code !== code));
    refresh();
  };

  const setStatus = async (d: Delivery, status: Delivery['status']) => {
    const next = { ...d, status, updatedAt: new Date().toISOString() };
    await upsertDelivery(next);
    // Customer ka map live update (status bhi)
    void publishPing(d.code, { lat: d.agentLat ?? STORE_POS.lat, lng: d.agentLng ?? STORE_POS.lng, status, ts: next.updatedAt });
    refresh();
  };

  // Live control — agent link khole bina, admin panel se hi location chalao.
  // Isi browser ka GPS agent location banta hai, customer ka map live update hota hai.
  const watchId = useRef<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);

  const pushPos = async (d: Delivery, lat: number, lng: number, status?: Delivery['status']) => {
    const next = { ...d, agentLat: lat, agentLng: lng, status: status || d.status, updatedAt: new Date().toISOString() };
    await upsertDelivery(next);
    void publishPing(d.code, { lat, lng, status: next.status, ts: next.updatedAt });
    refresh();
  };

  const stopShare = () => {
    if (watchId.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try { navigator.geolocation.clearWatch(watchId.current); } catch { /* ignore */ }
    }
    watchId.current = null;
    setSharing(false);
    setShareCode(null);
  };

  const startShare = (d: Delivery) => {
    if (!navigator.geolocation) { alert('GPS not supported on this device.'); return; }
    stopShare();
    setSharing(true);
    setShareCode(d.code);
    void pushPos(d, d.agentLat ?? STORE_POS.lat, d.agentLng ?? STORE_POS.lng, 'onway');
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => { void pushPos({ ...d, status: 'onway' }, pos.coords.latitude, pos.coords.longitude); },
      () => { alert('GPS permission denied — Allow location and retry.'); stopShare(); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  // Demo trip — store se customer tak 5 steps me (client demo ke liye, bina hile)
  const demoTrip = async (d: Delivery) => {
    stopShare();
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const lat = STORE_POS.lat + ((d.destLat - STORE_POS.lat) * i) / steps;
      const lng = STORE_POS.lng + ((d.destLng - STORE_POS.lng) * i) / steps;
      await pushPos(d, lat, lng, i === steps ? 'delivered' : 'onway');
      await new Promise((r) => setTimeout(r, 1200));
    }
  };

  useEffect(() => () => stopShare(), []);
  // Dusri delivery select karte hi purani sharing band
  useEffect(() => { if (shareCode && current?.code !== shareCode) stopShare(); });

  // One-click demo — client turant /track par test kar sake (delete bhi ho jayega)
  const loadDemo = async () => {
    const d: Delivery = {
      code: makeCode(), bookingId: 'demo',
      customer: 'Demo Customer', phone: '9876543210', address: 'Vijay Nagar, Indore',
      destLat: 22.748, destLng: 75.893,
      agent: 'Demo Rider', agentPhone: '',
      status: 'onway',
      agentLat: 22.7338, agentLng: 75.8753,
      updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    };
    await upsertDelivery(d);
    setFocus(d.code);
    refresh();
  };

  const copy = (t: string) => navigator.clipboard?.writeText(t);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Snapshot hash — alag phone par bhi link khulte hi map + details (phir live GPS)
  const snapOf = (x: Delivery) => `#s=${encodeSnapshot({
    code: x.code, customer: x.customer, phone: x.phone, address: x.address,
    destLat: x.destLat, destLng: x.destLng, agent: x.agent, agentPhone: x.agentPhone,
    status: x.status, agentLat: x.agentLat, agentLng: x.agentLng,
    updatedAt: x.updatedAt, createdAt: x.createdAt,
  })}`;
  const agentUrl = (x: Delivery) => `${origin}/d/${x.code}${snapOf(x)}`;
  const customerUrl = (x: Delivery) => `${origin}/t/${x.code}${snapOf(x)}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot inline-block" />
          <b>{active.length} live</b><span className="text-[#8a7584]">· {list.length} total · auto-refresh 6s</span>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="ml-auto bg-[#1a0f1e] text-white text-[13px] font-semibold rounded-xl px-4 py-2.5 flex items-center gap-1.5">
          <Plus size={14} /> New delivery
        </button>
        {list.length === 0 && (
          <button onClick={loadDemo} className="text-[13px] font-semibold border rounded-xl px-4 py-2.5">Load demo delivery</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={create} className="admin-card p-5 grid md:grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <p className="font-bold text-sm">Delivery details</p>
            <select value={f.bookingId} onChange={(e) => {
              const b = bookings.find((x) => String(x.id) === e.target.value);
              setF({ ...f, bookingId: e.target.value, customer: b?.name || f.customer, phone: b?.phone || f.phone });
            }} className="admin-input">
              <option value="">Link booking (optional)</option>
              {bookings.slice(0, 30).map((b) => <option key={b.id} value={b.id}>#{String(b.id).slice(-6)} · {b.name} · {b.phone}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input value={f.customer} onChange={(e) => setF({ ...f, customer: e.target.value })} placeholder="Customer name *" className="admin-input" required />
              <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Customer phone" className="admin-input" />
            </div>
            <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Delivery address" className="admin-input" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.0001" value={f.lat} onChange={(e) => setF({ ...f, lat: Number(e.target.value) })} className="admin-input" title="Latitude" />
              <input type="number" step="0.0001" value={f.lng} onChange={(e) => setF({ ...f, lng: Number(e.target.value) })} className="admin-input" title="Longitude" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={f.agent} onChange={(e) => setF({ ...f, agent: e.target.value })} placeholder="Agent name *" className="admin-input" required />
              <input value={f.agentPhone} onChange={(e) => setF({ ...f, agentPhone: e.target.value })} placeholder="Agent phone" className="admin-input" />
            </div>
            <p className="text-[11.5px] text-[#8a7584]">Click on the map to set the customer location. Indore samples: Vijay Nagar (22.748, 75.893) · Rajwada (22.718, 75.834) · Palasia (22.725, 75.880).</p>
            <button className="bg-[#1a0f1e] text-white text-sm font-semibold rounded-full py-3">Create + get tracking links</button>
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#8a7584] mb-1.5">TAP / DRAG TO SET DROP LOCATION</p>
            <PickMap lat={f.lat} lng={f.lng} onPick={(a, b) => setF({ ...f, lat: a, lng: b })} />
          </div>
        </form>
      )}

      {current && (
        <div className="admin-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <b className="flex items-center gap-1.5"><Truck size={15} /> {current.code}</b>
            <span className="text-[12px] text-[#6f5b6a]">{current.customer} · {current.agent} · <span className="capitalize font-bold">{current.status}</span></span>
            <span className="ml-auto text-[11px] text-[#8a7584]">Updated {new Date(current.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <div className="mt-3">
            <DeliveryMap agent={current.agentLat ? { lat: current.agentLat, lng: current.agentLng! } : null} dest={{ lat: current.destLat, lng: current.destLng }} height={360} />
          </div>
          <div className="grid sm:grid-cols-2 gap-2 mt-3 text-[12.5px]">
            <div className="bg-black/[.04] rounded-xl p-3">
              <b className="flex items-center gap-1.5"><Navigation size={13} /> Agent link (open on the delivery partner's phone)</b>
              <p className="truncate mt-1 text-blue-700">{origin}/d/{current.code}</p>
              <div className="flex gap-1.5 mt-2">
                <button onClick={() => copy(agentUrl(current))} className="text-[11px] font-bold border rounded-full px-3 py-1.5 flex items-center gap-1"><Copy size={11} /> Copy</button>
                <a href={agentUrl(current)} target="_blank" className="text-[11px] font-bold border rounded-full px-3 py-1.5 flex items-center gap-1">Open <ExternalLink size={11} /></a>
                <a href={`https://wa.me/91${current.agentPhone}?text=${encodeURIComponent(`Delivery ${current.code}: ${agentUrl(current)} — open it and press Start live location`)}`} target="_blank" className="text-[11px] font-bold rounded-full px-3 py-1.5 bg-[#25d366] text-white">WhatsApp agent</a>
              </div>
            </div>
            <div className="bg-black/[.04] rounded-xl p-3">
              <b>Customer link (send via SMS/WhatsApp)</b>
              <p className="truncate mt-1 text-blue-700">{origin}/t/{current.code}</p>
              <div className="flex gap-1.5 mt-2">
                <button onClick={() => copy(customerUrl(current))} className="text-[11px] font-bold border rounded-full px-3 py-1.5 flex items-center gap-1"><Copy size={11} /> Copy</button>
                <a href={customerUrl(current)} target="_blank" className="text-[11px] font-bold border rounded-full px-3 py-1.5 flex items-center gap-1">Open <ExternalLink size={11} /></a>
                <a href={`https://wa.me/91${current.phone}?text=${encodeURIComponent(`TheKissa.co delivery live: ${customerUrl(current)} — track your outfit here`)}`} target="_blank" className="text-[11px] font-bold rounded-full px-3 py-1.5 bg-[#25d366] text-white">WhatsApp customer</a>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
            <b className="text-[12.5px]">Live control — run it from here, no need to copy the link</b>
            <p className="text-[11.5px] text-[#6f5b6a] mt-0.5">Isi browser ka GPS agent location banega · customer ka map live update hoga.</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {!sharing
                ? <button onClick={() => startShare(current)} className="text-[11.5px] font-bold rounded-full px-3.5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 transition">Start live location</button>
                : <button onClick={stopShare} className="text-[11.5px] font-bold rounded-full px-3.5 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white transition">Stop sharing</button>}
              <button onClick={() => { void demoTrip(current); }} className="text-[11.5px] font-bold rounded-full px-3.5 py-2 border hover:bg-black hover:text-white transition">Run demo trip</button>
              <button onClick={() => { void setStatus(current, 'delivered'); }} className="text-[11.5px] font-bold rounded-full px-3.5 py-2 border hover:bg-black hover:text-white transition">Mark delivered</button>
            </div>
            {sharing && <p className="text-[11.5px] text-emerald-700 font-semibold mt-2"><span className="pulse-dot inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />Live sharing ON — keep this tab open.</p>}
          </div>
        </div>
      )}

      <div className="admin-card overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead><tr className="border-b"><th className="admin-th">Code</th><th className="admin-th">Customer → Agent</th><th className="admin-th">Status</th><th className="admin-th">Live pos</th><th className="admin-th text-right">Actions</th></tr></thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.code} className={`hover:bg-[#faf7ef] cursor-pointer ${focus === d.code || current?.code === d.code ? 'bg-[#faf7ef]' : ''}`} onClick={() => setFocus(d.code)}>
                <td className="admin-td font-bold">{d.code}</td>
                <td className="admin-td text-[12.5px]"><b>{d.customer}</b> <span className="text-[#8a7584]">→ {d.agent}</span><span className="block text-[#8a7584]">{d.address}</span></td>
                <td className="admin-td"><span className="status-pill bg-black/[.05] border capitalize">{d.status}</span></td>
                <td className="admin-td text-[11.5px] text-[#6f5b6a]">{d.agentLat ? `${d.agentLat.toFixed(3)}, ${d.agentLng!.toFixed(3)}` : '—'}</td>
                <td className="admin-td">
                  <div className="flex justify-end gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    {(['assigned', 'picked', 'onway', 'delivered'] as const).map((s) => (
                      <button key={s} onClick={() => setStatus(d, s)} className={`text-[10px] font-bold rounded-full px-2 py-1 border capitalize ${d.status === s ? 'bg-[#1a0f1e] text-white' : ''}`}>{s}</button>
                    ))}
                    <button onClick={() => remove(d.code)} className="w-7 h-7 grid place-items-center rounded-lg border text-rose-600"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-center text-sm text-[#8a7584] py-10">No deliveries yet — create a New delivery, or load the demo delivery and open its customer link to test live tracking.</p>}
      </div>

      <div className="admin-card p-4 text-[12.5px] text-[#3d2b36] leading-relaxed">
        <b>How it works:</b> ① Create a New delivery from a booking → ② open the agent link on the delivery partner's phone → Start live location → ③ watch the orange dot live on this map → ④ the customer link shows ETA + route. Free OpenStreetMap — no API key or cost. For multi-phone live tracking, run the Supabase <code>deliveries</code> table SQL (schema.sql step-8) once; until then same-browser demo mode works.
      </div>
    </div>
  );
}
