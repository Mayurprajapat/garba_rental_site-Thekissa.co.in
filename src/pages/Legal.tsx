import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Search } from 'lucide-react';
import { Footer } from '../components/Sections';
import { STORE } from '../data/store';
import { getDelivery, listDeliveries, type Delivery } from '../lib/delivery';

export const BUSINESS = {
  name: STORE.name,
  brand: `${STORE.brand} Atelier`,
  address: STORE.addressLong,
  phone: STORE.phoneDisplay,
  phoneHref: STORE.phoneHref,
  email: STORE.email,
  hours: STORE.hours,
};

function Shell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fdf9f0]">
      <header className="bg-gradient-to-r from-[#4d0f1f] via-[#641629] to-[#4d0f1f] text-white">
        <div className="container-x py-4 flex items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl grid place-items-center font-display font-black bg-white text-[#641629]">K</span>
            <span className="font-display text-lg">The Kissa</span>
          </Link>
          <Link to="/" className="ml-auto text-xs font-semibold text-white/70 hover:text-white">← Back to website</Link>
        </div>
      </header>
      <main className="container-x py-10 md:py-14 max-w-3xl">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#641629]">{title}</h1>
        <p className="text-xs text-black/45 mt-2">Last updated: {updated}</p>
        <div className="mt-6 space-y-5 text-[14.5px] leading-relaxed text-[#3d2b36]">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-bold text-[17px] text-[#641629] pt-2">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export function AboutPage() {
  return (
    <Shell title="About Us" updated="October 2026">
      <P>
        <b>{BUSINESS.name}</b> ({BUSINESS.brand}) is an online-only Garba outfit rental brand from Indore, serving
        customers across the city since 2018. We rent designer Chaniya Choli, Kediyu-Dhoti sets, kids Garba outfits, couple/family
        combos and premium bridal couture — with steam-pressed finishing and
        doorstep delivery &amp; return.
      </P>
      <H>What we offer</H>
      <Ul
        items={[
          '3-day standard rental and 9-day full-Navratri rental plans.',
          'Free size-exchange at your doorstep if the fit is off.',
          'Same-day delivery in Indore; 1–2 days across MP, 3–5 days pan-India.',
          'Every outfit is dry-cleaned, sanitised and quality-checked before dispatch.',
        ]}
      />
      <H>Contact us</H>
      <P>
        {BUSINESS.address}
        <br />
        Phone: <a className="underline font-semibold" href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>
        <br />
        Email: <a className="underline font-semibold" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        <br />
        Hours: {BUSINESS.hours}
      </P>
    </Shell>
  );
}

export function ContactPage() {
  return (
    <Shell title="Contact Us" updated="October 2026">
      <P>For bookings, fittings, delivery queries or support, reach us on any of these channels — we reply within 30 minutes between 10 AM and 9 PM.</P>
      <H>Service area</H>
      <P>Online only — doorstep delivery &amp; pickup across Indore (1–2 days across MP, 3–5 days pan-India). No walk-in store.</P>
      <H>Phone &amp; WhatsApp</H>
      <P>
        <a className="underline font-semibold" href={BUSINESS.phoneHref}>{BUSINESS.phone}</a> — call or WhatsApp “Hi The Kissa!”.
      </P>
      <H>Email</H>
      <P>
        <a className="underline font-semibold" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> — for invoices, receipts and formal requests.
      </P>
      <H>Hours</H>
      <P>{BUSINESS.hours}</P>
    </Shell>
  );
}

export function TermsPage() {
  return (
    <Shell title="Terms & Conditions" updated="October 2026">
      <P>
        By booking or renting from {BUSINESS.name} (“The Kissa”, “we”), you agree to these terms. If you do not agree,
        please do not place a booking.
      </P>
      <H>1. Rental period</H>
      <P>
        The standard rental is 3 days (pickup/event/return). The full-Navratri plan covers 9 days. Late returns are
        charged at 25% of the 3-day rent per extra day unless an extension is confirmed with us in advance.
      </P>
      <H>2. Booking &amp; payment</H>
      <Ul
        items={[
          'A booking is confirmed after a token advance (20% of total rent, minimum ₹499) or full payment, online or on delivery.',
          'Online payments are processed securely via Razorpay (UPI, cards, netbanking). We never see or store your card details.',
          'The balance rent plus a refundable security deposit is collected on delivery/pickup.',
        ]}
      />
      <H>3. Security deposit</H>
      <P>
        A refundable deposit (shown per product, typically ₹1,000–₹4,000) is collected on delivery. It is refunded via
        UPI/cash within 24 hours of return and quality check. Normal wear and light dry-cleanable stains are never charged.
      </P>
      <H>4. Damage &amp; loss</H>
      <P>
        Major damage (tears, burns, permanent stains) is charged at actual repair cost only; loss of an outfit is charged
        at the listed buy price minus rent already paid. An optional ₹199 damage cover waives minor-damage charges.
      </P>
      <H>5. Fitting &amp; size exchange</H>
      <P>
        If a confirmed outfit does not fit or cannot be made available, we offer an
        equivalent replacement or a full refund of amounts paid — your choice.
      </P>
      <H>6. Conduct &amp; misuse</H>
      <P>
        Outfits are for personal wear only and may not be sub-rented, copied for commercial production, or used in a
        way that damages them beyond normal festive wear.
      </P>
      <H>7. Governing law</H>
      <P>These terms are governed by the laws of India. Disputes fall under the jurisdiction of courts in Indore, Madhya Pradesh.</P>
      <H>8. Contact</H>
      <P>
        Questions about these terms: <a className="underline font-semibold" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> /{' '}
        <a className="underline font-semibold" href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>.
      </P>
    </Shell>
  );
}

export function PrivacyPage() {
  return (
    <Shell title="Privacy Policy" updated="October 2026">
      <P>
        {BUSINESS.name} respects your privacy. This policy explains what data we collect, why, and your rights. By
        using our website you consent to this policy.
      </P>
      <H>1. Data we collect</H>
      <Ul
        items={[
          'Contact details you share while booking: name, mobile number, event date, size and address.',
          'Order details: items rented, amounts, payment mode and transaction reference.',
          'Basic technical data: device/browser type for improving the website. We do not use advertising trackers.',
        ]}
      />
      <H>2. How we use it</H>
      <Ul
        items={[
          'To confirm bookings, schedule deliveries, deliver outfits and process refunds.',
          'To contact you about your order on call, SMS or WhatsApp.',
          'To improve our collection and service. We never sell your data.',
        ]}
      />
      <H>3. Payments</H>
      <P>
        Online payments are handled by Razorpay, our PCI-DSS compliant payment gateway. Card/UPI credentials go
        directly to Razorpay; we only receive a payment reference and status. Please also read Razorpay’s privacy
        policy on their website.
      </P>
      <H>4. Data sharing</H>
      <P>
        We share data only with service providers essential to fulfil your order (payment gateway, delivery partners)
        and with authorities when legally required. No selling, no marketing resale.
      </P>
      <H>5. Retention &amp; deletion</H>
      <P>
        Order records are kept as required for accounts and tax compliance. You can ask us anytime to correct or
        delete your personal data (except records we must legally retain) by emailing{' '}
        <a className="underline font-semibold" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> — we act within 7 working days.
      </P>
      <H>6. Grievance contact</H>
      <P>
        Grievance officer: Support Manager, {BUSINESS.name} (online only · Indore). Email:{' '}
        <a className="underline font-semibold" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>, Phone:{' '}
        <a className="underline font-semibold" href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>.
      </P>
    </Shell>
  );
}

export function RefundsPage() {
  return (
    <Shell title="Refund & Cancellation Policy" updated="October 2026">
      <P>
        Clear and simple: what happens to your money if plans change. For any refund query, contact us at{' '}
        <a className="underline font-semibold" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or{' '}
        <a className="underline font-semibold" href={BUSINESS.phoneHref}>{BUSINESS.phone}</a> with your Order ID.
      </P>
      <H>1. Security deposit — 100% refundable</H>
      <P>
        The refundable deposit collected on delivery is returned via UPI/cash within 24 hours of outfit return and quality
        check. Normal wear and light dry-cleanable stains are never deducted.
      </P>
      <H>2. Cancellation by you</H>
      <Ul
        items={[
          '48+ hours before event/pickup: full refund of token advance, or free rescheduling to another date.',
          '24–48 hours before: 50% of token advance refunded; balance adjusted if you reschedule.',
          'Under 24 hours / no-show: token advance is non-refundable (the outfit was blocked for you).',
        ]}
      />
      <H>3. Cancellation or failure by us</H>
      <P>
        If we cannot deliver the confirmed outfit (or an equivalent you accept), 100% of all amounts paid are refunded
        within 48 hours, plus priority rebooking at no extra cost.
      </P>
      <H>4. How refunds are paid</H>
      <Ul
        items={[
          'Online payments: refunded to the original source (UPI/bank/card) within 5–7 working days via Razorpay.',
          'Pay-on-delivery bookings: refunded via UPI within 48 hours of approval.',
          'Deposit refunds: via UPI/cash within 24 hours of return and quality check.',
        ]}
      />
      <H>5. Non-refundable items</H>
      <P>
        Only two things are non-refundable: (a) token advance on under-24-hour cancellations, and (b) the optional
        ₹199 damage-cover fee once the outfit is dispatched. Everything else follows the slabs above.
      </P>
    </Shell>
  );
}

export function TrackPage() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<Delivery | null | undefined>(undefined);
  const [matches, setMatches] = useState<Delivery[] | null>(null);
  const [msg, setMsg] = useState('');

  const findByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setMatches(null);
    if (!code.trim()) return;
    const d = await getDelivery(code.trim());
    setResult(d);
    if (!d) setMsg('Ye code nahi mila — code SMS/WhatsApp wale link se copy karke dalo.');
  };

  const findByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setResult(undefined);
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length < 10) { setMsg('Sahi 10-digit mobile number dalo.'); return; }
    const all = await listDeliveries();
    const found = all.filter((d) => (d.phone || '').replace(/\D/g, '').slice(-10) === digits);
    setMatches(found);
    if (!found.length) setMsg('Is number par koi live delivery nahi mili — dispatch hote hi link SMS/WhatsApp par aayega.');
  };

  return (
    <Shell title="Track your delivery" updated="October 2026">
      <P>Delivery boy kaha tak pahuncha — live map par dekho. Tracking code dispatch ke baad SMS/WhatsApp par milta hai, ya neeche apna mobile number dalo.</P>
      <div className="grid sm:grid-cols-2 gap-3">
        <form onSubmit={findByCode} className="card p-4">
          <b className="text-[14px] flex items-center gap-1.5"><Search size={14} /> Tracking code se</b>
          <div className="flex gap-2 min-w-0">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. A1B2C3" className="input-pro uppercase min-w-0" maxLength={10} />
            <button className="btn-primary !py-2.5 !px-5 shrink-0 !text-[13px]">Track</button>
          </div>
        </form>
        <form onSubmit={findByPhone} className="card p-4">
          <b className="text-[14px] flex items-center gap-1.5"><Navigation size={14} /> Mobile number se</b>
          <div className="flex gap-2 min-w-0">
            <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" className="input-pro min-w-0" maxLength={10} />
            <button className="btn-primary !py-2.5 !px-5 shrink-0 !text-[13px]">Find</button>
          </div>
        </form>
      </div>
      {msg && <p className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">{msg}</p>}
      {result && (
        <Link to={`/t/${result.code}`} className="card p-4 flex items-center gap-3 card-shadow">
          <span className="w-10 h-10 rounded-xl grid place-items-center bg-[#641629] text-[#e8c66a] shrink-0"><MapPin size={17} /></span>
          <span className="min-w-0">
            <b className="block text-[14px]">Live delivery · {result.code}</b>
            <span className="text-[12.5px] text-[#6f5b6a] capitalize">{result.status} · {result.agent} · tap karke map dekho →</span>
          </span>
        </Link>
      )}
      {!!matches?.length && (
        <div className="space-y-2">
          {matches.map((d) => (
            <Link key={d.code} to={`/t/${d.code}`} className="card p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl grid place-items-center bg-[#641629] text-[#e8c66a] shrink-0"><MapPin size={17} /></span>
              <span className="min-w-0">
                <b className="block text-[14px]">Live delivery · {d.code}</b>
                <span className="text-[12.5px] text-[#6f5b6a] capitalize">{d.status} · {d.agent} · tap karke map dekho →</span>
              </span>
            </Link>
          ))}
        </div>
      )}
      <P><span className="text-[13px] text-[#8a7584]">Note: live location tabhi dikhegi jab delivery boy ne apne phone par sharing ON ki ho. Help chahiye to <a className="underline font-semibold" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> par likho.</span></P>
    </Shell>
  );
}
