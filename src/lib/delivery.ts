import { isSupabaseConfigured, supabase } from './supabase';

export const STORE_POS = { lat: 22.7196, lng: 75.8577, label: 'TheKissa.co dispatch hub · Indore' };

export type DeliveryStatus = 'assigned' | 'picked' | 'onway' | 'delivered';

export interface Delivery {
  code: string;
  bookingId: number | string;
  customer: string;
  phone: string;
  address: string;
  destLat: number;
  destLng: number;
  agent: string;
  agentPhone: string;
  status: DeliveryStatus;
  agentLat: number | null;
  agentLng: number | null;
  updatedAt: string;
  createdAt: string;
}

const KEY = 'raasleela-deliveries';

export function getLocalDeliveries(): Delivery[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function saveLocalDeliveries(list: Delivery[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('raasleela-deliveries-updated'));
}

export function makeCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function etaMin(km: number): number {
  return Math.max(2, Math.round((km / 22) * 60));
}

export async function listDeliveries(): Promise<Delivery[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from('deliveries').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) {
      return data.map((r: any) => ({
        code: r.code, bookingId: r.booking_id, customer: r.customer, phone: r.phone,
        address: r.address, destLat: r.dest_lat, destLng: r.dest_lng,
        agent: r.agent, agentPhone: r.agent_phone, status: r.status,
        agentLat: r.agent_lat, agentLng: r.agent_lng,
        updatedAt: r.updated_at, createdAt: r.created_at,
      }));
    }
  }
  return getLocalDeliveries();
}

export async function upsertDelivery(d: Delivery): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('deliveries').upsert({
      code: d.code, booking_id: String(d.bookingId), customer: d.customer, phone: d.phone,
      address: d.address, dest_lat: d.destLat, dest_lng: d.destLng,
      agent: d.agent, agent_phone: d.agentPhone, status: d.status,
      agent_lat: d.agentLat, agent_lng: d.agentLng, updated_at: new Date().toISOString(),
    }, { onConflict: 'code' });
  }
  const all = getLocalDeliveries();
  const i = all.findIndex((x) => x.code === d.code);
  if (i >= 0) all[i] = d; else all.unshift(d);
  saveLocalDeliveries(all.slice(0, 100));
}

export async function getDelivery(code: string): Promise<Delivery | null> {
  const c = code.toUpperCase();
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from('deliveries').select('*').eq('code', c).single();
    if (data) {
      return {
        code: data.code, bookingId: data.booking_id, customer: data.customer, phone: data.phone,
        address: data.address, destLat: data.dest_lat, destLng: data.dest_lng,
        agent: data.agent, agentPhone: data.agent_phone, status: data.status,
        agentLat: data.agent_lat, agentLng: data.agent_lng,
        updatedAt: data.updated_at, createdAt: data.created_at,
      };
    }
  }
  return getLocalDeliveries().find((x) => x.code === c) ?? null;
}
