import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRecurringTasks } from "@/lib/actions/recurring-tasks";
import { RecurringManagementList } from "../../components/recurring-management-list";
import { RecurringGate } from "./recurring-gate";

export default async function RecurringSettingsPage() {
  const rules = await getRecurringTasks();

  return (
    <RecurringGate>
      <div className="space-y-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to settings
        </Link>
        <div>
          <h2 className="font-display text-lg text-[var(--text-primary)]">
            Recurring Tasks
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your recurring task rules. Changes apply to future instances.
          </p>
        </div>
        <RecurringManagementList initialRules={rules} />
      </div>
    </RecurringGate>
  );
}
