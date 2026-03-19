import { CheckSquare, Sparkles, Sun } from "lucide-react";

const features = [
  {
    icon: CheckSquare,
    title: "Smart task management",
    description:
      "Due dates, filters, auto-archive. See overdue, today, and upcoming at a glance.",
  },
  {
    icon: Sparkles,
    title: "AI Scratch Pad",
    description:
      "Jot anything down. AI turns your notes into structured tasks instantly.",
  },
  {
    icon: Sun,
    title: "Daily check-ins",
    description:
      "Morning and evening nudges to review your tasks and stay on track.",
  },
];

const featureDelays = ["delay-100", "delay-200", "delay-300"] as const;

export function AuthFeaturesMobile() {
  return (
    <div className="flex flex-col items-center space-y-5 lg:hidden">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)] animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        Capture. Organise. Complete.
      </p>
      <div className="space-y-3 w-full">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={`flex flex-col items-center text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-backwards ${featureDelays[i]}`}
          >
            <div className="inline-flex items-center gap-2 mb-0.5">
              <f.icon
                className="size-4 shrink-0 text-[var(--accent)]"
                strokeWidth={2}
              />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {f.title}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)] max-w-[240px]">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthBrandingPanel() {
  return (
    <div className="hidden lg:flex lg:w-[40%] items-center justify-center bg-[var(--bg-surface)]">
      <div className="max-w-xs space-y-8">
        <div>
          <h1 className="font-display text-[3rem] text-[var(--text-primary)]">
            Efficient
          </h1>
          <p className="mt-1 text-sm tracking-wide text-[var(--text-muted)]">
            Capture. Organise. Complete.
          </p>
        </div>

        <div className="space-y-5">
          {features.map((f) => (
            <div key={f.title} className="flex gap-3">
              <f.icon
                className="mt-0.5 size-4 shrink-0 text-[var(--accent)]"
                strokeWidth={2}
              />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {f.title}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
