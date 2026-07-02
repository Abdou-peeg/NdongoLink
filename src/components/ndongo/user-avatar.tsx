"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  profile: Pick<Profile, "avatar_url" | "full_name" | "first_name" | "last_name" | "email">;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-32 w-32 text-3xl",
};

export function UserAvatar({ profile, className, size = "md" }: UserAvatarProps) {
  const name =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email?.split("@")[0] ||
    "User";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={profile.avatar_url || undefined} alt={name} />
      <AvatarFallback className="bg-brand-light text-brand font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
