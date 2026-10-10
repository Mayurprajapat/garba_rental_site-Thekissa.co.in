import { addLocalBooking } from './localAdmin';
import { isSupabaseConfigured, supabase } from './supabase';

// Booking save — hamesha local me (admin panel me dikhega),
// Supabase laga ho to waha bhi.
//
// Resilient: agar cloud schema purana ho (migration pending) to
// pehle full row try karo, column error aaye to legacy minimal row retry.
// Isse migration run kiye bina bhi booking kabhi fail nahi hoti.
export async function saveBooking(payload: {
  name: string;
  phone: string;
  category?: string;
  size?: string;
  event_date?: string | null;
  plan?: string;
  note?: string;
  items?: any[];
  subtotal?: number;
  total?: number;
  order_id?: string;
  token_amount?: number;
  deposit?: number;
  deposit_status?: string;
  payment_mode?: string;
  payment_id?: string;
  payment_status?: string;
  /** Admin sets the date by which the order will be ready (YYYY-MM-DD) */
  ready_date?: string | null;
  /** Admin's message for the customer (Out of stock / Available etc.) */
  admin_note?: string | null;
  /** Bot-trap — bhara ho to booking silently drop (spam se bachao) */
  honeypot?: string;
}) {
  // Honeypot bhara = bot. Success jaisa response, par save mat karo.
  if (payload.honeypot && payload.honeypot.trim()) return { ok: true as const, mode: 'local' as const };
  try {
    addLocalBooking({
      order_id: payload.order_id,
      name: payload.name,
      phone: payload.phone,
      category: payload.category ?? '',
      size: payload.size ?? '',
      event_date: payload.event_date || null,
      plan: payload.plan ?? '',
      note: payload.note ?? '',
      items: payload.items ?? [],
      subtotal: payload.subtotal ?? 0,
      total: payload.total ?? 0,
      token_amount: payload.token_amount ?? 0,
      deposit: payload.deposit ?? 0,
      deposit_status: payload.deposit_status ?? 'pending',
      payment_mode: payload.payment_mode ?? 'pending',
      payment_id: payload.payment_id ?? '',
      payment_status: payload.payment_status ?? 'pending',
      ready_date: payload.ready_date ?? null,
      admin_note: payload.admin_note ?? null,
    });
  } catch { /* ignore */ }

  if (!isSupabaseConfigured || !supabase) return { ok: true as const, mode: 'local' as const };
  const row = {
    order_id: payload.order_id ?? '',
    name: payload.name,
    phone: payload.phone,
    category: payload.category ?? '',
    size: payload.size ?? '',
    event_date: payload.event_date || null,
    plan: payload.plan ?? '',
    note: payload.note ?? '',
    items: payload.items ?? [],
    subtotal: payload.subtotal ?? 0,
    total: payload.total ?? 0,
    token_amount: payload.token_amount ?? 0,
    deposit: payload.deposit ?? 0,
    deposit_status: payload.deposit_status ?? 'pending',
    payment_mode: payload.payment_mode ?? 'pending',
    payment_id: payload.payment_id ?? '',
    payment_status: payload.payment_status ?? 'pending',
    ready_date: payload.ready_date ?? null,
    admin_note: payload.admin_note ?? null,
    status: 'new',
  };
  let { error } = await supabase.from('bookings').insert(row);
  if (error && isMissingColumnError(error.message)) {
    // Cloud me naye columns nahi hain (migration pending) — unke bina retry
    const { ready_date: _r, admin_note: _n, ...withoutNew } = row;
    ({ error } = await supabase.from('bookings').insert(withoutNew));
  }
  if (error && isMissingColumnError(error.message)) {
    // Purana cloud schema — sirf base columns ke saath retry
    const legacy = {
      name: row.name,
      phone: row.phone,
      category: row.category,
      size: row.size,
      event_date: row.event_date,
      plan: row.plan,
      note: row.note,
      status: 'new',
    };
    ({ error } = await supabase.from('bookings').insert(legacy));
  }
  if (error) {
    console.error('Booking save failed', error);
    return { ok: true as const, mode: 'local' as const };
  }
  return { ok: true as const, mode: 'cloud' as const };
}

function isMissingColumnError(msg: string): boolean {
  return /column|schema cache|does not exist|unknown column|deposit|order_id|token_amount|payment_mode/i.test(msg);
}
