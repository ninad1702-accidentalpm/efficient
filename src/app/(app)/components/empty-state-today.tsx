export function EmptyStateToday() {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-4">
      <img
        src="/illustrations/empty-state-light.svg"
        alt=""
        className="w-64 mix-blend-multiply dark:hidden"
      />
      <img
        src="/illustrations/empty-state-dark.svg"
        alt=""
        className="w-64 hidden dark:block"
      />
      <p className="-mt-2 text-sm font-medium text-[var(--text-primary)]">
        Nothing due today
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Enjoy your free time — or add a task!
      </p>
    </div>
  );
}
