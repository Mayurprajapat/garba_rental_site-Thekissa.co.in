// Slot fetcher — cloud RPC preferred (sirf aggregates, koi PII public nahi),
// local fallback same-device bookings se. Offline ho to { qty: 0, live: false }.

import { getLocalBookings } from './localAdmin';
import { supabase, isSupabaseConfigured } from './supabase';
import { countBookedOn } from './availability';

export async function bookedQtyFor(productId: string, dateISO: string): Promise<{ qty: number; live: boolean }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('get_availability', { p_from: dateISO, p_to: dateISO });
      if (!error && Array.isArray(data)) {
        const row = (data as any[]).find((r) => String(r?.product_id) === productId);
        return { qty: Number(row?.qty) || 0, live: true };
      }
    } catch { /* fallback below */ }
  }
  try {
    return { qty: countBookedOn(productId, dateISO, getLocalBookings()), live: false };
  } catch {
    return { qty: 0, live: false };
  }
}
