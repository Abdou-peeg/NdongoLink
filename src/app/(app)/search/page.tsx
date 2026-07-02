import { createClient } from "@/lib/supabase/server";
import { SearchResults } from "./search-results";

export const metadata = {
  title: "Recherche - NdongoLink",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; university?: string; field?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const params = await searchParams;
  const q = params.q?.trim() || "";
  const university = params.university?.trim() || "";
  const field = params.field?.trim() || "";

  let query = supabase.from("profiles").select("*").neq("id", user.id);

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,headline.ilike.%${q}%,skills.cs.{${q}}`
    );
  }
  if (university) {
    query = query.ilike("university", `%${university}%`);
  }
  if (field) {
    query = query.ilike("field_of_study", `%${field}%`);
  }

  const { data: results } = await query.order("created_at", { ascending: false }).limit(50);

  // Récupère les statuts de connexion
  const userIds = (results || []).map((p) => p.id);
  let connectionMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: conns } = await supabase
      .from("connections")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .in("requester_id", [user.id, ...userIds])
      .in("addressee_id", [user.id, ...userIds]);
    (conns || []).forEach((c) => {
      const otherId = c.requester_id === user.id ? c.addressee_id : c.requester_id;
      connectionMap[otherId] = c;
    });
  }

  return (
    <SearchResults
      results={results || []}
      connectionMap={connectionMap}
      currentUserId={user.id}
      initialQuery={{ q, university, field }}
    />
  );
}
