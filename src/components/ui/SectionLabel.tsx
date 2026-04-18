import { cn } from "@/lib/ui";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-[10px]", className)}>
      <div className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[color:var(--color-sand)]">
        {children}
      </div>
      <div className="h-px flex-1 bg-[color:var(--color-sand)]/50" />
    </div>
  );
}

