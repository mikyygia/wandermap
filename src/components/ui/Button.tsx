import { cn } from "@/lib/ui";

type Variant = "primary" | "outline" | "mono";
type Size = "sm" | "md";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-olive)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-paper)] disabled:opacity-60 disabled:pointer-events-none shadow-sm";
  const sizes = {
    sm: "h-10 px-4 text-[13px]",
    md: "h-11 px-5 text-[13px]",
  } as const;
  const variants = {
    primary:
      "bg-[color:var(--color-coffee)] text-[color:var(--color-cream)] font-medium tracking-[0.02em] hover:bg-[color:color-mix(in_srgb,var(--color-coffee),black_10%)]",
    outline:
      "bg-transparent text-[color:var(--color-coffee)] border border-[color:rgba(122,85,68,0.62)] font-normal hover:bg-[color:rgba(122,85,68,0.08)]",
    mono:
      "bg-transparent text-[color:var(--color-coffee)] border border-[color:rgba(122,85,68,0.38)] font-mono uppercase tracking-[0.12em] text-[11px] hover:bg-[color:rgba(122,85,68,0.08)]",
  } as const;

  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}

