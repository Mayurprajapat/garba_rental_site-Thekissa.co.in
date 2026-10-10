import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { askAssistant, type ChatProduct } from '../lib/ai';
import { useStore } from '../store/useStore';
import { useProducts } from '../lib/ProductsContext';

interface Msg {
  from: 'bot' | 'user';
  text: string;
  products?: ChatProduct[];
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: 'Hello! Tell me your budget + occasion — e.g. "white look under 1500, size M". I will suggest the best 3 dresses.' },
  ]);
  const boxRef = useRef<HTMLDivElement>(null);
  const setQuickView = useStore((s) => s.setQuickView);
  const { products } = useProducts();
  const navigate = useNavigate();

  const scrollDown = () => {
    setTimeout(() => boxRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50);
  };

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput('');
    setMsgs((m) => [...m, { from: 'user', text: q }]);
    setBusy(true);
    scrollDown();
    const r = await askAssistant(q);
    setMsgs((m) => [...m, { from: 'bot', text: (r.live ? '' : '[Demo] ') + r.text, products: r.products }]);
    setBusy(false);
    scrollDown();
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="AI assistant"
        className="fixed bottom-[9.5rem] sm:bottom-24 right-4 sm:right-5 z-40 h-13 w-13 p-3.5 rounded-full bg-gradient-to-br from-[#d92b3f] to-[#641629] text-white shadow-[0_16px_36px_-12px_rgba(100,22,41,.6)] ring-1 ring-white/20 hover:scale-105 transition flex items-center gap-2"
      >
        {open ? <X size={20} /> : <Bot size={20} />}
        {!open && <span className="hidden sm:inline text-xs font-semibold pr-1">AI Help</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="fixed bottom-[13.5rem] sm:bottom-40 right-4 sm:right-5 z-50 w-[92vw] max-w-sm bg-white rounded-3xl border border-black/10 shadow-2xl overflow-hidden flex flex-col"
            style={{ height: 'min(480px, calc(100dvh - 16rem))' }}
          >
            <div className="bg-gradient-to-r from-[#641629] to-[#8e1a2e] text-white px-5 py-4 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-white text-black grid place-items-center"><Sparkles size={16} /></span>
              <div className="flex-1">
                <b className="text-sm block">TheKissa.co.in Assistant</b>
                <span className="text-[11px] text-white/60">Demo AI · suggests from our catalog only</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-white/60 hover:text-white"><X size={17} /></button>
            </div>

            <div ref={boxRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${m.from === 'user' ? 'bg-[#641629] text-white rounded-br-md' : 'bg-white border border-black/10 rounded-bl-md'}`}>
                    {m.text}
                    {!!m.products?.length && (
                      <div className="mt-2 space-y-1.5">
                        {m.products.map((p) => {
                          const full = products.find((x) => x.id === p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => { setQuickView(p.id); setOpen(false); navigate('/#shop'); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); }}
                              className="w-full text-left bg-[#f4f4f5] hover:bg-[#641629] hover:text-white transition rounded-xl px-3 py-2"
                            >
                              <b className="block text-[12.5px]">{p.name}</b>
                              <span className="text-[11.5px] opacity-70">{p.id} · ₹{p.price.toLocaleString('en-IN')} · {full?.sizes?.slice(0, 4).join(', ')}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && <p className="text-xs text-black/40">Thinking…</p>}
            </div>

            <div className="p-3 border-t border-black/10 bg-white">
              <div className="flex gap-1.5 flex-wrap mb-2">
                {['Women look under 1500', 'Kids dress 4-6Y', 'Men kediyu XL', 'Deposit refund?'].map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-[11px] font-semibold border border-black/10 rounded-full px-2.5 py-1 hover:bg-[#641629] hover:border-[#641629] hover:text-white transition">{s}</button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 min-w-0">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type budget, size, colour…"
                  className="flex-1 min-w-0 border border-black/15 rounded-full px-4 py-2.5 text-sm outline-none focus:border-black"
                />
                <button aria-label="Send" className="w-10 h-10 grid place-items-center rounded-full bg-[#641629] text-white shrink-0"><Send size={15} /></button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
