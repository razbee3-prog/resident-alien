import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-6 ${className}`}>{children}</div>;
}

export function Section({
  id,
  className = "",
  children,
  hairline = true,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  hairline?: boolean;
}) {
  return (
    <section id={id} className={`${hairline ? "border-t border-hairline" : ""} py-20 md:py-28 ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

export function Heading({
  eyebrow,
  title,
  lede,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-[44rem] ${className}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3 text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] md:text-[2.75rem]">{title}</h2>
      {lede ? <p className="mt-5 max-w-[38rem] text-lg leading-relaxed text-muted">{lede}</p> : null}
    </div>
  );
}

type ButtonProps = {
  variant?: "primary" | "ghost";
  size?: "md" | "sm";
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps & ComponentProps<"button">) {
  return (
    <button className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "good" | "warn" | "bad" }) {
  const tones: Record<string, string> = {
    muted: "border-hairline-strong text-muted",
    accent: "border-accent/50 text-accent",
    good: "border-good/40 text-good",
    warn: "border-warn/40 text-warn",
    bad: "border-bad/40 text-bad",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="5.2" fill="currentColor" />
      <ellipse cx="13" cy="13" rx="11.5" ry="4.2" stroke="currentColor" strokeWidth="1.2" transform="rotate(-24 13 13)" opacity=".85" />
    </svg>
  );
}
