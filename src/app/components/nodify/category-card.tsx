import { cn } from "../ui/utils";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  icon: LucideIcon;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export function CategoryCard({
  icon: Icon,
  label,
  selected,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 rounded-lg border transition-all",
        "hover:border-zinc-700",
        selected
          ? "bg-zinc-900 border-[#4ADE80] shadow-[0_0_12px_rgba(74,222,128,0.2)]"
          : "bg-zinc-950 border-zinc-800"
      )}
    >
      <Icon
        className={cn(
          "w-8 h-8",
          selected ? "text-[#4ADE80]" : "text-zinc-400"
        )}
      />
      <span
        className={cn(
          "text-sm",
          selected ? "text-white" : "text-zinc-400"
        )}
      >
        {label}
      </span>
    </button>
  );
}
