import AiAssistant from '../components/AiAssistant';
import Hero from '../components/Hero';
import LiveTicker from '../components/LiveTicker';
import Navbar from '../components/Navbar';
import { CartDrawer, QuickView, Toasts, TrackFloat } from '../components/Overlays';
import { Faq, FeatureBanner, Footer, Looks, MobileBar, Process, Testimonials } from '../components/Sections';
import Shop from '../components/Shop';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf8f6]">
      <Navbar />
      <Hero />
      <LiveTicker />
      <FeatureBanner />
      {/* Shop placed near the top — customers don't need to scroll */}
      <Shop />
      <Process />
      <Looks />
      <Testimonials />
      <Faq />
      <Footer />
      <div className="h-16 sm:hidden" />
      <MobileBar />
      <QuickView />
      <CartDrawer />
      <Toasts />
      <AiAssistant />
      <TrackFloat />
    </div>
  );
}
