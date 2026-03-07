"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CheckInModal } from "./check-in-modal";
import type { Task } from "@/lib/types";

export function CheckInTrigger() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[] | null>(null);

  const checkinType = searchParams.get("checkin") as
    | "morning"
    | "evening"
    | null;

  useEffect(() => {
    if (!checkinType) {
      setTasks(null);
      return;
    }

    fetch("/api/tasks/pending")
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks ?? []))
      .catch(() => setTasks([]));
  }, [checkinType]);

  if (!checkinType || tasks === null) return null;

  return (
    <CheckInModal
      type={checkinType}
      tasks={tasks}
      onClose={() => {
        setTasks(null);
        router.replace("/", { scroll: false });
      }}
    />
  );
}
