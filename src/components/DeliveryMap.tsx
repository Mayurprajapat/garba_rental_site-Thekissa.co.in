import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { STORE_POS } from '../lib/delivery';

function dot(color: string, pulse = false) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:22px;height:22px">
      ${pulse ? `<span style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:.35;animation:rlping 1.6s infinite"></span>` : ''}
      <span style="position:absolute;inset:5px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></span>
    </div><style>@keyframes rlping{0%{transform:scale(.6);opacity:.5}100%{transform:scale(1.8);opacity:0}}</style>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export const ICON_STORE = dot('#641629');
export const ICON_AGENT = dot('#e8590c', true);
export const ICON_HOME = dot('#0f9d58');

export default function DeliveryMap({
  agent,
  dest,
  height = 380,
}: {
  agent: { lat: number; lng: number } | null;
  dest: { lat: number; lng: number };
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // Pehle fix par hi center — customer pan kare to map jump na kare
  const centered = useRef(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView([dest.lat, dest.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // clear old layers except tiles
    map.eachLayer((l) => {
      if (l instanceof L.Marker || l instanceof L.Polyline) map.removeLayer(l);
    });
    L.marker([STORE_POS.lat, STORE_POS.lng], { icon: ICON_STORE }).addTo(map).bindTooltip('Dispatch hub');
    L.marker([dest.lat, dest.lng], { icon: ICON_HOME }).addTo(map).bindTooltip('Customer');
    if (agent) {
      L.marker([agent.lat, agent.lng], { icon: ICON_AGENT }).addTo(map).bindTooltip('Agent');
      L.polyline(
        [[STORE_POS.lat, STORE_POS.lng], [agent.lat, agent.lng], [dest.lat, dest.lng]],
        { color: '#c9273a', weight: 3, dashArray: '6 6' }
      ).addTo(map);
      if (!centered.current) {
        map.setView([agent.lat, agent.lng], Math.max(map.getZoom(), 12));
        centered.current = true;
      }
    } else {
      map.setView([dest.lat, dest.lng], 13);
      centered.current = false;
    }
  }, [agent?.lat, agent?.lng, dest.lat, dest.lng]);

  return <div ref={ref} className="rounded-2xl overflow-hidden border z-0" style={{ height }} />;
}
