"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ndongo/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

interface CreatePostCardProps {
  profile: Profile | null;
}

export function CreatePostCard({ profile }: CreatePostCardProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("posts")
        .upload(fileName, file, { upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("posts").getPublicUrl(fileName);
      setImageUrl(pub.publicUrl);
    } catch (err) {
      toast.error("Erreur d'upload. Réessayez.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return;
    setPosting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non connecté");
      const { error } = await supabase.from("posts").insert({
        author_id: userData.user.id,
        content: content.trim(),
        image_url: imageUrl,
      });
      if (error) throw error;
      toast.success("Publication partagée !");
      setContent("");
      setImageUrl(null);
      // Recharge pour voir le post
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error("Erreur lors de la publication.");
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex gap-3">
        <UserAvatar profile={profile || { email: "u@u.com" }} size="md" />
        <div className="flex-1">
          <Textarea
            placeholder="Partagez une idée, une opportunité de stage, une question..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] resize-none border-none bg-transparent p-0 text-[15px] focus-visible:ring-0"
            maxLength={2000}
          />
          {imageUrl && (
            <div className="relative mt-2 overflow-hidden rounded-lg border">
              <img src={imageUrl} alt="Aperçu" className="max-h-72 w-full object-cover" />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-1">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-brand">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                <span>Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={posting || (!content.trim() && !imageUrl)}
              size="sm"
              className="bg-brand hover:bg-brand-dark"
            >
              {posting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Publier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
