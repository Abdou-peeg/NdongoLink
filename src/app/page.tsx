import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Landing } from "./landing";

export default async function HomePage() {
  // Si Supabase n'est pas configuré, on affiche la landing directement
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <Landing />;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/feed");
    }
  } catch {
    // ignore — on affiche la landing
  }

  return <Landing />;
}
