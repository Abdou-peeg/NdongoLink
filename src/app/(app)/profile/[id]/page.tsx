import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "./profile-view";

export const metadata = {
  title: "Profil - NdongoLink",
};

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Récupère le profil demandé
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  // Récupère les expériences
  const { data: experiences } = await supabase
    .from("experiences")
    .select("*")
    .eq("profile_id", id)
    .order("start_date", { ascending: false });

  // Statut de connexion entre utilisateur courant et ce profil
  const { data: connection } = await supabase
    .from("connections")
    .select("*")
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`)
    .maybeSingle();

  // Compteur de connexions
  const { count: connectionsCount } = await supabase
    .from("connections")
    .select("*", { count: "exact", head: true })
    .or(`requester_id.eq.${id},addressee_id.eq.${id}`)
    .eq("status", "accepted");

  // Compteur de posts
  const { count: postsCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", id);

  // Endorsements reçus
  const { data: endorsements } = await supabase
    .from("endorsements")
    .select("skill, endorser_id")
    .eq("endorsed_id", id);

  // Quelques posts récents de l'utilisateur (public)
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const isOwn = user.id === id;

  return (
    <ProfileView
      profile={profile}
      experiences={experiences || []}
      connection={connection}
      connectionsCount={connectionsCount || 0}
      postsCount={postsCount || 0}
      endorsements={endorsements || []}
      recentPosts={recentPosts || []}
      isOwn={isOwn}
      currentUserId={user.id}
    />
  );
}
