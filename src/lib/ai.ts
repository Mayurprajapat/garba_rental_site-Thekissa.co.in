// AI Assistant brain — demo mode (runs without an API key)
// If VITE_AI_API_URL + VITE_AI_API_KEY are set, calls the live LLM; otherwise local smart rules.
// Local rules run on PRODUCTS data, so it never quotes wrong rates/sizes.

import { PRODUCTS } from '../data/products';
import { getRefundablePct } from './order';

const AI_URL = (import.meta.env.VITE_AI_API_URL as string) || '';
const AI_KEY = (import.meta.env.VITE_AI_API_KEY as string) || '';

// NOTE: This key becomes PUBLIC in the frontend bundle — never put a real provider secret
// here. Use your backend proxy URL for the live LLM and
// always keep secrets server-side.
if (AI_KEY && typeof location !== 'undefined' && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
  console.warn('[ai] VITE_AI_API_KEY is bundled publicly in the frontend. Use a backend proxy and keep real provider keys server-side.');
}

export interface ChatProduct {
  id: string;
  name: string;
  price: number;
  fabric: string;
}

function pickProducts(query: string, limit = 3): ChatProduct[] {
  const q = query.toLowerCase();
  let list = [...PRODUCTS];

  // category detect (ladies-only catalog)
  if (/bridal|premium|designer|dulhan|lehenga/.test(q)) list = list.filter((p) => p.category === 'premium');
  else if (/chaniya|choli|blouse|ghaghra|women|ladies|koti|dupatta/.test(q)) list = list.filter((p) => p.category === 'women');

  // budget detect — "1500", "₹2000", "under 2000"
  const m = q.match(/(\d{3,5})/);
  if (m) {
    const budget = parseInt(m[1], 10);
    if (budget >= 500 && budget <= 15000) {
      list = list.filter((p) => p.rent1 <= budget).sort((a, b) => b.rating - a.rating);
    }
  }

  // color detect
  const colors = ['red', 'white', 'black', 'yellow', 'green', 'pink', 'wine', 'gold', 'navy', 'mirror', 'multicolor'];
  const wantColor = colors.find((c) => q.includes(c));
  if (wantColor) {
    const matched = list.filter((p) =>
      `${p.name} ${p.colors.join(' ')} ${p.hindi}`.toLowerCase().includes(wantColor)
    );
    if (matched.length) list = matched;
  }

  if (!list.length) list = [...PRODUCTS].sort((a, b) => b.rating - a.rating);
  return list.slice(0, limit).map((p) => ({ id: p.id, name: p.name, price: p.rent1, fabric: p.fabric }));
}

function localReply(query: string): { text: string; products: ChatProduct[] } {
  const q = query.toLowerCase();

  if (/namaste|hello|hi\b|hey|sat sri|kem cho/.test(q) && q.length < 20) {
    return {
      text: 'Hello! I am the TheKissa.co assistant. Tell me your budget, size and occasion — e.g. "women white look under 1500, size M" — and I will share the 3 best options.',
      products: pickProducts('', 3),
    };
  }
  if (/couple|combo|groom|dulha|men|kediyu|dhoti|kid|bacha|bachi|child|children|chhota|nanha/.test(q)) {
    return { text: 'We are a ladies-only rental studio — no menswear, couple sets or kids range. Here are the best 3 ladies options for you:', products: pickProducts('', 3) };
  }
  if (/jhumka|jewell|accessor|kamarbandh|mojari|pagdi|dandiya|dupatta|latkan|complete look|poora look|model ne/.test(q)) {
    return { text: 'Every dress page has a "The model wore this" list. Tick items to add them with the dress — and if you like a single item (e.g. only the jhumkas), press "Only this" to rent it alone without the dress. Which dress are you looking at?', products: pickProducts(query, 3) };
  }
  if (/deposit/.test(q)) {
    const pct = (() => { try { return getRefundablePct(); } catch { return 30; } })();
    return { text: `The refundable extra (${pct}% of rent) is 100% refundable — returned via UPI/cash within 24 hours of return and quality check. Normal wear is never charged.`, products: [] };
  }
  if (/deliver|delivery|shipping|kitne din|kab aayega/.test(q)) {
    return { text: 'We deliver in 1-2 hours in Indore. Delivery is free on bulk orders.', products: [] };
  }
  if (/size/.test(q)) {
    return { text: 'Sizes S to XXL available — tell me your size and I will suggest the best option.', products: pickProducts(query, 3) };
  }
  if (/price|rate|rent|cost|charge|paisa/.test(q) && !/\d/.test(q)) {
    return { text: 'Rent starts at ₹299 — Blouse ₹299+, Chaniya Choli ₹779+, Premium Bridal ₹1499+. What is your budget?', products: pickProducts('', 3) };
  }
  if (/book|order|reserve|buy|lena hai/.test(q)) {
    const recs = pickProducts(query, 3);
    return { text: `Great choice! These ${recs.length} options will suit you best. Select one and press Reserve in the Shop — your booking locks with just a 50% half payment (or pay in full).`, products: recs };
  }

  const recs = pickProducts(query, 3);
  if (recs.length) {
    const lines = recs.map((r, i) => `${i + 1}. ${r.name} (${r.id}) — ₹${r.price.toLocaleString('en-IN')} · ${r.fabric}`).join('\n');
    return { text: `Here are your ${recs.length} best matches:\n${lines}\n\nTell me more about size or budget and I will filter further?`, products: recs };
  }
  return { text: 'Got it! Share your budget + size — e.g. "wine chaniya M under 2000".', products: [] };
}

export async function askAssistant(query: string): Promise<{ text: string; products: ChatProduct[]; live: boolean }> {
  // If a live LLM is configured, send it there (with products context)
  if (AI_URL && AI_KEY) {
    try {
      const res = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_KEY}` },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are TheKissa.co Garba Rental assistant. Reply in English, short. Only suggest from this catalog: ${PRODUCTS.map((p) => `${p.id}:${p.name}:Rs${p.rent1}:${p.category}`).join(', ')}. Never invent price. All rentals are 1-day only.`,
            },
            { role: 'user', content: query },
          ],
        }),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || data?.text || '';
      if (text) return { text, products: pickProducts(query, 3), live: true };
    } catch {
      // fallback local
    }
  }
  const r = localReply(query);
  return { ...r, live: false };
}
