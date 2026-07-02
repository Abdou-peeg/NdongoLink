import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-lg" },
    md: { icon: "h-9 w-9", text: "text-xl" },
    lg: { icon: "h-12 w-12", text: "text-2xl" },
  };
  const s = sizes[size];

  return (
    <Link href="/feed" className={cn("flex items-center gap-2 group", className)}>
      <div
        className={cn(
          "relative grid place-items-center rounded-xl bg-brand text-brand-foreground font-bold shadow-sm transition-transform group-hover:scale-105",
          s.icon
        )}
      >
        <span className="font-black tracking-tight">N</span>
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", s.text)}>
          Ndongo<span className="text-brand">Link</span>
        </span>
      )}
    </Link>
  );
}
