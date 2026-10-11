import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { STORE_POS } from '../lib/delivery';

function dot(color: string, pulse = false, cls = '') {
  return L.divIcon({
    className: cls,
    html: `<div style="position:relative;width:22px;height:22px">
      ${pulse ? `<span style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:.35;animation:rlping 1.6s infinite"></span>` : ''}
      <span style="position:absolute;inset:5px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></span>
    </div><style>@keyframes rlping{0%{transform:scale(.6);opacity:.5}100%{transform:scale(1.8);opacity:0}}</style>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export const ICON_STORE = dot('#641629');
export const ICON_AGENT = dot('#e8590c', true, 'agent-glide');
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
  // Persistent layers — GPS ping par move karo, delete/recreate mat karo (flicker fix)
  const staticRef = useRef<L.LayerGroup | null>(null);
  const agentRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);
  // Pehle fix par hi center — customer pan kare to map jump na kare
  const centered = useRef(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView([dest.lat, dest.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      staticRef.current = null;
      agentRef.current = null;
      lineRef.current = null;
    };
  }, []);

  // Static markers (hub + customer) — sirf destination badle to rebuild
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    staticRef.current?.remove();
    const g = L.layerGroup([
      L.marker([STORE_POS.lat, STORE_POS.lng], { icon: ICON_STORE }).bindTooltip('Dispatch hub'),
      L.marker([dest.lat, dest.lng], { icon: ICON_HOME }).bindTooltip('Customer'),
    ]).addTo(map);
    staticRef.current = g;
    return () => { g.remove(); };
  }, [dest.lat, dest.lng]);

  // Agent marker + route line — position update karo, DOM recreate nahi
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!agent) {
      agentRef.current?.remove();
      agentRef.current = null;
      lineRef.current?.remove();
      lineRef.current = null;
      map.setView([dest.lat, dest.lng], 13);
      centered.current = false;
      return;
    }
    if (!agentRef.current) {
      agentRef.current = L.marker([agent.lat, agent.lng], { icon: ICON_AGENT }).addTo(map).bindTooltip('Agent');
    } else {
      agentRef.current.setLatLng([agent.lat, agent.lng]);
    }
    const pts: L.LatLngExpression[] = [
      [STORE_POS.lat, STORE_POS.lng],
      [agent.lat, agent.lng],
      [dest.lat, dest.lng],
    ];
    if (!lineRef.current) {
      lineRef.current = L.polyline(pts, { color: '#c9273a', weight: 3, dashArray: '6 6' }).addTo(map);
    } else {
      lineRef.current.setLatLngs(pts);
    }
    if (!centered.current) {
      map.setView([agent.lat, agent.lng], Math.max(map.getZoom(), 12));
      centered.current = true;
    }
  }, [agent?.lat, agent?.lng, dest.lat, dest.lng]);

  return <div ref={ref} className="rounded-2xl overflow-hidden border z-0" style={{ height }} />;
}
