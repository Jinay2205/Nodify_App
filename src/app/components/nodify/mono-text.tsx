import { cn } from "../ui/utils";

interface MonoTextProps {
  children: React.ReactNode;
  className?: string;
}

export function MonoText({ children, className }: MonoTextProps) {
  return (
    <span className={cn("font-mono text-zinc-400", className)}>
      {children}
    </span>
  );
}
