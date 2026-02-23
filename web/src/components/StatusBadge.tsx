import React from "react";
import { StatusType } from "../types";

export default function StatusBadge({ status, size = "md", className = "" }: { status: StatusType; size?: "sm" | "md" | "lg"; className?: string }) {
  const s = { sm: "dot-sm", md: "dot-md", lg: "dot-lg" };
  return <span className={`dot ${status} ${s[size]} ${className}`} />;
}

export function StatusLabel({ status }: { status: StatusType }) {
  const c: Record<StatusType, string> = { online: "text-mint-400", away: "text-amber-400", busy: "text-coral-400", invisible: "text-dark-400" };
  const l: Record<StatusType, string> = { online: "Online", away: "Away", busy: "Busy", invisible: "Offline" };
  return <span className={`text-xs font-medium ${c[status]}`}>{l[status]}</span>;
}
