"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback, type FeedbackType } from "@/lib/actions/feedback";

const selectClassName =
  "h-8 appearance-none rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-2.5 pr-7 text-sm text-[var(--text-primary)] font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat";

interface FeedbackDialogProps {
  children: React.ReactNode;
}

export function FeedbackDialog({ children }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setType("general");
    setMessage("");
    setSubmitted(false);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await submitFeedback(type, message);
        setSubmitted(true);
        setTimeout(() => setOpen(false), 1500);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger nativeButton={false} render={<span />}>{children}</DialogTrigger>
      <DialogContent>
        {submitted ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Thanks for your feedback!
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              We appreciate you taking the time.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Send feedback</DialogTitle>
              <DialogDescription>
                Found a bug or have a suggestion? Let us know.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="feedback-type">Type</Label>
                <select
                  id="feedback-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                  className={`${selectClassName} w-full`}
                >
                  <option value="general">General</option>
                  <option value="bug">Bug report</option>
                  <option value="feature">Feature request</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="feedback-message">Message</Label>
                <Textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  maxLength={2000}
                  className="min-h-24"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={isPending || !message.trim()}
                className="bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg font-medium"
              >
                {isPending ? "Sending..." : "Send feedback"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
