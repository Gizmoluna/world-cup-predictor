import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass p-4 relative", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "title-bc flex items-center gap-2 text-sm tracking-[0.12em] text-muted before:h-3 before:w-1 before:rounded-full before:bg-[var(--accent)] before:content-['']",
        className,
      )}
      {...props}
    />
  );
}
