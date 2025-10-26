"use client";

import * as React from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavSecondary({
  items,
  className,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
  className?: string;
}) {
  return (
    <nav className={cn("space-y-1", className)}>
      {items.map((item) => (
        <Link
          key={item.title}
          href={item.url}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      ))}
    </nav>
  );
}
