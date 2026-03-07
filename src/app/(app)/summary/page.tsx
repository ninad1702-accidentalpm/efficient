import { ActivityFeed } from "./activity-feed";

export default function SummaryPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Daily Summary</h2>
      <ActivityFeed />
    </div>
  );
}
