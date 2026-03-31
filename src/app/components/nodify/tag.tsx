import { cn } from "../ui/utils";

interface TagProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Tag({ children, selected, onClick, className }: TagProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-sm font-mono transition-all border",
        selected
          ? "bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/50 shadow-[0_0_8px_rgba(74,222,128,0.3)]"
          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700",
        className
      )}
    >
      {children}
    </button>
  );
}
