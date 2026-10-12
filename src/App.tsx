import { Suspense, lazy } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ADMIN_PATH } from './lib/localAdmin';
import { ProductsProvider } from './lib/ProductsContext';
import Home from './pages/Home';

const Admin = lazy(() => import('./pages/Admin'));
const AgentDeliver = lazy(() => import('./pages/AgentDeliver'));
const CustomerTrack = lazy(() => import('./pages/CustomerTrack'));
const AboutPage = lazy(() => import('./pages/Legal').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/Legal').then((m) => ({ default: m.ContactPage })));
const TermsPage = lazy(() => import('./pages/Legal').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/Legal').then((m) => ({ default: m.PrivacyPage })));
const RefundsPage = lazy(() => import('./pages/Legal').then((m) => ({ default: m.RefundsPage })));
const TrackPage = lazy(() => import('./pages/Legal').then((m) => ({ default: m.TrackPage })));

function PageLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#fdf9f0] p-6 text-center">
      <div>
        <p className="font-display font-black text-2xl">TheKissa.co…</p>
        <p className="text-sm text-black/50 mt-1">Loading…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ProductsProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Admin only on the secret path — opening /admin shows a 404 */}
            <Route path={`/${ADMIN_PATH}`} element={<Admin />} />
            <Route path="/d/:code" element={<AgentDeliver />} />
            <Route path="/t/:code" element={<CustomerTrack />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refunds" element={<RefundsPage />} />
            <Route path="/track" element={<TrackPage />} />
          <Route path="*" element={
            <div className="min-h-screen grid place-items-center bg-[#fdf9f0] p-6 text-center">
              <div>
                <h1 className="font-display font-black text-3xl">404 — Page not found</h1>
                <Link to="/" className="underline font-bold">Go home</Link>
              </div>
            </div>
          } />
        </Routes>
        </Suspense>
      </ProductsProvider>
    </BrowserRouter>
  );
}
