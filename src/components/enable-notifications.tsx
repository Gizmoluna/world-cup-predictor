"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function EnableNotifications() {
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [state, setState] = useState<"idle" | "on" | "busy" | "unsupported" | "denied">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapid) {
      setState("unsupported");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "idle"))
      .catch(() => {});
  }, [vapid]);

  async function enable() {
    if (!vapid) return;
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub),
      });
      setState(res.ok ? "on" : "idle");
    } catch {
      setState("idle");
    }
  }

  if (state === "unsupported") return null;

  if (state === "on") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-pitch/15 px-4 py-2.5 text-sm font-bold text-pitch">
        <BellRing size={16} /> Notifications on
      </div>
    );
  }

  return (
    <button
      onClick={enable}
      disabled={state === "busy"}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-bold text-[var(--accent)] transition active:scale-95",
        state === "busy" && "opacity-60",
      )}
    >
      <Bell size={16} />
      {state === "denied" ? "Blocked — allow in browser settings" : state === "busy" ? "Enabling…" : "Enable match reminders"}
    </button>
  );
}
