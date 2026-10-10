// Razorpay integration — frontend checkout loader
// IMPORTANT: Key Secret kabhi frontend me nahi aata.
// Production me Order backend (Vercel function / Supabase Edge) se banao.
// Yaha test/demo flow hai taaki client ko UI + flow dikh sake.

import { STORE } from '../data/store';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Razorpay failed to load'));
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export const RAZORPAY_KEY_ID = (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '';

export interface PayArgs {
  amount: number; // rupees me
  orderId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: Record<string, string>;
}

export async function payWithRazorpay(args: PayArgs): Promise<{ paymentId: string; mode: 'razorpay' }> {
  if (!RAZORPAY_KEY_ID) {
    throw new Error('Razorpay key is not configured');
  }
  if (!args.amount || args.amount < 1) {
    throw new Error('Payment amount must be at least ₹1');
  }
  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error('Razorpay failed to load');

  return new Promise((resolve, reject) => {
    const rz = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: Math.round(args.amount * 100), // paise me
      currency: 'INR',
      name: STORE.name,
      description: `Token advance — Order ${args.orderId}`,
      prefill: {
        name: args.name,
        contact: args.phone,
        email: args.email || `customer@${STORE.email.split('@')[1] || 'thekissa.in'}`,
      },
      notes: { order_id: args.orderId, ...(args.notes || {}) },
      theme: { color: '#111111' },
      handler: (resp: any) => {
        resolve({ paymentId: resp?.razorpay_payment_id || `pay_demo_${Date.now()}`, mode: 'razorpay' });
      },
      modal: {
        ondismiss: () => reject(new Error('Payment was cancelled')),
      },
    });
    rz.on('payment.failed', (e: any) => {
      reject(new Error(e?.error?.description || 'Payment failed'));
    });
    rz.open();
  });
}
