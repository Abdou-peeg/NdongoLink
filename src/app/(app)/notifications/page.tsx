import { createClient } from "@/lib/supabase/server";
import { NotificationsList } from "./notifications-list";

export const metadata = {
  title: "Notifications - NdongoLink",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_fkey(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return <NotificationsList notifications={notifications || []} currentUserId={user.id} />;
}
