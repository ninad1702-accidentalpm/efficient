"use client";

import { usePostHog } from "posthog-js/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { Task } from "@/lib/types";

interface RecurringScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "edit" | "delete";
  task: Task;
  onJustThisOne: () => void;
  onAllFuture: () => void;
}

export function RecurringScopeDialog({
  open,
  onOpenChange,
  action,
  task,
  onJustThisOne,
  onAllFuture,
}: RecurringScopeDialogProps) {
  const posthog = usePostHog();

  const isEdit = action === "edit";

  function handleJustThisOne() {
    posthog?.capture(
      isEdit ? "recurring_edit_scope_chosen" : "recurring_delete_scope_chosen",
      { scope: "just_this_one", task_id: task.id }
    );
    onOpenChange(false);
    onJustThisOne();
  }

  function handleAllFuture() {
    posthog?.capture(
      isEdit ? "recurring_edit_scope_chosen" : "recurring_delete_scope_chosen",
      { scope: "all_future", task_id: task.id }
    );
    onOpenChange(false);
    onAllFuture();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit recurring task" : "Delete recurring task"}
          </DialogTitle>
          <DialogDescription>
            This is a recurring task. How would you like to apply this change?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={handleJustThisOne} className="justify-start">
            {isEdit ? "Just this one" : "Delete just this one"}
          </Button>
          <Button
            variant={isEdit ? "outline" : "destructive"}
            onClick={handleAllFuture}
            className="justify-start"
          >
            {isEdit ? "All future tasks" : "Delete all future tasks"}
          </Button>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
