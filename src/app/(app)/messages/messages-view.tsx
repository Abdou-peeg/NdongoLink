"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ndongo/user-avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Conversation {
  conversation_id: string;
  other_user: any;
  last_message: any | null;
  unread_count: number;
}

interface MessagesViewProps {
  conversations: Conversation[];
  currentUserId: string;
  initialConversationId?: string | null;
}

export function MessagesView({
  conversations: initial,
  currentUserId,
  initialConversationId,
}: MessagesViewProps) {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>(initial);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId || null);
  useEffect(() => {
  if (initialConversationId && conversations.length > 0) {
    setSelectedId(initialConversationId);
  }
}, [initialConversationId, conversations]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
  if (initial.length > 0) {
    setLoading(false);
  }
}, [initial]);



  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const name = c.other_user?.full_name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  // Realtime : nouveau message dans n'importe quelle conv
  useEffect(() => {
    const channel = supabase
      .channel("messages-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as any;
          // Trouve la conv concernée
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.conversation_id === msg.conversation_id);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              last_message: msg,
              unread_count: msg.sender_id === currentUserId ? 0 : updated[idx].unread_count + 1,
            };
            // Tri
            updated.sort((a, b) => {
              const aDate = a.last_message?.created_at || "1970";
              const bDate = b.last_message?.created_at || "1970";
              return bDate.localeCompare(aDate);
            });
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId]);

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-1 gap-4 md:grid-cols-3">
      {/* Liste des conversations */}
      <Card className="flex flex-col overflow-hidden md:col-span-1">
        <div className="border-b p-3">
          <h2 className="mb-2 text-lg font-semibold">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
  <p>Chargement...</p>
) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucune conversation. Connectez-vous avec d'autres étudiants pour commencer à échanger.
              </p>
              <Button asChild className="mt-4 bg-brand hover:bg-brand-dark" size="sm">
                <Link href="/search">Trouver des étudiants</Link>
              </Button>
            </div>
          ) : (
            <ul>
              {filtered.map((c) => (
                <li key={c.conversation_id}>
                  <button
                    onClick={() => setSelectedId(c.conversation_id)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b p-3 text-left transition-colors hover:bg-muted/50",
                      selectedId === c.conversation_id && "bg-brand-light"
                    )}
                  >
                    <UserAvatar profile={c.other_user} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-semibold">
                          {c.other_user?.full_name || "Utilisateur"}
                        </p>
                        {c.last_message && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(c.last_message.created_at), {
                              addSuffix: false,
                              locale: fr,
                            })}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.last_message?.content || "Nouvelle conversation"}
                      </p>
                    </div>
                    {c.unread_count > 0 && (
                      <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                        {c.unread_count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Zone de conversation */}
      <Card className="hidden overflow-hidden md:col-span-2 md:flex md:flex-col">
        {selectedId ? (
          <ConversationView conversationId={selectedId} currentUserId={currentUserId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Vos messages</p>
            <p className="text-sm text-muted-foreground">
              Sélectionnez une conversation pour commencer à discuter.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function ConversationView({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const [sending, setSending] = useState(false);

  // Charge messages + other user
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: msgs }, { data: participants }] = await Promise.all([
        supabase
          .from("messages")
          .select("*, sender:profiles!messages_sender_id_fkey(*)")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true }),
        supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conversationId)
          .neq("user_id", currentUserId),
      ]);
      setMessages(msgs || []);
      if (participants && participants.length > 0) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", participants[0].user_id)
          .single();
        setOtherUser(prof);
      }
      // Marque les messages reçus comme lus
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", currentUserId)
        .is("read_at", null);
      setLoading(false);
    };
    load();
  }, [conversationId, currentUserId, supabase]);

  // Realtime : nouveaux messages de cette conv
  useEffect(() => {
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          const { data: sender } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", msg.sender_id)
            .single();
          setMessages((prev) => [...prev, { ...msg, sender }]);
          // Si c'est pas moi l'envoyeur, marque comme lu
          if (msg.sender_id !== currentUserId) {
            await supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", msg.id)
              .is("read_at", null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, currentUserId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: text.trim(),
      })
      .select("*, sender:profiles!messages_sender_id_fkey(*)")
      .single();
    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      setText("");
    } else {
      toast.error("Erreur d'envoi");
    }
    setSending(false);
  };

  return (
    <>
      <div className="border-b p-3">
        {otherUser && (
          <Link
            href={`/profile/${otherUser.id}`}
            className="flex items-center gap-2 hover:text-brand"
          >
            <UserAvatar profile={otherUser} size="sm" />
            <span className="font-semibold">{otherUser.full_name}</span>
            {otherUser.headline && (
              <span className="truncate text-xs text-muted-foreground">
                · {otherUser.headline}
              </span>
            )}
          </Link>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <MessageSquare className="mb-2 h-8 w-8" />
            Démarrez la conversation.
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => {
              const isMe = m.sender_id === currentUserId;
              return (
                <li
                  key={m.id}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      isMe
                        ? "bg-brand text-white"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-[10px]",
                        isMe ? "text-white/70" : "text-muted-foreground"
                      )}
                    >
                      {formatDistanceToNow(new Date(m.created_at), {
                        addSuffix: false,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Écrivez votre message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="bg-brand hover:bg-brand-dark"
            size="icon"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
}
