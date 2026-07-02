import { createClient } from "@/lib/supabase/server";
import { NetworkView } from "./network-view";

export const metadata = {
  title: "Mon réseau - NdongoLink",
};

interface NetworkPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function NetworkPage({ searchParams }: NetworkPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const params = await searchParams;
  const initialTab = params.tab === "requests" ? "requests" : "connections";

  // Connexions acceptées (avec l'autre partie)
  const { data: acceptedConns } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id, created_at, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  const acceptedProfiles: Record<string, any> = {};
  const otherIdsAccepted = (acceptedConns || []).map((c) =>
    c.requester_id === user.id ? c.addressee_id : c.requester_id
  );
  if (otherIdsAccepted.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", otherIdsAccepted);
    (profiles || []).forEach((p) => {
      acceptedProfiles[p.id] = p;
    });
  }

  // Invitations reçues
  const { data: pendingReceived } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id, created_at, message, status")
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const requesterIds = (pendingReceived || []).map((c) => c.requester_id);
  const requesterProfiles: Record<string, any> = {};
  if (requesterIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", requesterIds);
    (profiles || []).forEach((p) => {
      requesterProfiles[p.id] = p;
    });
  }

  // Invitations envoyées
  const { data: pendingSent } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id, created_at, status")
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const sentIds = (pendingSent || []).map((c) => c.addressee_id);
  const sentProfiles: Record<string, any> = {};
  if (sentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", sentIds);
    (profiles || []).forEach((p) => {
      sentProfiles[p.id] = p;
    });
  }

  // Suggestions
  const { data: suggestions } = await supabase
    .from("profiles")
    .select("id, full_name, headline, university, field_of_study, location, avatar_url, skills")
    .neq("id", user.id)
    .limit(10);

  return (
    <NetworkView
      initialTab={initialTab}
      acceptedConnections={(acceptedConns || []).map((c) => ({
        connection: c,
        profile: acceptedProfiles[c.requester_id === user.id ? c.addressee_id : c.requester_id],
      }))}
      pendingReceived={(pendingReceived || []).map((c) => ({
        connection: c,
        profile: requesterProfiles[c.requester_id],
      }))}
      pendingSent={(pendingSent || []).map((c) => ({
        connection: c,
        profile: sentProfiles[c.addressee_id],
      }))}
      suggestions={(suggestions || []).filter((s) => !acceptedProfiles[s.id] && !requesterProfiles[s.id] && !sentProfiles[s.id])}
      currentUserId={user.id}
    />
  );
}
