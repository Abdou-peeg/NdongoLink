"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ndongo/user-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  Send,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Profile, Post } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface FeedPost extends Post {
  author: Profile;
  liked_by_me: boolean;
}

interface FeedListProps {
  initialPosts: FeedPost[];
  currentUserId: string;
  suggestions: Array<Partial<Profile> & { id: string }>;
}

export function FeedList({ initialPosts, currentUserId, suggestions }: FeedListProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const supabase = createClient();

  // Realtime: écoute les nouveaux posts
  useEffect(() => {
    const channel = supabase
      .channel("posts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const newPost = payload.new as Post;
          if (newPost.author_id === currentUserId) return; // on a déjà le nôtre après reload
          // Charge l'auteur
          const { data: author } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newPost.author_id)
            .single();
          if (author) {
            setPosts((prev) => [
              { ...newPost, author, liked_by_me: false },
              ...prev,
            ]);
            toast("Nouveau post dans votre fil", { description: author.full_name });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          const oldId = payload.old?.id;
          if (oldId) {
            setPosts((prev) => prev.filter((p) => p.id !== oldId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId]);

  const handleLike = async (postId: string, liked: boolean) => {
    // Optimistic
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: !liked,
              likes_count: Math.max(0, p.likes_count + (liked ? -1 : 1)),
            }
          : p
      )
    );
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", currentUserId);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: currentUserId });
      // Notif
      const post = posts.find((p) => p.id === postId);
      if (post && post.author_id !== currentUserId) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          actor_id: currentUserId,
          type: "post_like",
          entity_id: postId,
          content: "a aimé votre publication",
        });
      }
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Supprimer cette publication ?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      toast.error("Erreur de suppression");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Publication supprimée");
  };

  return (
    <div className="space-y-4">
      {posts.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Aucune publication pour le moment. Soyez le premier à partager !
          </p>
        </Card>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onLike={() => handleLike(post.id, post.liked_by_me)}
          onDelete={() => handleDelete(post.id)}
        />
      ))}

      {suggestions.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Suggestions à connecter</h3>
          <ul className="space-y-3">
            {suggestions.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <UserAvatar profile={s as Profile} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${s.id}`}
                    className="block truncate text-sm font-semibold hover:text-brand"
                  >
                    {s.full_name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {[s.university, s.field_of_study].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <Link href={`/profile/${s.id}`}>Voir</Link>
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

interface PostCardProps {
  post: FeedPost;
  currentUserId: string;
  onLike: () => void;
  onDelete: () => void;
}

function PostCard({ post, currentUserId, onLike, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Array<any>>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const supabase = createClient();

  const isMine = post.author_id === currentUserId;

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(*)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments((s) => !s);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: post.id,
        author_id: currentUserId,
        content: commentText.trim(),
      })
      .select("*, author:profiles!comments_author_id_fkey(*)")
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setCommentText("");
      // Notif
      if (post.author_id !== currentUserId) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          actor_id: currentUserId,
          type: "comment",
          entity_id: post.id,
          content: "a commenté votre publication",
        });
      }
    }
    setPostingComment(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: "Publication NdongoLink", url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="p-4">
        <div className="mb-3 flex items-start gap-3">
          <Link href={`/profile/${post.author_id}`}>
            <UserAvatar profile={post.author} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${post.author_id}`}
              className="font-semibold hover:text-brand"
            >
              {post.author.full_name || "Utilisateur"}
            </Link>
            {post.author.headline && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {post.author.headline}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
            </p>
          </div>
          {isMine && (
            <button
              onClick={onDelete}
              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {post.content && (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
        )}

        {post.image_url && (
          <div className="mt-3 -mx-4 -mb-4 border-t">
            <img
              src={post.image_url}
              alt="Publication"
              className="max-h-[600px] w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Stats */}
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          {post.likes_count > 0 ? (
            <span className="flex items-center gap-1">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-brand">
                <Heart className="h-2.5 w-2.5 fill-white text-white" />
              </span>
              {post.likes_count}
            </span>
          ) : (
            <span />
          )}
          {post.comments_count > 0 && (
            <button onClick={toggleComments} className="hover:text-brand">
              {post.comments_count} commentaire{post.comments_count > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-around border-t px-2 py-1">
        <button
          onClick={onLike}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors hover:bg-muted",
            post.liked_by_me ? "text-brand" : "text-muted-foreground"
          )}
        >
          <Heart className={cn("h-4 w-4", post.liked_by_me && "fill-brand")} />
          <span>J'aime</span>
        </button>
        <button
          onClick={toggleComments}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Commenter</span>
        </button>
        <button
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <Share2 className="h-4 w-4" />
          <span>Partager</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t bg-muted/30 p-4">
          <div className="flex gap-2">
            <UserAvatar
              profile={{ email: "me@me.com", id: currentUserId } as Profile}
              size="sm"
            />
            <div className="flex-1">
              <Textarea
                placeholder="Ajouter un commentaire..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[44px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleComment();
                }}
              />
              <div className="mt-1 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={!commentText.trim() || postingComment}
                  className="h-7 text-xs"
                >
                  {postingComment ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Publier
                </Button>
              </div>
            </div>
          </div>

          {loadingComments ? (
            <div className="mt-3 flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <Link href={`/profile/${c.author_id}`}>
                    <UserAvatar profile={c.author} size="sm" />
                  </Link>
                  <div className="rounded-xl bg-card px-3 py-2">
                    <Link
                      href={`/profile/${c.author_id}`}
                      className="text-xs font-semibold hover:text-brand"
                    >
                      {c.author?.full_name}
                    </Link>
                    <p className="text-sm">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
