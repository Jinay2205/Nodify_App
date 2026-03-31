import { cn } from "../ui/utils";

type WarmthLevel = "cool" | "neutral" | "warm";

interface StatusBadgeProps {
  level: WarmthLevel;
  className?: string;
}

export function StatusBadge({ level, className }: StatusBadgeProps) {
  const colors = {
    cool: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    neutral: "bg-zinc-700/50 text-zinc-400 border-zinc-600/50",
    warm: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  const labels = {
    cool: "Cool",
    neutral: "Neutral",
    warm: "Warm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono",
        colors[level],
        className
      )}
    >
      {labels[level]}
    </span>
  );
}
