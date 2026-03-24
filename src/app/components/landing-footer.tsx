export function LandingFooter() {
  return (
    <footer className="relative z-20 flex w-full items-center justify-between px-8 py-6 text-[11px] font-medium uppercase tracking-wide text-gray-400 md:px-12">
      <div className="flex gap-6">
        <span className="font-playfair text-sm normal-case italic text-gray-500">
          Efficient
        </span>
      </div>
      <div className="flex gap-6">
        <a
          href="#"
          className="transition-colors hover:text-[#1A1A1A]"
        >
          Privacy
        </a>
        <a
          href="#"
          className="transition-colors hover:text-[#1A1A1A]"
        >
          Terms
        </a>
        <span>&copy; 2026</span>
      </div>
    </footer>
  );
}
