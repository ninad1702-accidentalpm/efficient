import Link from "next/link";

export function LandingNav() {
  return (
    <header className="relative z-20 flex w-full items-center justify-between px-8 py-8 md:px-12">
      <div className="font-playfair text-2xl italic tracking-tight text-[#1A1A1A]">
        Efficient
      </div>
      <div className="flex items-center gap-10">
        <Link
          href="/login"
          className="font-inter text-sm font-medium text-[#4A4A4A] transition-colors duration-300 hover:text-[#1A1A1A]"
        >
          Log in
        </Link>
        <Link
          href="/login?mode=signup"
          className="font-inter rounded-full bg-[#1A1A1A] px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-lg"
        >
          Sign up
        </Link>
      </div>
    </header>
  );
}
