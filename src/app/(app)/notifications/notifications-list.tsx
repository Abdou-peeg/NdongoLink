"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ndongo/user-avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, Mail, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  actor: any | null;
}

interface NotificationsListProps {
  notifications: NotificationItem[];
  currentUserId: string;
}

const iconByType: Record<string, any> = {
  post_like: Heart,
  comment: MessageCircle,
  connection_request: UserPlus,
  connection_accepted: UserCheck,
  message: Mail,
};

const colorByType: Record<string, string> = {
  post_like: "bg-pink-100 text-pink-600",
  comment: "bg-blue-100 text-blue-600",
  connection_request: "bg-amber-100 text-amber-600",
  connection_accepted: "bg-green-100 text-green-600",
  message: "bg-purple-100 text-purple-600",
};

export function NotificationsList({
  notifications: initial,
  currentUserId,
}: NotificationsListProps) {
  const supabase = createClient();
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);

  // Marque tout comme lu au chargement
  useEffect(() => {
    const markAllRead = async () => {
      const unread = initial.filter((n) => !n.is_read);
      if (unread.length === 0) return;
      // Attend 2s pour laisser l'utilisateur voir les pastilles
      setTimeout(async () => {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", currentUserId)
          .eq("is_read", false);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        router.refresh();
      }, 1500);
    };
    markAllRead();
  }, [currentUserId, initial, supabase, router]);

  const getHref = (n: NotificationItem): string => {
    switch (n.type) {
      case "connection_request":
      case "connection_accepted":
        return n.actor_id ? `/profile/${n.actor_id}` : "/network";
      case "post_like":
      case "comment":
        return "/feed";
      case "message":
        return "/messages";
      default:
        return "/feed";
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <Card className="p-12 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Aucune notification</p>
          <p className="text-sm text-muted-foreground">
            Vos likes, commentaires, invitations et messages apparaîtront ici.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <span className="text-xs text-muted-foreground">
          {notifications.filter((n) => !n.is_read).length} non lue(s)
        </span>
      </div>

      <ul className="space-y-2">
        {notifications.map((n) => {
          const Icon = iconByType[n.type] || Bell;
          const colorClass = colorByType[n.type] || "bg-muted text-muted-foreground";
          return (
            <li key={n.id}>
              <Link href={getHref(n)}>
                <Card
                  className={cn(
                    "flex items-start gap-3 p-3 transition-colors hover:bg-muted/40",
                    !n.is_read && "border-l-4 border-l-brand"
                  )}
                >
                  <div className="relative">
                    {n.actor ? <UserAvatar profile={n.actor} size="md" /> : <div className="h-10 w-10" />}
                    <div
                      className={cn(
                        "absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full ring-2 ring-card",
                        colorClass
                      )}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">
                        {n.actor?.full_name || "Quelqu'un"}
                      </span>{" "}
                      <span className="text-muted-foreground">{n.content}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                  )}
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
