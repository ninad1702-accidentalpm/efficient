const features = [
  "Today view",
  "Recurring tasks",
  "Scratch pad",
  "AI suggestions",
  "Light + dark mode",
];

export function LandingTicker() {
  const repeated = Array.from({ length: 8 }, () => features).flat();

  return (
    <div className="overflow-hidden border-y border-[#E0DCD4] py-3">
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "ticker 30s linear infinite" }}
      >
        {repeated.map((feature, i) => (
          <span key={i} className="flex items-center">
            <span className="font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-[0.2em] text-[#6B6B6B]">
              {feature}
            </span>
            <span className="mx-5 inline-block size-1 rounded-full bg-[#C9A227]" />
          </span>
        ))}
      </div>
    </div>
  );
}
