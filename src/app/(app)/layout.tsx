import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/ndongo/app-shell";
import type { Profile } from "@/types/database";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupère le profil + compteurs
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Si le profil n'existe pas encore (edge case), on le crée
  if (!profile) {
    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email || "",
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Utilisateur",
      first_name: user.user_metadata?.first_name || null,
      last_name: user.user_metadata?.last_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    });
    const { data: newProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (newProfile) {
      return <AppShell profile={newProfile}>{children}</AppShell>;
    }
  }

  // Récupère les compteurs rapides
  const [{ count: connectionsCount }, { count: pendingRequests }, { count: unreadNotifs }] =
    await Promise.all([
      supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq("status", "accepted"),
      supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("addressee_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
    ]);

  return (
    <AppShell
      profile={(profile as Profile) || null}
      connectionsCount={connectionsCount || 0}
      pendingRequestsCount={pendingRequests || 0}
      unreadNotifsCount={unreadNotifs || 0}
    >
      {children}
    </AppShell>
  );
}
