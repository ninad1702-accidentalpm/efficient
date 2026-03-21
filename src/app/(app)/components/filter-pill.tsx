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
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent"
          : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}
