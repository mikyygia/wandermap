export function DiamondRule({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[color:var(--color-sand)]/40" />
        <div className="h-[5px] w-[5px] rotate-45 bg-[color:var(--color-olive)]/70" />
        <div className="h-px flex-1 bg-[color:var(--color-sand)]/40" />
      </div>
    </div>
  );
}

