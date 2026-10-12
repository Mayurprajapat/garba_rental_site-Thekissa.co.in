// Admin → Website tab: change all site text, photos and numbers from here.
// Clients never need to touch code — press Save and the website updates instantly.

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getSiteContent, resetSiteContent, saveSiteContent, type SiteContent } from '../../lib/siteContent';
import { formatAccessories, parseAccessories, type Category } from '../../data/products';

const LOOK_CATS: Category[] = ['women', 'premium', 'men', 'kids', 'combo'];

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

  const save = () => {
    saveSiteContent(c);
    setMsg('Website updated — live on site.');
    setTimeout(() => setMsg(''), 3000);
  };

  const setStore = (k: keyof SiteContent['store'], v: string) =>
    setC((p) => ({ ...p, store: { ...p.store, [k]: v } }));

  return (
    <div>
      {msg && <p className="text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4">{msg}</p>}

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
          <Field label="Photos (one line = one photo)">
            <textarea value={c.looks.imgs.join('\n')} onChange={(e) => setC((p) => ({ ...p, looks: { ...p.looks, imgs: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) } }))} className="admin-input" rows={5} />
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

      <div className="sticky bottom-3 mt-4 flex gap-2 bg-white/95 backdrop-blur border rounded-2xl p-3 shadow-xl">
        <button onClick={save} className="flex-1 bg-[#1a0f1e] text-white font-semibold rounded-full py-3 text-sm">Save — live on website</button>
        <button onClick={() => { if (confirm('Reset all text to defaults?')) { const d = resetSiteContent(); setC(d); setMsg('Reset done.'); setTimeout(() => setMsg(''), 3000); } }} className="border font-semibold rounded-full px-5 py-3 text-sm">Reset</button>
      </div>
    </div>
  );
}
