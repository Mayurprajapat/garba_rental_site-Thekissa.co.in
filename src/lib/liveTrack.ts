// Live GPS layer — bina account/server ke (public MQTT broker).
// Agent position publish karta hai, customer ka map subscribe karke live dekhta hai.
// Link me snapshot bhi hota hai taaki alag phone par first paint turant ho,
// phir MQTT se live position aati rehti hai. Same-browser localStorage flow untouched.

export interface TrackPing {
  lat: number;
  lng: number;
  status: string;
  ts: string;
}

const BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
const PREFIX = 'thekissa/garba/';

export function topicFor(code: string): string {
  return `${PREFIX}${(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
}

/** Delivery snapshot → URL hash (unicode-safe base64url) */
export function encodeSnapshot(d: unknown): string {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(d))));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSnapshot<T>(s: string): T | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64)))) as T;
  } catch {
    return null;
  }
}

export function snapshotFromHash<T>(): T | null {
  try {
    const h = typeof window === 'undefined' ? '' : window.location.hash;
    if (!h.startsWith('#s=')) return null;
    return decodeSnapshot<T>(h.slice(3));
  } catch {
    return null;
  }
}

let client: any = null;
let subs: { code: string; cb: (p: TrackPing) => void }[] = [];

async function ensureClient(): Promise<any> {
  if (client) return client;
  const { default: mqtt } = await import('mqtt');
  for (const url of BROKERS) {
    try {
      const c: any = await new Promise((resolve, reject) => {
        const conn = mqtt.connect(url, { reconnectPeriod: 4000, connectTimeout: 8000 });
        const to = setTimeout(() => {
          try { conn.end(true); } catch { /* ignore */ }
          reject(new Error('timeout'));
        }, 9000);
        conn.once('connect', () => { clearTimeout(to); resolve(conn); });
        conn.once('error', () => {
          clearTimeout(to);
          try { conn.end(true); } catch { /* ignore */ }
          reject(new Error('connect failed'));
        });
      });
      client = c;
      c.on('message', (topic: string, raw: Uint8Array) => {
        let p: TrackPing | null = null;
        try { p = JSON.parse(raw.toString()) as TrackPing; } catch { /* ignore */ }
        if (!p || typeof p.lat !== 'number') return;
        subs.filter((s) => topicFor(s.code) === topic).forEach((s) => {
          try { s.cb(p as TrackPing); } catch { /* ignore */ }
        });
      });
      subs.forEach((s) => {
        try { c.subscribe(topicFor(s.code)); } catch { /* ignore */ }
      });
      return client;
    } catch {
      client = null;
    }
  }
  return null;
}

/** Customer map: live position suno. Returns unsubscribe. */
export function subscribeTrack(code: string, cb: (p: TrackPing) => void): () => void {
  const sub = { code, cb };
  subs.push(sub);
  ensureClient()
    .then((c) => {
      if (c) {
        try { c.subscribe(topicFor(code)); } catch { /* ignore */ }
      }
    })
    .catch(() => { /* offline — snapshot map still works */ });
  return () => {
    subs = subs.filter((s) => s !== sub);
  };
}

/** Agent side: position bhejo (retain — late joiner ko turant milegi). */
export async function publishPing(code: string, ping: TrackPing): Promise<boolean> {
  try {
    const c = await ensureClient();
    if (!c) return false;
    c.publish(topicFor(code), JSON.stringify(ping), { retain: true, qos: 0 });
    return true;
  } catch {
    return false;
  }
}
