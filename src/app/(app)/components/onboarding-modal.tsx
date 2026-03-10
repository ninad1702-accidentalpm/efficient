"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "@/lib/actions/profile";

export function OnboardingModal({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show);

  async function handleGetStarted() {
    setOpen(false);
    await completeOnboarding();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Welcome to Efficient!</DialogTitle>
          <DialogDescription>
            Your AI-powered task manager. Here are a few tips to get started:
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="shrink-0 font-medium text-foreground">1.</span>
            <span>
              <strong className="text-foreground">Add tasks</strong> — type a
              title and optionally pick a due date. Tasks without a date go to
              &ldquo;Someday.&rdquo;
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-medium text-foreground">2.</span>
            <span>
              <strong className="text-foreground">Use the Scratch Pad</strong>{" "}
              — dump meeting notes or ideas, then let AI extract tasks for you.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-medium text-foreground">3.</span>
            <span>
              <strong className="text-foreground">Stay on track</strong> —
              enable notifications for morning and evening check-ins to keep
              your list fresh.
            </span>
          </li>
        </ul>
        <DialogFooter>
          <Button onClick={handleGetStarted} className="w-full sm:w-auto">
            Get started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
