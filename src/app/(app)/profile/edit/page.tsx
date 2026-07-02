import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./profile-edit-form";
import { ExperiencesManager } from "./experiences-manager";

export const metadata = {
  title: "Modifier le profil - NdongoLink",
};

interface ProfileEditPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfileEditPage({ searchParams }: ProfileEditPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: experiences } = await supabase
    .from("experiences")
    .select("*")
    .eq("profile_id", user.id)
    .order("start_date", { ascending: false });

  const params = await searchParams;
  const initialTab = params.tab === "experiences" ? "experiences" : "profile";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Modifier mon profil</h1>
      <ProfileEditForm
        profile={profile}
        initialTab={initialTab}
        experiencesManager={<ExperiencesManager experiences={experiences || []} />}
      />
    </div>
  );
}
