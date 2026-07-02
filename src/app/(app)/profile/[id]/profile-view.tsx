"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ndongo/user-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  GraduationCap,
  Briefcase,
  Link as LinkIcon,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  Pencil,
  UserPlus,
  UserCheck,
  Clock,
  MessageSquare,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { Profile, Experience, Connection, Post } from "@/types/database";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface ProfileViewProps {
  profile: Profile;
  experiences: Experience[];
  connection: Connection | null;
  connectionsCount: number;
  postsCount: number;
  endorsements: Array<{ skill: string; endorser_id: string }>;
  recentPosts: Post[];
  isOwn: boolean;
  currentUserId: string;
}

export function ProfileView({
  profile,
  experiences,
  connection,
  connectionsCount,
  postsCount,
  endorsements,
  recentPosts,
  isOwn,
  currentUserId,
}: ProfileViewProps) {
  const supabase = createClient();
  const router = useRouter();
  const [connState, setConnState] = useState<Connection | null>(connection);
  const [actionLoading, setActionLoading] = useState(false);

  // Group endorsements par skill
  const endorsementsBySkill: Record<string, number> = {};
  endorsements.forEach((e) => {
    endorsementsBySkill[e.skill] = (endorsementsBySkill[e.skill] || 0) + 1;
  });

  const handleConnect = async () => {
    setActionLoading(true);
    const { data, error } = await supabase
      .from("connections")
      .insert({
        requester_id: currentUserId,
        addressee_id: profile.id,
        status: "pending",
      })
      .select()
      .single();
    if (!error && data) {
      setConnState(data);
      toast.success("Invitation envoyée !");
      // Notif au destinataire
      await supabase.from("notifications").insert({
        user_id: profile.id,
        actor_id: currentUserId,
        type: "connection_request",
        entity_id: data.id,
        content: "vous a envoyé une invitation",
      });
    } else if (error?.code === "23505") {
      toast.error("Vous avez déjà envoyé une invitation.");
    } else {
      toast.error("Erreur. Réessayez.");
    }
    setActionLoading(false);
  };

  const handleWithdraw = async () => {
    if (!connState) return;
    if (!confirm("Annuler cette invitation ?")) return;
    setActionLoading(true);
    const { error } = await supabase.from("connections").delete().eq("id", connState.id);
    if (!error) {
      setConnState(null);
      toast.success("Invitation annulée");
    }
    setActionLoading(false);
  };

  const handleRemoveConnection = async () => {
    if (!connState) return;
    if (!confirm("Supprimer cette connexion ?")) return;
    setActionLoading(true);
    const { error } = await supabase.from("connections").delete().eq("id", connState.id);
    if (!error) {
      setConnState(null);
      toast.success("Connexion supprimée");
    }
    setActionLoading(false);
  };

  const handleMessage = async () => {
    // Trouver ou créer une conversation
   const { data: existing, error: rpcError } = await supabase
  .rpc("find_or_create_conversation", {
    other_user_id: profile.id,
  })
  .single();

if (rpcError) {
  console.error("Erreur RPC :", rpcError);
}

    // Fallback : recherche manuelle
    let convId: string | null = existing?.id || null;

    if (!convId) {
      // Récupère toutes les convs de l'utilisateur
      const { data: myParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (myParticipations && myParticipations.length > 0) {
        for (const p of myParticipations) {
          const { data: otherP } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", p.conversation_id)
            .neq("user_id", currentUserId);
          if (otherP && otherP.some((op) => op.user_id === profile.id)) {
            convId = p.conversation_id;
            break;
          }
        }
      }
      if (!convId) {
        // Crée nouvelle conversation
        const { data: newConv, error } = await supabase
          .from("conversations")
          .insert({})
          .select()
          .single();
        if (error || !newConv) {
          toast.error("Erreur. Réessayez.");
          return;
        }
        convId = newConv.id;
        await supabase.from("conversation_participants").insert([
          { conversation_id: newConv.id, user_id: currentUserId },
          { conversation_id: newConv.id, user_id: profile.id },
        ]);
      }
    }
    router.push(`/messages?conv=${convId}`);
  };

  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Utilisateur";

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="overflow-hidden p-0">
        <div
          className="h-32 bg-cover bg-center sm:h-48"
          style={{
            backgroundImage: profile.cover_url
              ? `url(${profile.cover_url})`
              : "linear-gradient(135deg, #0a66c2 0%, #084d92 50%, #062f5b 100%)",
          }}
        />
        <div className="px-4 pb-4 sm:px-6">
          <div className="-mt-16 mb-3 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="rounded-full ring-4 ring-card">
              <UserAvatar profile={profile} size="xl" />
            </div>
            <div className="flex w-full gap-2 sm:w-auto sm:pb-2">
              {isOwn ? (
                <Button asChild className="flex-1 sm:flex-none bg-brand hover:bg-brand-dark">
                  <Link href="/profile/edit">
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Modifier le profil
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleMessage}
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    <MessageSquare className="mr-1.5 h-4 w-4" />
                    Message
                  </Button>
                  {!connState && (
                    <Button
                      onClick={handleConnect}
                      disabled={actionLoading}
                      className="flex-1 bg-brand hover:bg-brand-dark sm:flex-none"
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-1.5 h-4 w-4" />
                      )}
                      Se connecter
                    </Button>
                  )}
                  {connState?.status === "pending" &&
                    connState.requester_id === currentUserId && (
                      <Button
                        onClick={handleWithdraw}
                        variant="outline"
                        disabled={actionLoading}
                        className="flex-1 sm:flex-none"
                      >
                        <Clock className="mr-1.5 h-4 w-4" />
                        En attente
                      </Button>
                    )}
                  {connState?.status === "pending" &&
                    connState.addressee_id === currentUserId && (
                      <Button asChild className="flex-1 bg-brand hover:bg-brand-dark sm:flex-none">
                        <Link href="/network?tab=requests">Répondre</Link>
                      </Button>
                    )}
                  {connState?.status === "accepted" && (
                    <>
                      <Button variant="outline" disabled className="flex-1 sm:flex-none">
                        <UserCheck className="mr-1.5 h-4 w-4" />
                        Connecté
                      </Button>
                      <Button
                        onClick={handleRemoveConnection}
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        title="Supprimer la connexion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
            {profile.headline && (
              <p className="mt-1 text-[15px] text-foreground/80">{profile.headline}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.university && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {profile.university}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              <span>
                {connectionsCount} connexion{connectionsCount > 1 ? "s" : ""}
              </span>
            </div>

            {isOwn && profile.is_open_to_work && (
              <Badge className="mt-3 bg-green-600 hover:bg-green-700">
                #OpenToWork
              </Badge>
            )}
            {isOwn && profile.is_looking_for_internship && (
              <Badge className="mt-3 ml-1 bg-amber-600 hover:bg-amber-700">
                #StageRecherche
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* About */}
      {profile.bio && (
        <Card className="p-5">
          <h2 className="mb-2 text-lg font-semibold">À propos</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {profile.bio}
          </p>
        </Card>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold">Compétences</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <div
                key={skill}
                className="group relative rounded-full border bg-muted/40 px-3 py-1.5 text-sm"
              >
                <span className="font-medium">{skill}</span>
                {endorsementsBySkill[skill] > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {endorsementsBySkill[skill]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold">Centres d'intérêt</h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((i) => (
              <Badge key={i} variant="secondary">
                {i}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Parcours & expériences</h2>
            {isOwn && (
              <Button asChild size="sm" variant="ghost">
                <Link href="/profile/edit?tab=experiences">
                  <Plus className="mr-1 h-4 w-4" /> Ajouter
                </Link>
              </Button>
            )}
          </div>
          <ul className="space-y-4">
            {experiences.map((exp) => (
              <li key={exp.id} className="flex gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-light text-brand">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold leading-tight">{exp.title}</h3>
                  <p className="text-sm text-foreground/80">{exp.organization}</p>
                  <p className="text-xs text-muted-foreground">
                    {exp.start_date && format(new Date(exp.start_date), "MMM yyyy", { locale: fr })}
                    {" — "}
                    {exp.is_current
                      ? "Présent"
                      : exp.end_date
                      ? format(new Date(exp.end_date), "MMM yyyy", { locale: fr })
                      : "—"}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className="mt-1 text-sm text-foreground/80">{exp.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Coordonnées */}
      {(profile.website ||
        profile.linkedin_url ||
        profile.github_url ||
        profile.twitter_url ||
        profile.phone) &&
        isOwn && (
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-semibold">Coordonnées</h2>
            <ul className="space-y-2 text-sm">
              {profile.website && (
                <li className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                  >
                    {profile.website}
                  </a>
                </li>
              )}
              {profile.linkedin_url && (
                <li className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                  >
                    LinkedIn
                  </a>
                </li>
              )}
              {profile.github_url && (
                <li className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                  >
                    GitHub
                  </a>
                </li>
              )}
              {profile.twitter_url && (
                <li className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                  >
                    Twitter
                  </a>
                </li>
              )}
              {profile.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </li>
              )}
            </ul>
          </Card>
        )}

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold">
            Publications récentes
          </h2>
          <ul className="space-y-3">
            {recentPosts.map((p) => (
              <li key={p.id} className="rounded-lg border p-3">
                <p className="line-clamp-3 text-sm">{p.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: fr })} ·{" "}
                  {p.likes_count} like{p.likes_count > 1 ? "s" : ""} · {p.comments_count} com.
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
