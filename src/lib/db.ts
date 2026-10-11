import { addLocalBooking, getLocalBookings } from './localAdmin';
import { getMyOrders, mergeMyOrders, type MyOrder } from './myOrders';
import { isSupabaseConfigured, supabase } from './supabase';

/** Cloud lookup health — RPC functions (SETUP_ONCE) missing hon to 'missing'. */
let lookupDiag: 'ok' | 'missing' | 'unknown' = 'unknown';
export function cloudLookupDiag(): 'ok' | 'missing' | 'unknown' {
  return lookupDiag;
}
function noteRpcError(e: any) {
  const m = `${String(e?.message || '')} ${String(e?.code || '')}`;
  if (/could not find the function|PGRST202|does not exist/i.test(m)) lookupDiag = 'missing';
}

// Booking save — hamesha local me (admin panel me dikhega),
// Supabase laga ho to waha bhi.
//
// MANUAL CONFIRM: naya order hamesha 'new' (pending) save hota hai —
// admin genuine payment dekhkar 1 tap me confirm karta hai, nakli UTR /
// galat screenshot wala 1 tap me cancel. Typed UTR ko 100% auto-verify
// koi system nahi kar sakta (UTR me checksum nahi hota), isliye
// confirmation admin ke haath me hai. payment_status alag rehta hai
// ('unverified') — Reports → Payments me jab time mile tab verify karo.
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
  /** Checkout me laga promo code (uppercase, optional) */
  promo_code?: string | null;
  /** Payment screenshot (cloud URL ya compressed dataURL) */
  payment_proof?: string | null;
  /** Admin sets the date by which the order will be ready (YYYY-MM-DD) */
  ready_date?: string | null;
  /** Admin's message for the customer (Out of stock / Available etc.) */
  admin_note?: string | null;
  /** Customer's delivery address (filled at checkout) */
  address?: string | null;
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
      address: payload.address ?? null,
      promo_code: payload.promo_code ?? null,
      payment_proof: payload.payment_proof ?? null,
      status: 'new',
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
    address: payload.address ?? null,
    promo_code: payload.promo_code ?? null,
    payment_proof: payload.payment_proof ?? null,
    status: 'new',
  };
  let { error } = await supabase.from('bookings').insert(row);
  if (error && isMissingColumnError(error.message)) {
    // Cloud me naye columns nahi hain (migration pending) — unke bina retry
    const { ready_date: _r, admin_note: _n, address: _a, promo_code: _p, payment_proof: _f, ...withoutNew } = row;
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

/** Supabase booking row → MyOrder (customer view). Items ka shape alag ho to bhi safe. */
function bookingRowToMyOrder(r: any): MyOrder | null {
  try {
    const orderId = String(r.order_id || '').trim() || `#${String(r.id ?? '').slice(-6)}`;
    if (!orderId || orderId === '#') return null;
    const rawItems = Array.isArray(r.items) ? r.items : [];
    const items = rawItems.map((it: any, i: number) => {
      const imgRaw = String(it?.img || it?.single?.img || '').trim();
      const pidRaw = String(it?.id || it?.pid || '').trim();
      return {
        name: String(it?.name || it?.id || `Item ${i + 1}`),
        detail: [it?.size, it?.plan, Array.isArray(it?.addons) && it.addons.length ? `+ ${it.addons.join(', ')}` : '']
          .filter(Boolean).join(' · ') || '1-day rental',
        qty: Number(it?.qty || 1),
        price: Number(it?.price ?? it?.rent ?? 0) || 0,
        // Photo — checkout par save hui img, warna single accessory ki img
        img: imgRaw || undefined,
        pid: pidRaw || undefined,
      };
    });
    // Purane rows me items khaali ho sakte hain — tab note se ek line banao taaki order khaali na lage
    const safeItems = items.length ? items : [{
      name: 'Festive outfit rental',
      detail: String(r.note || r.category || '1-day rental').slice(0, 120),
      qty: 1,
      price: Number(r.total || r.subtotal || 0),
    }];
    // Cloud/admin ka status jaisa hai waisa — customer ko wahi dikhega
    // (confirmed / onway / delivered / returned / cancelled).
    const status = String(r.status || 'new');
    return {
      id: orderId,
      date: String(r.created_at || new Date().toISOString()),
      name: String(r.name || ''),
      phone: String(r.phone || ''),
      event: String(r.event_date || 'TBD'),
      items: safeItems,
      total: Number(r.total ?? r.subtotal ?? 0),
      deposit: Number(r.deposit ?? 0),
      token: Number(r.token_amount ?? 0),
      mode: String(r.payment_mode || 'pay-on-delivery'),
      status,
      payStatus: String(r.payment_status || 'unverified'),
      proof: r.payment_proof ? String(r.payment_proof) : undefined,
      note: r.admin_note ? String(r.admin_note) : undefined,
      readyDate: r.ready_date ? String(r.ready_date) : undefined,
    };
  } catch { return null; }
}

/**
 * Mobile number se orders dhoondo — pehle is device (local), phir cloud (Supabase).
 * Cloud me naya secure RPC ho to wahi use hota hai (poori table public nahi khulti);
 * purane setup par direct select try hota hai, RLS block kare to local result hi wapas.
 * Mile hue cloud orders local me merge bhi ho jate hain taaki agli baar bina net ke dikhein.
 */
export async function fetchOrdersByPhone(phone: string): Promise<{ orders: MyOrder[]; source: 'local' | 'cloud' | 'both' }> {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return { orders: [], source: 'local' };

  const localByPhone = getMyOrders().filter((o) =>
    String(o.phone || '').replace(/\D/g, '').slice(-10) === digits
  );
  // Same device par admin-bookings me bhi ho sakta hai (local mode)
  try {
    for (const b of getLocalBookings()) {
      if (String(b.phone || '').replace(/\D/g, '').slice(-10) !== digits) continue;
      const converted = bookingRowToMyOrder({ ...b, admin_note: (b as any).admin_note, ready_date: (b as any).ready_date });
      if (converted && !localByPhone.some((o) => o.id === converted.id)) localByPhone.push(converted);
    }
  } catch { /* ignore */ }

  if (!isSupabaseConfigured || !supabase) return { orders: localByPhone, source: 'local' };

  try {
    // 1) Secure function (migration_customer_orders_lookup.sql) — sirf apne number ke orders
    const rpc = await supabase.rpc('get_my_orders_by_phone', { p_phone: digits });
    if (!rpc.error && Array.isArray(rpc.data)) {
      lookupDiag = 'ok';
      const cloud = (rpc.data as any[]).map(bookingRowToMyOrder).filter((x): x is MyOrder => !!x);
      if (cloud.length) {
        mergeMyOrders(cloud);
        const merged = new Map<string, MyOrder>();
        [...localByPhone, ...cloud].forEach((o) => { if (!merged.has(o.id)) merged.set(o.id, o); });
        return { orders: [...merged.values()], source: 'both' };
      }
      return { orders: localByPhone, source: localByPhone.length ? 'local' : 'cloud' };
    }
    if (rpc.error) noteRpcError(rpc.error);
    // 2) Fallback — purana setup (RLS allow kare to hi chalega)
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(100);
    if (!error && Array.isArray(data)) {
      const mine = (data as any[])
        .filter((r) => String(r.phone || '').replace(/\D/g, '').slice(-10) === digits)
        .map(bookingRowToMyOrder)
        .filter((x): x is MyOrder => !!x);
      if (mine.length) {
        mergeMyOrders(mine);
        const merged = new Map<string, MyOrder>();
        [...localByPhone, ...mine].forEach((o) => { if (!merged.has(o.id)) merged.set(o.id, o); });
        return { orders: [...merged.values()], source: 'both' };
      }
    }
  } catch { /* network/RLS — local hi sahi */ }
  return { orders: localByPhone, source: 'local' };
}

/** UTR pehle kisi order me use hua ya nahi (secure RPC — sirf true/false, koi data leak nahi).
 *  RPC/column missing ho to false (genuine order kabhi block nahi hoga). */
export async function isUtrUsed(utr: string): Promise<boolean> {
  const needle = String(utr || '').trim();
  if (!/^\d{12}$/.test(needle)) return false;
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { data, error } = await supabase.rpc('check_utr_used', { p_utr: needle });
    if (error) { noteRpcError(error); return false; }
    lookupDiag = 'ok';
    return data === true;
  } catch (e) {
    noteRpcError(e);
    return false;
  }
}

/** Is mobile number se aaj kitne orders bheje gaye (spam rokne ke liye). Fail-open. */
export async function todayOrderCount(phone: string): Promise<number> {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return 0;
  try {
    const { orders } = await fetchOrdersByPhone(digits);
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter((o) => String(o.date || '').slice(0, 10) === today).length;
  } catch {
    return 0;
  }
}
/** Order ID se ek order dhoondo (local + cloud).
 *  refresh:true ho to local milne par bhi cloud se taza status lao (sync ke liye). */
export async function fetchOrderById(orderId: string, opts?: { refresh?: boolean }): Promise<MyOrder | null> {
  const needle = String(orderId || '').trim().toUpperCase();
  if (!needle) return null;
  if (!opts?.refresh) {
    const local = getMyOrders().find((o) => String(o.id || '').toUpperCase() === needle);
    if (local) return local;
  }
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const rpc = await supabase.rpc('get_my_order_by_id', { p_order_id: needle });
    if (!rpc.error && rpc.data) {
      lookupDiag = 'ok';
      const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
      if (row) {
        const converted = bookingRowToMyOrder(row);
        if (converted) { mergeMyOrders([converted]); return converted; }
      }
    } else if (rpc.error) {
      noteRpcError(rpc.error);
    }
  } catch (e) {
    noteRpcError(e);
  }
  return getMyOrders().find((o) => String(o.id || '').toUpperCase() === needle) ?? null;
}
