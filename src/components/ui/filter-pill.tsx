export function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`h-7 rounded-full px-3 text-xs font-medium tracking-[0.04em] transition-colors border ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent"
          : "bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}
