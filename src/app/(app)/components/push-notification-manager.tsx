"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BellIcon, XIcon, ShareIcon } from "lucide-react";

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

const DISMISS_KEY = "push-banner-dismissed-at";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function wasDismissedRecently() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

export function PushNotificationManager() {
  const [showBanner, setShowBanner] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [iosNotInstalled, setIosNotInstalled] = useState(false);

  useEffect(() => {
    if (wasDismissedRecently()) return;

    // iOS but not installed as PWA — show "Add to Home Screen" message
    if (isIos() && !isInStandaloneMode()) {
      setIosNotInstalled(true);
      setShowBanner(true);
      return;
    }

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

  function handleDismiss() {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }

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

  if (iosNotInstalled) {
    return (
      <div className="flex items-start gap-3 rounded-xl border-primary/10 bg-primary/[0.06] border px-4 py-3 text-sm">
        <BellIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="flex-1">
          To get morning &amp; evening check-in reminders, add this app to your Home Screen: tap{" "}
          <ShareIcon className="inline size-3.5 align-text-bottom" /> then{" "}
          <span className="font-medium">&quot;Add to Home Screen&quot;</span>
        </p>
        <button
          onClick={handleDismiss}
          className="mt-0.5 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border-primary/10 bg-primary/[0.06] border px-4 py-3 text-sm">
      <BellIcon className="size-4 shrink-0 text-muted-foreground" />
      <p className="flex-1">
        Enable notifications to get morning &amp; evening check-ins
      </p>
      <Button size="sm" onClick={handleEnable} disabled={subscribing}>
        {subscribing ? "Enabling..." : "Enable"}
      </Button>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
