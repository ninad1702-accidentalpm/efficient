"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BellIcon, XIcon } from "lucide-react";

export function PushNotificationManager() {
  const [showBanner, setShowBanner] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription && Notification.permission !== "denied") {
          setShowBanner(true);
        }
      })
      .catch((err) => console.error("SW registration failed:", err));
  }, []);

  async function handleEnable() {
    setSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (res.ok) {
        setShowBanner(false);
      }
    } catch (err) {
      console.error("Push subscription failed:", err);
    } finally {
      setSubscribing(false);
    }
  }

  if (!showBanner) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3 text-sm">
      <BellIcon className="size-4 shrink-0 text-muted-foreground" />
      <p className="flex-1">
        Enable notifications to get morning &amp; evening check-ins
      </p>
      <Button size="sm" onClick={handleEnable} disabled={subscribing}>
        {subscribing ? "Enabling..." : "Enable"}
      </Button>
      <button
        onClick={() => setShowBanner(false)}
        className="text-muted-foreground hover:text-foreground"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
