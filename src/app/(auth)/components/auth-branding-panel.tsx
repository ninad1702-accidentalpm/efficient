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

export function AuthFeaturesMobile() {
  return (
    <div className="flex flex-col items-center space-y-2 lg:hidden">
      <p className="text-xs tracking-wide text-[var(--text-muted)]">
        Capture. Organise. Complete.
      </p>
      {features.map((f) => (
        <div key={f.title} className="inline-flex items-center gap-2">
          <f.icon
            className="size-3.5 shrink-0 text-[var(--accent)]"
            strokeWidth={2}
          />
          <span className="text-xs font-medium text-[var(--text-primary)]">
            {f.title}
          </span>
        </div>
      ))}
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
