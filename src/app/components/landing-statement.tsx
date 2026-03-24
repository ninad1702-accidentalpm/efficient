export function LandingStatement() {
  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-[1200px] text-center">
        <p className="mb-4 font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-[0.2em] text-[#C9A227]">
          Philosophy
        </p>
        <blockquote className="mx-auto max-w-2xl font-[family-name:var(--font-cormorant)] text-[1.75rem] italic leading-snug text-[#1A1A1A] sm:text-[2.25rem]">
          &ldquo;Productivity isn&apos;t about doing more.
          <br className="hidden sm:block" />
          It&apos;s about doing what matters.&rdquo;
        </blockquote>
      </div>
    </section>
  );
}
