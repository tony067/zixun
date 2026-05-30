"use client";
import { STEPS } from "@/lib/booking-flow-data";

export function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center px-6 py-4">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
              style={{
                background: s.num <= current ? "var(--color-primary)" : "#E8E2D8",
                color: s.num <= current ? "white" : "#9B8E82",
              }}>
              {s.num}
            </div>
            <span className="text-[10px] whitespace-nowrap"
              style={{ color: s.num <= current ? "var(--color-primary)" : "#9B8E82" }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-[2px] mb-4 mx-1 rounded"
              style={{ background: s.num < current ? "var(--color-primary)" : "#E8E2D8" }} />
          )}
        </div>
      ))}
    </div>
  );
}
