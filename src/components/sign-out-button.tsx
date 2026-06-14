"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void logout())}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 text-sm font-semibold text-danger transition active:scale-[0.98] disabled:opacity-50"
    >
      <LogOut size={18} />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
