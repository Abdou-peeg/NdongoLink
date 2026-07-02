"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ndongo/user-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  UserCheck,
  UserPlus,
  Clock,
  Check,
  X,
  Trash2,
  Loader2,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Profile, Connection } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface NetworkViewProps {
  initialTab: string;
  acceptedConnections: Array<{ connection: Connection; profile: Profile }>;
  pendingReceived: Array<{ connection: Connection; profile: Profile }>;
  pendingSent: Array<{ connection: Connection; profile: Profile }>;
  suggestions: Array<Partial<Profile> & { id: string }>;
  currentUserId: string;
}

export function NetworkView({
  initialTab,
  acceptedConnections,
  pendingReceived,
  pendingSent,
  suggestions,
  currentUserId,
}: NetworkViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const acceptConnection = async (connId: string, requesterId: string) => {
    setLoading((s) => ({ ...s, [connId]: true }));
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connId);
    if (!error) {
      toast.success("Connexion acceptée !");
      await supabase.from("notifications").insert({
        user_id: requesterId,
        actor_id: currentUserId,
        type: "connection_accepted",
        entity_id: connId,
        content: "a accepté votre invitation",
      });
      router.refresh();
    } else {
      toast.error("Erreur");
    }
    setLoading((s) => ({ ...s, [connId]: false }));
  };

  const declineConnection = async (connId: string) => {
    if (!confirm("Refuser cette invitation ?")) return;
    setLoading((s) => ({ ...s, [connId]: true }));
    const { error } = await supabase
      .from("connections")
      .update({ status: "declined" })
      .eq("id", connId);
    if (!error) {
      toast.success("Invitation refusée");
      router.refresh();
    }
    setLoading((s) => ({ ...s, [connId]: false }));
  };

  const withdrawRequest = async (connId: string) => {
    if (!confirm("Annuler cette invitation ?")) return;
    setLoading((s) => ({ ...s, [connId]: true }));
    const { error } = await supabase.from("connections").delete().eq("id", connId);
    if (!error) {
      toast.success("Invitation annulée");
      router.refresh();
    }
    setLoading((s) => ({ ...s, [connId]: false }));
  };

  const removeConnection = async (connId: string) => {
    if (!confirm("Supprimer cette connexion ?")) return;
    setLoading((s) => ({ ...s, [connId]: true }));
    const { error } = await supabase.from("connections").delete().eq("id", connId);
    if (!error) {
      toast.success("Connexion supprimée");
      router.refresh();
    }
    setLoading((s) => ({ ...s, [connId]: false }));
  };

  const connectTo = async (targetId: string) => {
    setLoading((s) => ({ ...s, [targetId]: true }));
    const { data, error } = await supabase
      .from("connections")
      .insert({
        requester_id: currentUserId,
        addressee_id: targetId,
        status: "pending",
      })
      .select()
      .single();
    if (!error && data) {
      toast.success("Invitation envoyée !");
      await supabase.from("notifications").insert({
        user_id: targetId,
        actor_id: currentUserId,
        type: "connection_request",
        entity_id: data.id,
        content: "vous a envoyé une invitation",
      });
      router.refresh();
    } else if (error?.code === "23505") {
      toast.error("Invitation déjà envoyée");
    }
    setLoading((s) => ({ ...s, [targetId]: false }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon réseau</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos connexions, invitations et suggestions.
        </p>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">
            Connexions
            {acceptedConnections.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                {acceptedConnections.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests">
            Invitations
            {pendingReceived.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                {pendingReceived.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        {/* Connexions acceptées */}
        <TabsContent value="connections" className="space-y-2">
          {acceptedConnections.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Aucune connexion pour le moment. Commencez par explorer les suggestions.
            </Card>
          ) : (
            <ul className="space-y-2">
              {acceptedConnections.map(({ connection, profile }) => (
                <li key={connection.id}>
                  <Card className="flex items-center gap-3 p-3">
                    <Link href={`/profile/${profile.id}`}>
                      <UserAvatar profile={profile} size="md" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profile/${profile.id}`}
                        className="block truncate font-semibold hover:text-brand"
                      >
                        {profile.full_name}
                      </Link>
                      {profile.headline && (
                        <p className="truncate text-xs text-muted-foreground">
                          {profile.headline}
                        </p>
                      )}
                      <p className="truncate text-xs text-muted-foreground">
                        {[profile.university, profile.field_of_study].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Connecté {formatDistanceToNow(new Date(connection.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/messages/new?to=${profile.id}`}>
                          <Mail className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConnection(connection.id)}
                        disabled={loading[connection.id]}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Invitations reçues */}
        <TabsContent value="requests" className="space-y-3">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Reçues ({pendingReceived.length})</h3>
            {pendingReceived.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                Aucune invitation en attente.
              </Card>
            ) : (
              <ul className="space-y-2">
                {pendingReceived.map(({ connection, profile }) => (
                  <li key={connection.id}>
                    <Card className="flex items-center gap-3 p-3">
                      <Link href={`/profile/${profile.id}`}>
                        <UserAvatar profile={profile} size="md" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/profile/${profile.id}`}
                          className="block truncate font-semibold hover:text-brand"
                        >
                          {profile.full_name}
                        </Link>
                        {profile.headline && (
                          <p className="truncate text-xs text-muted-foreground">
                            {profile.headline}
                          </p>
                        )}
                        {connection.message && (
                          <p className="mt-1 line-clamp-2 rounded bg-muted/40 p-2 text-xs italic">
                            « {connection.message} »
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          onClick={() => acceptConnection(connection.id, profile.id)}
                          disabled={loading[connection.id]}
                          className="bg-brand hover:bg-brand-dark"
                        >
                          {loading[connection.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => declineConnection(connection.id)}
                          disabled={loading[connection.id]}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 mt-4 text-sm font-semibold">Envoyées ({pendingSent.length})</h3>
            {pendingSent.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                Aucune invitation envoyée en attente.
              </Card>
            ) : (
              <ul className="space-y-2">
                {pendingSent.map(({ connection, profile }) => (
                  <li key={connection.id}>
                    <Card className="flex items-center gap-3 p-3">
                      <Link href={`/profile/${profile.id}`}>
                        <UserAvatar profile={profile} size="md" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/profile/${profile.id}`}
                          className="block truncate font-semibold hover:text-brand"
                        >
                          {profile.full_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          En attente · {formatDistanceToNow(new Date(connection.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => withdrawRequest(connection.id)}
                        disabled={loading[connection.id]}
                      >
                        Annuler
                      </Button>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        {/* Suggestions */}
        <TabsContent value="suggestions" className="space-y-2">
          {suggestions.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Aucune suggestion pour le moment.
            </Card>
          ) : (
            <ul className="space-y-2">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <Card className="flex items-center gap-3 p-3">
                    <Link href={`/profile/${s.id}`}>
                      <UserAvatar profile={s as Profile} size="md" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profile/${s.id}`}
                        className="block truncate font-semibold hover:text-brand"
                      >
                        {s.full_name}
                      </Link>
                      {s.headline && (
                        <p className="truncate text-xs text-muted-foreground">{s.headline}</p>
                      )}
                      <p className="truncate text-xs text-muted-foreground">
                        {[s.university, s.field_of_study].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => connectTo(s.id)}
                      disabled={loading[s.id]}
                      className="bg-brand hover:bg-brand-dark"
                    >
                      {loading[s.id] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      Connecter
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
