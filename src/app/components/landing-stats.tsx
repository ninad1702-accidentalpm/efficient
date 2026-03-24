const stats = [
  { value: "1", label: "App for everything" },
  { value: "Free", label: "No trials" },
  { value: "0", label: "Distractions" },
  { value: "\u221E", label: "Tasks & lists" },
];

export function LandingStats() {
  return (
    <section className="border-y border-[#E0DCD4] px-6 py-16">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 sm:gap-12 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-[family-name:var(--font-barlow-condensed)] text-[3rem] font-900 leading-none text-[#1A1A1A] sm:text-[3.5rem]">
              {stat.value}
            </p>
            <p className="mt-2 font-[family-name:var(--font-barlow)] text-sm text-[#6B6B6B]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
