"use client";

import type { CSSProperties, ReactNode } from "react";

/* ---------- 레이아웃 ---------- */

export function Section({
  index,
  emoji,
  title,
  desc,
  children,
}: {
  index: number;
  emoji: string;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 scroll-mt-6" id={`section-${index}`}>
      <header className="mb-3 flex items-baseline gap-2">
        <span aria-hidden className="text-lg">
          {emoji}
        </span>
        <h2 className="text-[17px] font-bold tracking-tight text-navy-900">
          {index}. {title}
        </h2>
        {desc && <p className="ml-1 text-xs text-muted">{desc}</p>}
      </header>
      {children}
    </section>
  );
}

export function Card({
  children,
  className = "",
  tone = "plain",
}: {
  children: ReactNode;
  className?: string;
  tone?: "plain" | "navy" | "quiet";
}) {
  const tones = {
    plain: "bg-surface border-line",
    quiet: "bg-slate-50 border-line",
    navy: "bg-navy-900 border-navy-900 text-white",
  } as const;
  return (
    <div
      className={`min-w-0 rounded-xl border ${tones[tone]} p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-[13px] font-semibold text-navy-900">{children}</h3>
  );
}

/* ---------- 값 표시 ---------- */

export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
  size = "md",
  inverted = false,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "pos" | "neg" | "navy";
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}) {
  const toneClass = {
    neutral: inverted ? "text-white" : "text-navy-900",
    navy: inverted ? "text-white" : "text-navy-900",
    pos: inverted ? "text-sky-300" : "text-pos",
    neg: inverted ? "text-red-300" : "text-neg",
  }[tone];
  const sizeClass = { sm: "text-lg", md: "text-2xl", lg: "text-[28px]" }[size];
  return (
    <div>
      <div
        className={`text-[11px] font-medium ${inverted ? "text-slate-300" : "text-muted"}`}
      >
        {label}
      </div>
      <div className={`tnum mt-0.5 font-bold tracking-tight ${sizeClass} ${toneClass}`}>
        {value}
      </div>
      {sub && (
        <div className={`tnum mt-0.5 text-[11px] ${inverted ? "text-slate-400" : "text-muted"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function Row({
  label,
  value,
  tone = "neutral",
  strong = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "neg" | "pos";
  strong?: boolean;
}) {
  const toneClass = { neutral: "text-ink", neg: "text-neg", pos: "text-pos" }[tone];
  return (
    <div
      className={`flex items-center justify-between py-1.5 text-[13px] ${
        strong ? "border-t border-line pt-2 font-bold" : ""
      }`}
    >
      <span className={strong ? "text-navy-900" : "text-muted"}>{label}</span>
      <span className={`tnum font-semibold ${strong ? "text-[15px]" : ""} ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

/* ---------- 입력 ---------- */

export function NumberField({
  label,
  value,
  onChange,
  suffix = "원",
  step = 1000,
  min = 0,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-muted">{label}</span>
      <span className="flex items-stretch overflow-hidden rounded-lg border border-line bg-white focus-within:border-navy-800 focus-within:ring-2 focus-within:ring-navy-800/15">
        <input
          type="number"
          className="tnum w-full min-w-0 bg-transparent px-3 py-2 text-right text-[15px] font-semibold outline-none"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(Number.isFinite(v) ? Math.max(min, v) : min);
          }}
        />
        <span className="flex items-center bg-slate-50 px-2.5 text-[12px] font-medium text-muted">
          {suffix}
        </span>
      </span>
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export function Stepper({
  onStep,
  dir,
  ariaLabel,
}: {
  onStep: () => void;
  dir: "-" | "+";
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onStep}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-[15px] font-bold text-navy-800 transition-colors hover:bg-slate-50 active:bg-slate-100"
    >
      {dir === "-" ? "−" : "+"}
    </button>
  );
}

export function SliderField({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-muted">{label}</span>
        <span className="tnum text-[15px] font-bold text-navy-900">{display}</span>
      </div>
      <div className="flex items-center gap-2">
        <Stepper dir="-" ariaLabel={`${label} 감소`} onStep={() => onChange(clamp(value - step))} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ "--range-progress": `${progress}%` } as CSSProperties}
        />
        <Stepper dir="+" ariaLabel={`${label} 증가`} onStep={() => onChange(clamp(value + step))} />
      </div>
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

export function CheckRow({
  checked,
  onChange,
  label,
  right,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <label className="flex min-w-0 cursor-pointer items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 shrink-0 accent-[#13315c]"
        />
        <span className="truncate">{label}</span>
      </label>
      {right}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span className="text-[13px] font-medium">{label}</span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-navy-800" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      className="flex gap-1 rounded-lg border border-line bg-slate-100 p-1"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${
              size === "sm" ? "text-[11px]" : "text-[12px]"
            } ${
              active
                ? "bg-white text-navy-900 shadow-sm"
                : "text-muted hover:text-navy-800"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <p
      className={`rounded-lg px-3 py-2 text-[11.5px] leading-relaxed ${
        tone === "warn"
          ? "bg-red-50 text-red-700"
          : "bg-slate-50 text-muted"
      }`}
    >
      {children}
    </p>
  );
}
