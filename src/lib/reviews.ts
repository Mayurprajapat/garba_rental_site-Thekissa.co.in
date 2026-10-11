// Photo reviews — cloud shared (approved only public) + same-device local.
// RLS: anon INSERT (sanity-checked) + anon SELECT approved; admin manages all.

import { isSupabaseConfigured, supabase } from './supabase';

export interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number;
  text: string;
  photo?: string;
  status: 'pending' | 'approved';
  date: string;
}

const KEY = 'raasleela-reviews';

function parse(raw: string | null): Review[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as Review[];
  } catch { /* ignore */ }
  return [];
}

export function getLocalReviews(productId?: string): Review[] {
  try {
    const all = parse(localStorage.getItem(KEY));
    return productId ? all.filter((r) => r.productId === productId) : all;
  } catch {
    return [];
  }
}

export function saveLocalReview(r: Review) {
  try {
    const all = [r, ...parse(localStorage.getItem(KEY)).filter((x) => x.id !== r.id)].slice(0, 60);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export async function fetchApprovedReviews(productId: string): Promise<Review[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !Array.isArray(data)) return [];
    return (data as any[]).map((r) => ({
      id: String(r.id),
      productId: String(r.product_id || productId),
      name: String(r.name || 'Customer'),
      rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
      text: String(r.text || ''),
      photo: r.photo_url ? String(r.photo_url) : undefined,
      status: 'approved' as const,
      date: String(r.created_at || new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export async function submitReview(input: {
  productId: string;
  name: string;
  rating: number;
  text: string;
  photoUrl?: string;
}): Promise<'cloud' | 'local'> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: input.productId,
        name: input.name.trim().slice(0, 60),
        rating: input.rating,
        text: input.text.trim().slice(0, 500),
        photo_url: input.photoUrl || '',
        status: 'pending',
      });
      if (!error) return 'cloud';
    } catch { /* local fallback below */ }
  }
  saveLocalReview({
    id: `local-${Date.now()}`,
    productId: input.productId,
    name: input.name.trim(),
    rating: input.rating,
    text: input.text.trim(),
    photo: input.photoUrl || undefined,
    status: 'approved',
    date: new Date().toISOString(),
  });
  return 'local';
}
