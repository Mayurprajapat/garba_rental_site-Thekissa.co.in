// Store logo — ek jagah, har jagah (navbar, footer, login, tracking pages, favicon file).
// Logo badalna ho to public/images/logo.png replace kar do. Original: logo-full.png.

export default function Logo({ className = 'w-9 h-9 sm:w-10 sm:h-10' }: { className?: string }) {
  return (
    <img
      src="/images/logo.png"
      alt="TheKissa.co logo"
      loading="eager"
      fetchPriority="high"
      className={`${className} rounded-xl object-cover ring-1 ring-black/10 shrink-0`}
    />
  );
}
