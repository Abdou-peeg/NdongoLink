import { createClient } from "@/lib/supabase/server";
import { FeedList } from "./feed-list";
import { CreatePostCard } from "./create-post-card";

export const metadata = {
  title: "Accueil - NdongoLink",
};

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Récupère le profil courant
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Récupère les posts avec auteurs, triés par date
  const { data: posts } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey(*),
      post_likes(post_id, user_id)
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // Récupère les likes de l'utilisateur courant pour ces posts
  const postIds = (posts || []).map((p) => p.id);
  let myLikes: Record<string, boolean> = {};
  if (postIds.length > 0) {
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    myLikes = {};
    (likes || []).forEach((l) => {
      myLikes[l.post_id] = true;
    });
  }

  // Suggestions (étudiants pas encore connectés)
  const { data: suggestions } = await supabase
    .from("profiles")
    .select("id, full_name, headline, university, field_of_study, avatar_url")
    .neq("id", user.id)
    .limit(5);

  return (
    <div className="space-y-4">
      <CreatePostCard profile={profile} />

      <FeedList
        initialPosts={(posts || []).map((p) => ({
          ...p,
          author: p.author,
          liked_by_me: !!myLikes[p.id],
        }))}
        currentUserId={user.id}
        suggestions={suggestions || []}
      />
    </div>
  );
}
