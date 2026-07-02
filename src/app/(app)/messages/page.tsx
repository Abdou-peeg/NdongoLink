import { createClient } from "@/lib/supabase/server";
import { MessagesView } from "./messages-view";

export const metadata = {
  title: "Messages - NdongoLink",
};

interface MessagesPageProps {
  searchParams: Promise<{ conv?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Récupère toutes les conversations où l'utilisateur participe
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const conversationIds = (participations || []).map((p) => p.conversation_id);

  if (conversationIds.length === 0) {
    return (
      <MessagesView
        conversations={[]}
        currentUserId={user.id}
      />
    );
  }

  // Pour chaque conversation, récupère l'autre participant + dernier message
  const conversations: Array<{
    conversation_id: string;
    other_user: any;
    last_message: any | null;
    unread_count: number;
  }> = [];

  // Récupère tous les autres participants
  const { data: allParticipants } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds)
    .neq("user_id", user.id);

  const otherUserIds = Array.from(
    new Set((allParticipants || []).map((p) => p.user_id))
  );
  const { data: otherProfiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", otherUserIds.length > 0 ? otherUserIds : ["00000000-0000-0000-0000-000000000000"]);
  const profileMap: Record<string, any> = {};
  (otherProfiles || []).forEach((p) => (profileMap[p.id] = p));

  // Pour chaque conversation, récupère dernier message + unread count
  for (const convId of conversationIds) {
    const otherParticipant = (allParticipants || []).find((p) => p.conversation_id === convId);
    if (!otherParticipant) continue;

    const { data: lastMessage } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: unread } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", convId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    conversations.push({
      conversation_id: convId,
      other_user: profileMap[otherParticipant.user_id],
      last_message: lastMessage,
      unread_count: unread || 0,
    });
  }

  // Trie par dernier message
  conversations.sort((a, b) => {
    const aDate = a.last_message?.created_at || "1970";
    const bDate = b.last_message?.created_at || "1970";
    return bDate.localeCompare(aDate);
  });

  const params = await searchParams;
  const initialConvId = params.conv || null;

  return (
    <MessagesView
      conversations={conversations}
      currentUserId={user.id}
      initialConversationId={initialConvId}
    />
  );
}
