// Store logo — one place, used everywhere (navbar, footer, login, tracking pages, favicon file).
// To change the logo, replace public/images/logo.png. Original: logo-full.png.

export default function Logo({ className = 'w-9 h-9 sm:w-10 sm:h-10' }: { className?: string }) {
  return (
    <img
      src="/images/logo.png"
      alt="TheKissa.co logo"
      loading="eager"
      fetchPriority="high"
      className={`${className} rounded-xl object-contain bg-[#e6d6b6] p-[3px] ring-1 ring-black/10 shrink-0`}
    />
  );
}
