import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface NewConversationPageProps {
  searchParams: Promise<{ to?: string }>;
}

export default async function NewConversationPage({ searchParams }: NewConversationPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const targetId = params.to;
  if (!targetId) redirect("/messages");

  // Cherche une conversation existante avec cet utilisateur
  const { data: myParticipations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  let existingConvId: string | null = null;
  if (myParticipations && myParticipations.length > 0) {
    for (const p of myParticipations) {
      const { data: otherP } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", p.conversation_id)
        .neq("user_id", user.id);
      if (otherP && otherP.some((op) => op.user_id === targetId)) {
        existingConvId = p.conversation_id;
        break;
      }
    }
  }

  // Si pas de conv existante, en crée une nouvelle
  if (!existingConvId) {
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();
    if (error || !newConv) {
      redirect("/messages");
    }
    existingConvId = newConv.id;
    await supabase.from("conversation_participants").insert([
      { conversation_id: newConv.id, user_id: user.id },
      { conversation_id: newConv.id, user_id: targetId },
    ]);
  }

  redirect(`/messages?conv=${existingConvId}`);
}
