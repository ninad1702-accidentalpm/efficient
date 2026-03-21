"use client";

import { useState, useEffect } from "react";
import { startOfDay } from "date-fns";
import { usePostHog } from "posthog-js/react";
import { Label } from "@/components/ui/label";
import { DatePicker } from "./date-picker";
import type { RecurringFrequency, EndConditionType } from "@/lib/types";

export interface RecurrenceConfigState {
  frequency: RecurringFrequency;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth: number;
  endCondition: EndConditionType;
  endDate: Date | undefined;
  maxOccurrences: number;
  startDate: Date;
}

export const defaultRecurrenceConfig: RecurrenceConfigState = {
  frequency: "daily",
  interval: 1,
  daysOfWeek: [],
  dayOfMonth: 1,
  endCondition: "on_date",
  endDate: undefined,
  maxOccurrences: 10,
  startDate: new Date(),
};

export function validateRecurrenceConfig(config: RecurrenceConfigState): string | null {
  if (config.endCondition === "on_date") {
    if (!config.endDate) return "Please select an end date.";
    if (startOfDay(config.endDate) <= startOfDay(config.startDate))
      return "End date must be after the start date.";
  }
  return null;
}

const selectClassName =
  "h-8 appearance-none rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-2.5 pr-7 text-sm text-[var(--text-primary)] font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface RecurrenceConfigProps {
  config: RecurrenceConfigState;
  onChange: (config: RecurrenceConfigState) => void;
}

export function RecurrenceConfig({ config, onChange }: RecurrenceConfigProps) {
  const posthog = usePostHog();

  // Local string state for number inputs so users can freely type
  const [intervalStr, setIntervalStr] = useState(config.interval.toString());
  const [dayOfMonthStr, setDayOfMonthStr] = useState(config.dayOfMonth.toString());
  const [occurrencesStr, setOccurrencesStr] = useState(config.maxOccurrences.toString());

  // Sync local string state when config changes externally (e.g. reset)
  useEffect(() => { setIntervalStr(config.interval.toString()); }, [config.interval]);
  useEffect(() => { setDayOfMonthStr(config.dayOfMonth.toString()); }, [config.dayOfMonth]);
  useEffect(() => { setOccurrencesStr(config.maxOccurrences.toString()); }, [config.maxOccurrences]);

  function update(patch: Partial<RecurrenceConfigState>) {
    onChange({ ...config, ...patch });
  }

  const numInputClassName =
    "h-8 w-14 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 text-sm text-center text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] font-sans";

  return (
    <div className="space-y-4">
      {/* Start date */}
      <div className="space-y-2">
        <Label>Start date</Label>
        <DatePicker
          date={config.startDate}
          onSelect={(d) => update({ startDate: d ?? new Date() })}
        />
      </div>

      {/* Frequency + Interval */}
      <div className="space-y-2">
        <Label>Repeat</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Every</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={intervalStr}
            onChange={(e) => {
              setIntervalStr(e.target.value);
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 99) update({ interval: v });
            }}
            onBlur={() => {
              const v = parseInt(intervalStr, 10);
              if (isNaN(v) || v < 1) setIntervalStr(config.interval.toString());
            }}
            className={numInputClassName}
          />
          <select
            value={config.frequency}
            onChange={(e) => {
              const freq = e.target.value as RecurringFrequency;
              posthog?.capture("recurrence_frequency_changed", {
                frequency: freq,
              });
              update({ frequency: freq });
            }}
            className={`${selectClassName} w-auto`}
          >
            <option value="daily">
              {config.interval > 1 ? "days" : "day"}
            </option>
            <option value="weekly">
              {config.interval > 1 ? "weeks" : "week"}
            </option>
            <option value="monthly">
              {config.interval > 1 ? "months" : "month"}
            </option>
            <option value="yearly">
              {config.interval > 1 ? "years" : "year"}
            </option>
          </select>
        </div>
      </div>

      {/* Day targeting — weekly */}
      {config.frequency === "weekly" && (
        <div className="space-y-2">
          <Label>On days</Label>
          <div className="flex gap-1">
            {DAY_LABELS.map((label, i) => {
              const active = config.daysOfWeek.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? config.daysOfWeek.filter((d) => d !== i)
                      : [...config.daysOfWeek, i];
                    update({ daysOfWeek: next });
                  }}
                  className={`flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                      : "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day targeting — monthly */}
      {config.frequency === "monthly" && (
        <div className="space-y-2">
          <Label>On day</Label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={dayOfMonthStr}
              onChange={(e) => {
                setDayOfMonthStr(e.target.value);
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 31) update({ dayOfMonth: v });
              }}
              onBlur={() => {
                const v = parseInt(dayOfMonthStr, 10);
                if (isNaN(v) || v < 1 || v > 31) setDayOfMonthStr(config.dayOfMonth.toString());
              }}
              className={numInputClassName}
            />
            <span className="text-sm text-muted-foreground">of the month</span>
          </div>
          {config.dayOfMonth > 28 && (
            <p className="text-xs text-muted-foreground">
              For shorter months, the task will be created on the last day.
            </p>
          )}
        </div>
      )}

      {/* End condition */}
      <div className="space-y-2">
        <Label>Ends</Label>
        <select
          value={config.endCondition}
          onChange={(e) => {
            const ec = e.target.value as EndConditionType;
            posthog?.capture("recurrence_end_condition_changed", {
              end_condition: ec,
            });
            update({ endCondition: ec });
          }}
          className={`${selectClassName} w-full`}
        >
          <option value="never">Never</option>
          <option value="on_date">On a specific date</option>
          <option value="after_count">After a number of occurrences</option>
        </select>

        {config.endCondition === "on_date" && (
          <>
            <DatePicker
              date={config.endDate}
              onSelect={(d) => update({ endDate: d })}
              placeholder="Select end date"
            />
            {validateRecurrenceConfig(config) && (
              <p className="text-xs text-muted-foreground">
                {validateRecurrenceConfig(config)}
              </p>
            )}
          </>
        )}

        {config.endCondition === "after_count" && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={occurrencesStr}
              onChange={(e) => {
                setOccurrencesStr(e.target.value);
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 999) update({ maxOccurrences: v });
              }}
              onBlur={() => {
                const v = parseInt(occurrencesStr, 10);
                if (isNaN(v) || v < 1) setOccurrencesStr(config.maxOccurrences.toString());
              }}
              className={`${numInputClassName} w-20`}
            />
            <span className="text-sm text-muted-foreground">occurrences</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Manage recurring tasks from Settings. Missed tasks are automatically skipped when new ones are generated.
      </p>
    </div>
  );
}
