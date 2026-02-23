import React from "react";
import StatusBadge from "./StatusBadge";
import { StatusType } from "../types";

const gradients = [
  "from-pp-400 to-violet-400",
  "from-mint-400 to-pp-400",
  "from-amber-400 to-coral-400",
  "from-violet-400 to-coral-400",
  "from-pp-400 to-mint-400",
];

export default function Avatar({ src, name, size = "md", status, showStatus = true }: {
  src?: string; name: string; size?: "sm" | "md" | "lg" | "xl"; status?: StatusType; showStatus?: boolean;
}) {
  const sz = { sm: "w-9 h-9 text-xs", md: "w-11 h-11 text-sm", lg: "w-14 h-14 text-base", xl: "w-20 h-20 text-xl" };
  const dp = { sm: "-bottom-0.5 -right-0.5", md: "-bottom-0.5 -right-0.5", lg: "bottom-0 right-0", xl: "bottom-0.5 right-0.5" };
  const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const gi = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length;

  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        <img src={src} alt={name} className={`${sz[size]} rounded-2xl object-cover`} referrerPolicy="no-referrer" />
      ) : (
        <div className={`${sz[size]} rounded-2xl bg-gradient-to-br ${gradients[gi]} flex items-center justify-center font-display font-bold text-white`}>
          {initials}
        </div>
      )}
      {showStatus && status && (
        <StatusBadge status={status} size={size === "xl" || size === "lg" ? "md" : "sm"} className={`absolute ${dp[size]}`} />
      )}
    </div>
  );
}
