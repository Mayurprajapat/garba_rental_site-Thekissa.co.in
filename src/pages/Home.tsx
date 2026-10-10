import AiAssistant from '../components/AiAssistant';
import ShopByCategory from '../components/Categories';
import Hero from '../components/Hero';
import Navbar from '../components/Navbar';
import { CartDrawer, QuickView, Toasts, WaFloat } from '../components/Overlays';
import { Booking, Faq, FeatureBanner, Footer, Looks, MobileBar, Process, Rates } from '../components/Sections';
import Shop from '../components/Shop';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf8f6]">
      <Navbar />
      <Hero />
      <FeatureBanner />
      {/* Shop turant upar — customer ko scroll nahi karna padta */}
      <ShopByCategory />
      <Shop />
      <Process />
      <Rates />
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
      <WaFloat />
    </div>
  );
}
