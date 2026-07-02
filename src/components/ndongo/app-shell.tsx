"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ndongo/logo";
import { UserAvatar } from "@/components/ndongo/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  Search,
  User as UserIcon,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface AppShellProps {
  profile: Profile | null;
  connectionsCount?: number;
  pendingRequestsCount?: number;
  unreadNotifsCount?: number;
  children: React.ReactNode;
}

const navItems = [
  { href: "/feed", label: "Accueil", icon: Home },
  { href: "/network", label: "Réseau", icon: Users },
  { href: "/search", label: "Recherche", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notif.", icon: Bell },
];

export function AppShell({
  profile,
  connectionsCount = 0,
  pendingRequestsCount = 0,
  unreadNotifsCount = 0,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const supabase = createClient();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setMobileOpen(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-4">
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-lg p-1.5 hover:bg-muted"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <Logo showText={false} size="md" className="md:flex" />

          {/* Search */}
          <form onSubmit={handleSearch} className="relative hidden flex-1 max-w-xs sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher des étudiants..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="bg-muted/60 pl-9 border-none focus-visible:bg-card focus-visible:ring-1"
            />
          </form>

          {/* Desktop nav */}
          <nav className="ml-auto hidden items-center md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const badge =
                item.href === "/network"
                  ? pendingRequestsCount
                  : item.href === "/notifications"
                  ? unreadNotifsCount
                  : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs font-medium transition-colors",
                    isActive(item.href)
                      ? "text-brand"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive(item.href) ? 2.4 : 2} />
                  <span>{item.label}</span>
                  {badge > 0 && (
                    <span className="absolute right-1 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Profile dropdown trigger */}
            <Link
              href={profile ? `/profile/${profile.id}` : "/feed"}
              className={cn(
                "ml-2 flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors hover:bg-muted",
                pathname.startsWith("/profile") && "text-brand"
              )}
            >
              <UserAvatar profile={profile || { email: "u@u.com" }} size="sm" />
            </Link>
          </nav>

          {/* Mobile: profile + sign out */}
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <Link
              href={profile ? `/profile/${profile.id}` : "/feed"}
              className="rounded-full"
            >
              <UserAvatar profile={profile || { email: "u@u.com" }} size="sm" />
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t bg-card md:hidden">
            <nav className="mx-auto max-w-7xl px-4 py-3 space-y-1">
              <form onSubmit={handleSearch} className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-9"
                />
              </form>
              {navItems.map((item) => {
                const Icon = item.icon;
                const badge =
                  item.href === "/network"
                    ? pendingRequestsCount
                    : item.href === "/notifications"
                    ? unreadNotifsCount
                    : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive(item.href)
                        ? "bg-brand-light text-brand"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {item.label === "Notif." ? "Notifications" : item.label}
                    </span>
                    {badge > 0 && (
                      <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <Link
                href={profile ? `/profile/${profile.id}` : "/feed"}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                <UserIcon className="h-5 w-5" />
                Mon profil
              </Link>
              <Link
                href="/profile/edit"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                <Settings className="h-5 w-5" />
                Modifier le profil
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/5"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Desktop sidebar + main */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20 space-y-4">
            <Link
              href={profile ? `/profile/${profile.id}` : "/feed"}
              className="block overflow-hidden rounded-xl border bg-card text-center shadow-sm transition-shadow hover:shadow-md"
            >
              {profile?.cover_url ? (
                <div
                  className="h-14 bg-cover bg-center"
                  style={{ backgroundImage: `url(${profile.cover_url})` }}
                />
              ) : (
                <div className="h-14 bg-gradient-to-r from-brand to-brand-dark" />
              )}
              <div className="px-4 pb-4">
                <div className="-mt-8 mb-2 flex justify-center">
                  <UserAvatar profile={profile || { email: "u@u.com" }} size="lg" className="ring-4 ring-card" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {profile?.full_name || "Utilisateur"}
                </h3>
                {profile?.headline && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {profile.headline}
                  </p>
                )}
              </div>
            </Link>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <Link href="/network" className="text-sm font-semibold hover:text-brand">
                  Mon réseau
                </Link>
                <span className="text-xs font-medium text-muted-foreground">
                  {connectionsCount}
                </span>
              </div>
              <Link
                href="/network?tab=requests"
                className="flex items-center justify-between text-xs text-muted-foreground hover:text-brand"
              >
                <span>Invitations en attente</span>
                {pendingRequestsCount > 0 && (
                  <span className="grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {pendingRequestsCount}
                  </span>
                )}
              </Link>
            </div>

            <Link
              href="/profile/edit"
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed bg-card p-3 text-sm font-medium text-muted-foreground transition-colors hover:border-brand hover:text-brand"
            >
              <Plus className="h-4 w-4" />
              Compléter mon profil
            </Link>

            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border bg-card p-3 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>

        {/* Right rail (news / suggestions) - hidden on small screens */}
        <aside className="hidden w-72 shrink-0 xl:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-foreground">Actualités étudiantes</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-brand">●</span>
                  <span>Concours d'idées étudiantes - 1er août</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">●</span>
                  <span>Bourses Master 2026 - inscriptions ouvertes</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-600">●</span>
                  <span>Forum entreprise étudiante à Dakar</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">NdongoLink © 2026</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Le réseau des étudiants africains
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
