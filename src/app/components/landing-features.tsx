"use client";

import { useState } from "react";
import { CheckSquare, RefreshCw, StickyNote } from "lucide-react";

const features = [
  {
    id: "today",
    icon: CheckSquare,
    title: "Today View",
    description: "See what matters right now. Overdue tasks bubble up, completed ones fade away. A clean list for a clear mind.",
    mockup: (
      <div className="rounded-lg border border-[#E0DCD4] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#C9A227]">Today</span>
        </div>
        <div className="space-y-2">
          {["Review Q4 projections", "Call dentist for appointment", "Submit expense report"].map((task, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md bg-[#FAF9F6] px-3 py-2.5">
              <div className={`size-4 rounded border ${i === 2 ? "border-[#C9A227] bg-[#C9A227]" : "border-[#D8D4CC]"}`}>
                {i === 2 && (
                  <svg viewBox="0 0 16 16" fill="none" className="size-4">
                    <path d="M4 8l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`font-[family-name:var(--font-barlow)] text-sm ${i === 2 ? "text-[#B0ACA4] line-through" : "text-[#1A1A1A]"}`}>
                {task}
              </span>
              {i === 0 && (
                <span className="ml-auto rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                  Overdue
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "recurring",
    icon: RefreshCw,
    title: "Recurring Tasks",
    description: "Set it once, forget about remembering. Daily, weekly, monthly — tasks that show up automatically on schedule.",
    mockup: (
      <div className="rounded-lg border border-[#E0DCD4] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#C9A227]">Recurring</span>
        </div>
        <div className="space-y-2">
          {[
            { title: "Water plants", freq: "Every 3 days" },
            { title: "Weekly review", freq: "Every Monday" },
            { title: "Pay rent", freq: "1st of month" },
          ].map((rule, i) => (
            <div key={i} className="flex items-center justify-between rounded-md bg-[#FAF9F6] px-3 py-2.5">
              <div className="flex items-center gap-3">
                <RefreshCw className="size-3.5 text-[#C9A227]" />
                <span className="font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A]">{rule.title}</span>
              </div>
              <span className="font-[family-name:var(--font-barlow)] text-xs text-[#9A9A9A]">{rule.freq}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "scratch",
    icon: StickyNote,
    title: "Scratch Pad",
    description: "Dump your thoughts, AI turns them into tasks. Brain dump freely — structured tasks come out the other side.",
    mockup: (
      <div className="rounded-lg border border-[#E0DCD4] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#C9A227]">Scratch pad</span>
        </div>
        <div className="rounded-md bg-[#FAF9F6] p-3">
          <p className="font-[family-name:var(--font-barlow)] text-sm leading-relaxed text-[#6B6B6B] italic">
            need to book flights for tokyo trip next month, also remind me to renew passport before that...
          </p>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 rounded-md bg-[#C9A227]/5 px-3 py-2">
            <span className="text-xs text-[#C9A227]">AI</span>
            <span className="font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A]">Book flights to Tokyo</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-[#C9A227]/5 px-3 py-2">
            <span className="text-xs text-[#C9A227]">AI</span>
            <span className="font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A]">Renew passport</span>
          </div>
        </div>
      </div>
    ),
  },
];

export function LandingFeatures() {
  const [openId, setOpenId] = useState<string | null>("today");

  return (
    <section id="features" className="px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#E0DCD4]" />
          <span className="font-[family-name:var(--font-cormorant)] text-lg italic text-[#9A9A9A]">
            How it works
          </span>
          <div className="h-px flex-1 bg-[#E0DCD4]" />
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Accordion */}
          <div className="space-y-0 divide-y divide-[#E0DCD4]">
            {features.map((feature) => {
              const isOpen = openId === feature.id;
              return (
                <div key={feature.id}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : feature.id)}
                    className="flex w-full items-center gap-3 py-5 text-left transition-colors"
                  >
                    <feature.icon
                      className={`size-5 shrink-0 transition-colors ${isOpen ? "text-[#C9A227]" : "text-[#B0ACA4]"}`}
                      strokeWidth={1.5}
                    />
                    <span className={`font-[family-name:var(--font-barlow-condensed)] text-xl font-700 uppercase tracking-wide transition-colors ${isOpen ? "text-[#1A1A1A]" : "text-[#6B6B6B]"}`}>
                      {feature.title}
                    </span>
                    <span className={`ml-auto text-xl transition-transform ${isOpen ? "rotate-45" : ""} text-[#B0ACA4]`}>+</span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isOpen ? "200px" : "0px", opacity: isOpen ? 1 : 0 }}
                  >
                    <p className="pb-5 pl-8 font-[family-name:var(--font-barlow)] text-sm leading-relaxed text-[#6B6B6B]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mockup preview — desktop only */}
          <div className="hidden lg:block">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="transition-all duration-300"
                style={{
                  display: openId === feature.id ? "block" : "none",
                  animation: openId === feature.id ? "fadeUp 0.4s ease-out" : undefined,
                }}
              >
                {feature.mockup}
              </div>
            ))}
            {!openId && (
              <div className="flex h-full items-center justify-center">
                <p className="font-[family-name:var(--font-barlow)] text-sm text-[#B0ACA4]">
                  Select a feature to preview
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
