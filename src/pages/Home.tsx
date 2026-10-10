import AiAssistant from '../components/AiAssistant';
import Hero from '../components/Hero';
import Navbar from '../components/Navbar';
import { CartDrawer, QuickView, Toasts, TrackFloat } from '../components/Overlays';
import { Booking, Faq, FeatureBanner, Footer, Looks, MobileBar, Process } from '../components/Sections';
import Shop from '../components/Shop';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf8f6]">
      <Navbar />
      <Hero />
      <FeatureBanner />
      {/* Shop turant upar — customer ko scroll nahi karna padta */}
      <Shop />
      <Process />
      <Looks />
      <Faq />
      <Booking />
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
