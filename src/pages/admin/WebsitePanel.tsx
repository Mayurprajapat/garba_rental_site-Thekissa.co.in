// Admin → Website tab: change all site text, photos and numbers from here.
// Clients never need to touch code — press Save and the website updates instantly.

import { useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getSiteContent, pushSiteContentToCloud, resetSiteContent, saveSiteContent, type SiteContent } from '../../lib/siteContent';
import { formatAccessories, parseAccessories, type Category } from '../../data/products';
import { dataUrlToBlob, fileToCompressedDataUrl } from '../../lib/proof';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

const LOOK_CATS: Category[] = ['women', 'premium', 'men', 'kids', 'combo'];

const HERO_LABELS = [
  'Badi photo — main (desktop + mobile 1st)',
  'Chhoti overlapping photo — 2,000+ card wali',
  'Mobile 3rd photo — sirf phone me dikhti hai',
];

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="admin-card p-4 sm:p-5">
      <b className="text-[14px]">{title}</b>
      {hint && <p className="text-[12px] text-[#8a7584] mt-0.5">{hint}</p>}
      <div className="mt-3 space-y-2.5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="label-pro block">{label}<div className="mt-1.5">{children}</div></label>
  );
}

export default function WebsitePanel() {
  const [c, setC] = useState<SiteContent>(() => getSiteContent());
  const [msg, setMsg] = useState('');
  const [msgErr, setMsgErr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookUrl, setLookUrl] = useState('');
  const [lookBusy, setLookBusy] = useState(false);
  const [heroBusy, setHeroBusy] = useState<number | null>(null);
  const msgTimer = useRef<number | null>(null);

  const showMsg = (text: string, isErr: boolean, ms = 5000) => {
    setMsg(text);
    setMsgErr(isErr);
    if (msgTimer.current) window.clearTimeout(msgTimer.current);
    if (ms > 0) msgTimer.current = window.setTimeout(() => setMsg(''), ms);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    // 1) Isi phone/browser me save (hamesha) — fail ho to wahi ruk jao, jhootha success kabhi nahi
    const local = saveSiteContent(c);
    if (!local.ok) {
      showMsg(local.error || 'Save fail ho gaya.', true, 10000);
      setSaving(false);
      return;
    }
    // 2) Cloud connected hai to sab devices/customers ke liye push karo
    if (isSupabaseConfigured && supabase) {
      showMsg('Phone me saved ✓ — cloud (live website) me bhej rahe hain…', false, 0);
      const cloud = await pushSiteContentToCloud(c);
      if (cloud.ok) {
        showMsg('Saved — live on website ✓ (sab devices par dikhega)', false, 6000);
      } else {
        showMsg(`Phone me saved ✓, par CLOUD fail: ${cloud.error || ''}`, true, 12000);
      }
    } else {
      showMsg('Website updated — isi browser me live ✓', false, 5000);
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (!confirm('Reset all text to defaults?')) return;
    const d = resetSiteContent();
    setC(d);
    if (isSupabaseConfigured && supabase) {
      const cloud = await pushSiteContentToCloud(d);
      showMsg(cloud.ok ? 'Reset done — live on website ✓' : `Reset (local) ✓, par cloud fail: ${cloud.error || ''}`, !cloud.ok, 8000);
    } else {
      showMsg('Reset done.', false, 4000);
    }
  };

  // Photo upload — cloud ho to storage URL, warna compressed copy (same browser)
  const uploadImage = async (f: File, prefix: string): Promise<string | null> => {
    try {
      const small = await fileToCompressedDataUrl(f, 900, 0.72);
      if (isSupabaseConfigured && supabase) {
        const blob = (small ? dataUrlToBlob(small) : null) ?? (f.type.startsWith('image/') ? f : null);
        if (!blob) return null;
        const name = `${prefix}-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('product-images').upload(name, blob, { contentType: 'image/jpeg', upsert: true });
        if (error) { setMsg('Upload failed: ' + error.message); setTimeout(() => setMsg(''), 3000); return null; }
        return supabase.storage.from('product-images').getPublicUrl(name).data.publicUrl;
      }
      return small;
    } catch {
      return null;
    }
  };

  const uploadLook = (f: File) => uploadImage(f, 'look');

  // Hero ke 3 photos — index-wise replace (starting ke 2 cards + mobile 3rd)
  const replaceHeroImg = async (index: number, files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setHeroBusy(index);
    try {
      const url = await uploadImage(f, 'hero');
      if (url) setC((p) => {
        const imgs = [...(p.hero.imgs || [])];
        while (imgs.length < 3) imgs.push('');
        imgs[index] = url;
        return { ...p, hero: { ...p.hero, imgs: imgs.slice(0, 3) } };
      });
    } finally {
      setHeroBusy(null);
    }
  };

  const setHeroImg = (index: number, url: string) =>
    setC((p) => {
      const imgs = [...(p.hero.imgs || [])];
      while (imgs.length < 3) imgs.push('');
      imgs[index] = url;
      return { ...p, hero: { ...p.hero, imgs: imgs.slice(0, 3) } };
    });

  const addLookFiles = async (files: FileList | null) => {
    const list = [...(files ?? [])].slice(0, Math.max(0, 12 - c.looks.imgs.length));
    if (!list.length) return;
    setLookBusy(true);
    try {
      const urls: string[] = [];
      for (const f of list) {
        const url = await uploadLook(f);
        if (url) urls.push(url);
      }
      if (urls.length) setC((p) => ({ ...p, looks: { ...p.looks, imgs: [...p.looks.imgs, ...urls].slice(0, 12) } }));
    } finally {
      setLookBusy(false);
    }
  };

  const setStore = (k: keyof SiteContent['store'], v: string) =>
    setC((p) => ({ ...p, store: { ...p.store, [k]: v } }));

  return (
    <div>
      {msg && (
        <p className={`text-sm border rounded-xl px-4 py-2.5 mb-4 ${msgErr ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
          {msg}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 items-start">
        <Card title="Store / Contact" hint="Changing the number updates the call button, WhatsApp and invoice — everywhere, automatically.">
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Field label="Brand name"><input value={c.store.brand} onChange={(e) => setStore('brand', e.target.value)} className="admin-input" /></Field>
            <Field label="Mobile number"><input value={c.store.phone} onChange={(e) => setStore('phone', e.target.value)} className="admin-input" placeholder="10-digit" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Field label="Email"><input value={c.store.email} onChange={(e) => setStore('email', e.target.value)} className="admin-input" /></Field>
            <Field label="City"><input value={c.store.city} onChange={(e) => setStore('city', e.target.value)} className="admin-input" /></Field>
          </div>
          <Field label="Address (short)"><input value={c.store.addressShort} onChange={(e) => setStore('addressShort', e.target.value)} className="admin-input" /></Field>
          <Field label="Address (full)"><input value={c.store.addressLong} onChange={(e) => setStore('addressLong', e.target.value)} className="admin-input" /></Field>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Field label="Hours (full)"><input value={c.store.hours} onChange={(e) => setStore('hours', e.target.value)} className="admin-input" /></Field>
            <Field label="Hours (short)"><input value={c.store.hoursShort} onChange={(e) => setStore('hoursShort', e.target.value)} className="admin-input" /></Field>
          </div>
          <Field label="UPI ID (for QR payments)">
            <input value={c.store.upi} onChange={(e) => setStore('upi', e.target.value.trim())} className="admin-input" placeholder="e.g. yourname@okhdfc" />
            <p className="text-[11.5px] text-[#8a7584] mt-1">Customers scan this QR at checkout to pay half or full. Enter your GPay/PhonePe UPI ID here.</p>
          </Field>
        </Card>

        <Card title="Top banner" hint="The strip at the very top of the website.">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={c.announcement.show} onChange={(e) => setC((p) => ({ ...p, announcement: { ...p.announcement, show: e.target.checked } }))} className="w-4 h-4 accent-[#3d0a26]" />
            Show banner
          </label>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Field label="Badge"><input value={c.announcement.badge} onChange={(e) => setC((p) => ({ ...p, announcement: { ...p.announcement, badge: e.target.value } }))} className="admin-input" /></Field>
            <Field label="Message"><input value={c.announcement.msg} onChange={(e) => setC((p) => ({ ...p, announcement: { ...p.announcement, msg: e.target.value } }))} className="admin-input" /></Field>
          </div>
        </Card>

        <Card title="Hero (top headline)" hint="First screen — title, price and intro.">
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Field label="Title line 1"><input value={c.hero.titleA} onChange={(e) => setC((p) => ({ ...p, hero: { ...p.hero, titleA: e.target.value } }))} className="admin-input" /></Field>
            <Field label="Title line 2 (golden)"><input value={c.hero.titleB} onChange={(e) => setC((p) => ({ ...p, hero: { ...p.hero, titleB: e.target.value } }))} className="admin-input" /></Field>
          </div>
          <Field label="Subtitle"><textarea value={c.hero.subtitle} onChange={(e) => setC((p) => ({ ...p, hero: { ...p.hero, subtitle: e.target.value } }))} className="admin-input" rows={2} /></Field>
          <Field label="Starting price (e.g. ₹799)"><input value={c.hero.minPrice} onChange={(e) => setC((p) => ({ ...p, hero: { ...p.hero, minPrice: e.target.value } }))} className="admin-input" /></Field>
        </Card>

        <Card title="Hero photos (starting ke 2 cards + 2,000+ rentals)" hint="Homepage ke top wali 2 photos + mobile 3rd photo — yahi se change hongi. Phone se upload karo ya link paste karo, phir neeche Save dabao.">
          <div className="grid sm:grid-cols-3 gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border rounded-xl p-2.5 bg-[#faf7ef] space-y-2">
                <p className="text-[12px] font-bold">{HERO_LABELS[i]}</p>
                <img
                  src={(c.hero.imgs || [])[i] || ''}
                  alt={`Hero photo ${i + 1}`}
                  className="w-full h-32 object-cover rounded-xl border border-black/10 bg-white"
                />
                <label className="block text-center text-[12.5px] font-bold border rounded-xl px-3 py-2 cursor-pointer hover:bg-black hover:text-white transition">
                  {heroBusy === i ? 'Uploading…' : '📷 Change photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { replaceHeroImg(i, e.target.files); e.target.value = ''; }} />
                </label>
                <input
                  value={(c.hero.imgs || [])[i] || ''}
                  onChange={(e) => setHeroImg(i, e.target.value)}
                  placeholder="/images/… ya https://…"
                  className="admin-input !text-[11.5px] font-mono"
                />
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-[#8a7584]">1st = badi main photo · 2nd = 2,000+ card ke paas wali chhoti photo · 3rd = sirf mobile strip me. Save dabate hi website par live.</p>
        </Card>

        <Card title="Features (3 points below the hero)">
          {c.features.map((f, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={f} onChange={(e) => setC((p) => ({ ...p, features: p.features.map((x, j) => (j === i ? e.target.value : x)) }))} className="admin-input" />
              <button title="Delete" onClick={() => setC((p) => ({ ...p, features: p.features.filter((_, j) => j !== i) }))} className="shrink-0 w-10 grid place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white transition"><Trash2 size={13} /></button>
            </div>
          ))}
          <button onClick={() => setC((p) => ({ ...p, features: [...p.features, 'New point'] }))} className="text-[12.5px] font-bold border rounded-full px-3.5 py-1.5 flex items-center gap-1"><Plus size={13} /> Add point</button>
        </Card>

        <Card title="Refundable extra (%)" hint="Customer se rent ke upar kitna % refundable extra lena hai — calculation (shop, cart, bill, WhatsApp message, Terms/Refund pages) me automatic update ho jayega. Return par yehi amount wapas milta hai.">
          <Field label="Refund rate % (0–90)">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={90}
                value={c.refundablePct}
                onChange={(e) => {
                  const v = Math.min(90, Math.max(0, Math.round(Number(e.target.value) || 0)));
                  setC((p) => ({ ...p, refundablePct: v }));
                }}
                className="admin-input !w-28 text-center font-bold"
              />
              <input
                type="range"
                min={0}
                max={90}
                value={c.refundablePct}
                onChange={(e) => setC((p) => ({ ...p, refundablePct: Number(e.target.value) }))}
                className="flex-1 accent-[#3d0a26]"
                aria-label="Refund rate percent"
              />
              <b className="text-[14px] w-12 text-right">{c.refundablePct}%</b>
            </div>
          </Field>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 text-[12.5px]">
            <b>Live preview:</b> ₹1000 rent par <b>₹{Math.round((1000 * (c.refundablePct || 0)) / 100).toLocaleString('en-IN')}</b> refundable extra ({c.refundablePct}%)
            {' '}· ₹2000 rent par <b>₹{Math.round((2000 * (c.refundablePct || 0)) / 100).toLocaleString('en-IN')}</b>
          </div>
          <p className="text-[11.5px] text-[#8a7584]">0% = koi extra nahi · 30% = default (₹1000 par ₹300). Save dabate hi website + bill + WhatsApp message me naya rate lag jayega. Note: Features / FAQs / Shop note me likha “30%” text aapne khud likha hai — chaaho to wahi fields me bhi naya % likh do.</p>
          <div className="flex flex-wrap gap-1.5">
            {[0, 10, 20, 30, 50].map((v) => (
              <button key={v} onClick={() => setC((p) => ({ ...p, refundablePct: v }))} className={`text-[12px] font-bold border rounded-full px-3 py-1.5 transition ${c.refundablePct === v ? 'bg-[#1a0f1e] text-white border-[#1a0f1e]' : 'hover:border-[#1a0f1e]'}`}>{v}%</button>
            ))}
          </div>
        </Card>

        <Card title="Promo codes" hint="These codes give discounts at checkout. % means percent off.">
          {c.promos.map((pr, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={pr.code} onChange={(e) => setC((p) => ({ ...p, promos: p.promos.map((x, j) => (j === i ? { ...x, code: e.target.value.toUpperCase() } : x)) }))} placeholder="CODE" className="admin-input uppercase" />
              <input type="number" min={1} max={90} value={pr.percent} onChange={(e) => setC((p) => ({ ...p, promos: p.promos.map((x, j) => (j === i ? { ...x, percent: Number(e.target.value) } : x)) }))} className="admin-input !w-24" title="Percent off" />
              <span className="self-center text-xs font-bold text-[#8a7584]">% off</span>
              <button title="Delete" onClick={() => setC((p) => ({ ...p, promos: p.promos.filter((_, j) => j !== i) }))} className="shrink-0 w-10 grid place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white transition"><Trash2 size={13} /></button>
            </div>
          ))}
          <button onClick={() => setC((p) => ({ ...p, promos: [...p.promos, { code: 'NEW10', percent: 10 }] }))} className="text-[12.5px] font-bold border rounded-full px-3.5 py-1.5 flex items-center gap-1"><Plus size={13} /> Add code</button>
        </Card>

        <Card title="How it works (steps)">
          <Field label="Heading"><input value={c.process.title} onChange={(e) => setC((p) => ({ ...p, process: { ...p.process, title: e.target.value } }))} className="admin-input" /></Field>
          {c.process.steps.map((s, i) => (
            <div key={i} className="border rounded-xl p-2.5 space-y-2 bg-[#faf7ef]">
              <div className="grid grid-cols-[64px_1fr_auto] gap-1.5">
                <input value={s.n} onChange={(e) => setC((p) => ({ ...p, process: { ...p.process, steps: p.process.steps.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)) } }))} className="admin-input" placeholder="01" />
                <input value={s.h} onChange={(e) => setC((p) => ({ ...p, process: { ...p.process, steps: p.process.steps.map((x, j) => (j === i ? { ...x, h: e.target.value } : x)) } }))} className="admin-input" placeholder="Heading" />
                <button title="Delete" onClick={() => setC((p) => ({ ...p, process: { ...p.process, steps: p.process.steps.filter((_, j) => j !== i) } }))} className="w-10 grid place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white transition"><Trash2 size={13} /></button>
              </div>
              <input value={s.p} onChange={(e) => setC((p) => ({ ...p, process: { ...p.process, steps: p.process.steps.map((x, j) => (j === i ? { ...x, p: e.target.value } : x)) } }))} className="admin-input" placeholder="Detail line" />
            </div>
          ))}
          <button onClick={() => setC((p) => ({ ...p, process: { ...p.process, steps: [...p.process.steps, { n: `0${p.process.steps.length + 1}`, h: 'New step', p: '' }] } }))} className="text-[12.5px] font-bold border rounded-full px-3.5 py-1.5 flex items-center gap-1"><Plus size={13} /> Add step</button>
        </Card>

        <Card title="Customer photos" hint="One photo URL per line. Product photo links work too.">
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Field label="Small heading"><input value={c.looks.subtitle} onChange={(e) => setC((p) => ({ ...p, looks: { ...p.looks, subtitle: e.target.value } }))} className="admin-input" /></Field>
            <Field label="Big heading"><input value={c.looks.title} onChange={(e) => setC((p) => ({ ...p, looks: { ...p.looks, title: e.target.value } }))} className="admin-input" /></Field>
          </div>
          <Field label="Note (small text below)"><input value={c.looks.note} onChange={(e) => setC((p) => ({ ...p, looks: { ...p.looks, note: e.target.value } }))} className="admin-input" /></Field>
          <Field label={`Customer photos (${c.looks.imgs.length}/12) — first = leftmost on website`}>
            <div className="flex flex-wrap gap-1.5">
              {c.looks.imgs.map((src, i) => (
                <div key={`${src}-${i}`} className="relative">
                  <img src={src} alt="" className={`w-16 h-20 object-cover rounded-xl border-2 ${i === 0 ? 'border-black' : 'border-black/10'}`} />
                  {i === 0 && <span className="absolute top-0.5 left-0.5 text-[8.5px] font-black bg-black text-white rounded-full px-1.5 py-0.5">1ST</span>}
                  <button type="button" onClick={() => setC((p) => ({ ...p, looks: { ...p.looks, imgs: p.looks.imgs.filter((_, j) => j !== i) } }))} title="Remove photo" className="absolute -top-1.5 -right-1.5 w-5 h-5 grid place-items-center rounded-full bg-rose-600 text-white text-[11px] font-bold">✕</button>
                </div>
              ))}
              {c.looks.imgs.length < 12 && (
                <label title="Upload photos from phone" className="w-16 h-20 grid place-items-center rounded-xl border-2 border-dashed border-black/25 cursor-pointer hover:border-black hover:bg-black/5 transition text-xl font-bold text-black/40">+
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addLookFiles(e.target.files); e.target.value = ''; }} />
                </label>
              )}
            </div>
            {lookBusy && <p className="text-[12px] text-black/55 mt-1">Uploading…</p>}
            <div className="flex gap-1.5 mt-2">
              <input value={lookUrl} onChange={(e) => setLookUrl(e.target.value)} placeholder="Ya photo link paste karo, then + Add" className="admin-input"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (lookUrl.trim() && c.looks.imgs.length < 12) { setC((p) => ({ ...p, looks: { ...p.looks, imgs: [...p.looks.imgs, lookUrl.trim()].slice(0, 12) } })); setLookUrl(''); } } }} />
              <button type="button" onClick={() => { if (lookUrl.trim() && c.looks.imgs.length < 12) { setC((p) => ({ ...p, looks: { ...p.looks, imgs: [...p.looks.imgs, lookUrl.trim()].slice(0, 12) } })); setLookUrl(''); } }} className="shrink-0 text-[12.5px] font-bold border rounded-xl px-3.5 hover:bg-black hover:text-white transition">+ Add</button>
            </div>
            <p className="text-[11.5px] text-[#8a7584] mt-1">+ dabake phone se seedha upload karo ya link paste karo · ✕ se hatao · neeche Save dabana mat bhoolo.</p>
          </Field>
        </Card>

        <Card title="Complete look (dress card)" hint="When a dress is opened, the 'THE MODEL WORE THIS' box — heading, lines and default items. To set a different look for one dress, edit that dress in Products.">
          <Field label="Box heading"><input value={c.completeLook.title} onChange={(e) => setC((p) => ({ ...p, completeLook: { ...p.completeLook, title: e.target.value } }))} className="admin-input" placeholder="THE MODEL WORE THIS" /></Field>
          <Field label="Subtitle (below the heading)"><input value={c.completeLook.subtitle} onChange={(e) => setC((p) => ({ ...p, completeLook: { ...p.completeLook, subtitle: e.target.value } }))} className="admin-input" placeholder="The complete look is right here…" /></Field>
          <Field label="Bottom hint (add-on line)"><input value={c.completeLook.hint} onChange={(e) => setC((p) => ({ ...p, completeLook: { ...p.completeLook, hint: e.target.value } }))} className="admin-input" /></Field>
          {LOOK_CATS.map((cat) => (
            <Field key={cat} label={`Default lines — ${cat}${cat === 'women' || cat === 'premium' ? ' (active)' : ''} · one per line: name | included / free / price`}>
              <textarea
                value={formatAccessories(c.completeLook.defaults[cat] ?? [])}
                onChange={(e) => setC((p) => ({ ...p, completeLook: { ...p.completeLook, defaults: { ...p.completeLook.defaults, [cat]: parseAccessories(e.target.value) } } }))}
                className="admin-input font-mono !text-[12.5px]"
                rows={Math.max(3, (c.completeLook.defaults[cat] ?? []).length + 1)}
                placeholder={'Bandhani dupatta | included\nDandiya pair | free\nOxidised jhumka | 99'}
              />
            </Field>
          ))}
          <p className="text-[11.5px] text-[#8a7584]">included = included with the dress · free = free gift · only a number (e.g. 99) = paid add-on. Deleting a line removes the item, a new line adds a new item.</p>
        </Card>

        <Card title="FAQs" hint="Questions and answers — add or delete as many as you like.">
          {c.faqs.map((f, i) => (
            <div key={i} className="border rounded-xl p-2.5 space-y-2 bg-[#faf7ef]">
              <div className="flex gap-1.5">
                <input value={f.q} onChange={(e) => setC((p) => ({ ...p, faqs: p.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) }))} className="admin-input font-semibold" placeholder="Question" />
                <button title="Delete" onClick={() => setC((p) => ({ ...p, faqs: p.faqs.filter((_, j) => j !== i) }))} className="shrink-0 w-10 grid place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white transition"><Trash2 size={13} /></button>
              </div>
              <textarea value={f.a} onChange={(e) => setC((p) => ({ ...p, faqs: p.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) }))} className="admin-input" rows={2} placeholder="Answer" />
            </div>
          ))}
          <button onClick={() => setC((p) => ({ ...p, faqs: [...p.faqs, { q: 'New question?', a: '' }] }))} className="text-[12.5px] font-bold border rounded-full px-3.5 py-1.5 flex items-center gap-1"><Plus size={13} /> Add FAQ</button>
        </Card>

        <Card title="Booking panel" hint="The booking form section below.">
          <Field label="Heading"><input value={c.booking.title} onChange={(e) => setC((p) => ({ ...p, booking: { ...p.booking, title: e.target.value } }))} className="admin-input" /></Field>
          <Field label="Subtitle"><textarea value={c.booking.subtitle} onChange={(e) => setC((p) => ({ ...p, booking: { ...p.booking, subtitle: e.target.value } }))} className="admin-input" rows={2} /></Field>
          <Field label="Points (one line = one point)">
            <textarea value={c.booking.points.join('\n')} onChange={(e) => setC((p) => ({ ...p, booking: { ...p.booking, points: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) } }))} className="admin-input" rows={3} />
          </Field>
        </Card>

        <Card title="Footer + shop note">
          <Field label="Footer about"><textarea value={c.footer.about} onChange={(e) => setC((p) => ({ ...p, footer: { ...p.footer, about: e.target.value } }))} className="admin-input" rows={2} /></Field>
          <Field label="Delivery line"><input value={c.footer.delivery} onChange={(e) => setC((p) => ({ ...p, footer: { ...p.footer, delivery: e.target.value } }))} className="admin-input" /></Field>
          <Field label="Bottom credit (e.g. Built by Mayur (TEXOWEB.SOLUTIONS))"><input value={c.footer.credit} onChange={(e) => setC((p) => ({ ...p, footer: { ...p.footer, credit: e.target.value } }))} className="admin-input" /></Field>
          <Field label="Shop bottom note (line under the collection)"><input value={c.shopNote} onChange={(e) => setC((p) => ({ ...p, shopNote: e.target.value }))} className="admin-input" /></Field>
        </Card>
      </div>

      <div className="sticky bottom-3 mt-4 bg-white/95 backdrop-blur border rounded-2xl p-3 shadow-xl">
        {msg && (
          <p className={`text-[12.5px] font-semibold rounded-xl px-3.5 py-2 mb-2 ${msgErr ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
            {msg}
          </p>
        )}
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-[#1a0f1e] text-white font-semibold rounded-full py-3 text-sm disabled:opacity-60">
            {saving ? 'Saving…' : 'Save — live on website'}
          </button>
          <button onClick={handleReset} disabled={saving} className="border font-semibold rounded-full px-5 py-3 text-sm disabled:opacity-60">Reset</button>
        </div>
      </div>
    </div>
  );
}
