import { Check, Plus } from "lucide-react";

export function LandingHero() {
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center justify-center gap-16 px-8 pb-12 md:px-16 lg:flex-row lg:gap-24 lg:px-24">
      {/* Left column — copy */}
      <div className="flex w-full flex-col items-center pt-10 text-center lg:w-5/12 lg:items-start lg:pt-0 lg:text-left">
        <h1 className="mb-8 font-playfair text-5xl leading-[1.05] tracking-tight text-[#1A1A1A] md:text-6xl lg:text-[5.5rem]">
          Your tasks.
          <br />
          One place.
        </h1>
        <p className="max-w-md font-inter text-lg font-light leading-relaxed text-[#4A4A4A] md:text-xl">
          A calm, focused space to manage what matters. No clutter, no
          complexity — just your tasks.
        </p>
      </div>

      {/* Right column — floating task card */}
      <div className="relative flex w-full justify-center lg:w-7/12 lg:justify-end">
        {/* Small gold blob behind card */}
        <div className="absolute -left-12 -top-12 h-32 w-32 animate-float rounded-full bg-[#CBA76B]/5 blur-2xl" />

        <div className="relative z-10 w-full max-w-[540px] animate-float rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.06)] md:p-10">
          {/* TODAY header */}
          <div className="mb-8 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#CBA76B]">
              Today
            </span>
            <button className="text-gray-300 transition-colors hover:text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>

          {/* Task rows */}
          <div className="space-y-3">
            {/* Task 1 — overdue */}
            <div className="group flex items-center gap-4 rounded-xl border border-transparent bg-[#FCFBFA] p-4 transition-all duration-200 hover:border-gray-100">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-gray-300 transition-colors group-hover:border-gray-400" />
              <span className="flex-1 truncate text-[15px] font-medium text-[#1A1A1A]">
                Review Q4 projections
              </span>
              <span className="rounded-md bg-[#FDF2F2] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#E05252]">
                Overdue
              </span>
            </div>

            {/* Task 2 — normal */}
            <div className="group flex items-center gap-4 rounded-xl border border-transparent bg-[#FCFBFA] p-4 transition-all duration-200 hover:border-gray-100">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-gray-300 transition-colors group-hover:border-gray-400" />
              <span className="flex-1 truncate text-[15px] font-medium text-[#1A1A1A]">
                Call dentist for appointment
              </span>
            </div>

            {/* Task 3 — completed */}
            <div className="group flex items-center gap-4 rounded-xl border border-transparent p-4 opacity-60">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-[#CBA76B] bg-[#CBA76B]">
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </div>
              <span className="flex-1 truncate text-[15px] font-medium text-[#4A4A4A] line-through">
                Submit expense report
              </span>
            </div>
          </div>

          {/* Add task prompt */}
          <div className="mt-6 flex items-center gap-4 border-t border-gray-100 pt-6 opacity-50">
            <Plus className="h-5 w-5 text-gray-400" strokeWidth={2} />
            <span className="text-sm font-medium text-gray-400">
              Add a new task...
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
