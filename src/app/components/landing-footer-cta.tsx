"use client";

export function LandingFooterCta() {
  function scrollToSignup() {
    const el = document.getElementById("signup");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      const input = el.querySelector("input");
      if (input) input.focus({ preventScroll: true });
    }
  }

  return (
    <section className="bg-[#1A1A1A] px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] text-center">
        <h2 className="font-[family-name:var(--font-barlow-condensed)] text-[2.5rem] font-900 uppercase leading-[0.95] text-[#F5F2EB] sm:text-[3.5rem]">
          Ready to get
          <br />
          <span className="text-[#C9A227]">efficient?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md font-[family-name:var(--font-barlow)] text-base text-[#F5F2EB]/60">
          Join for free. No credit card, no trial period, no nonsense.
        </p>
        <button
          onClick={scrollToSignup}
          className="mt-8 rounded-lg bg-[#C9A227] px-8 py-3 font-[family-name:var(--font-barlow)] text-sm font-medium text-white transition-colors hover:bg-[#B89220] active:scale-[0.98]"
        >
          Start for free
        </button>
      </div>
    </section>
  );
}
