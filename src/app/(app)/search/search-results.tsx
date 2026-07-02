"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ndongo/user-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Clock, UserCheck, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import type { Profile, Connection } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface SearchResultsProps {
  results: Profile[];
  connectionMap: Record<string, Connection>;
  currentUserId: string;
  initialQuery: { q: string; university: string; field: string };
}

export function SearchResults({
  results,
  connectionMap,
  currentUserId,
  initialQuery,
}: SearchResultsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [filters, setFilters] = useState(initialQuery);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [localConnections, setLocalConnections] = useState<Record<string, Connection>>(connectionMap);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.university) params.set("university", filters.university);
    if (filters.field) params.set("field", filters.field);
    router.push(`/search?${params.toString()}`);
  };

  const handleConnect = async (targetId: string) => {
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
      setLocalConnections((prev) => ({ ...prev, [targetId]: data }));
      toast.success("Invitation envoyée !");
      await supabase.from("notifications").insert({
        user_id: targetId,
        actor_id: currentUserId,
        type: "connection_request",
        entity_id: data.id,
        content: "vous a envoyé une invitation",
      });
    } else if (error?.code === "23505") {
      toast.error("Invitation déjà envoyée");
    } else {
      toast.error("Erreur. Réessayez.");
    }
    setLoading((s) => ({ ...s, [targetId]: false }));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rechercher des étudiants</h1>
        <p className="text-sm text-muted-foreground">
          Trouvez des camarades, des stagiaires, des mentors par nom, université ou filière.
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={applyFilters} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nom, compétence, mot-clé..."
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              className="pl-9"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs">
                <Filter className="h-3 w-3" /> Université
              </Label>
              <Input
                placeholder="UCAD, ESP, UGB..."
                value={filters.university}
                onChange={(e) => setFilters((f) => ({ ...f, university: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs">
                <Filter className="h-3 w-3" /> Filière
              </Label>
              <Input
                placeholder="Informatique, Médecine..."
                value={filters.field}
                onChange={(e) => setFilters((f) => ({ ...f, field: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="bg-brand hover:bg-brand-dark">
              <Search className="mr-1.5 h-4 w-4" /> Rechercher
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFilters({ q: "", university: "", field: "" });
                router.push("/search");
              }}
            >
              Effacer
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          {results.length} résultat{results.length > 1 ? "s" : ""}
          {initialQuery.q && ` pour « ${initialQuery.q} »`}
        </p>
        {results.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucun étudiant trouvé. Essayez d'autres critères.</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {results.map((p) => {
              const conn = localConnections[p.id];
              return (
                <li key={p.id}>
                  <Card className="flex items-center gap-3 p-3 transition-shadow hover:shadow-md">
                    <Link href={`/profile/${p.id}`}>
                      <UserAvatar profile={p} size="md" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profile/${p.id}`}
                        className="block truncate font-semibold hover:text-brand"
                      >
                        {p.full_name || "Utilisateur"}
                      </Link>
                      {p.headline && (
                        <p className="truncate text-xs text-muted-foreground">{p.headline}</p>
                      )}
                      <p className="truncate text-xs text-muted-foreground">
                        {[p.university, p.field_of_study].filter(Boolean).join(" · ")}
                        {p.location && ` · ${p.location}`}
                      </p>
                      {p.skills && p.skills.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.skills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium"
                            >
                              {s}
                            </span>
                          ))}
                          {p.skills.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{p.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {conn?.status === "accepted" ? (
                        <Button variant="outline" size="sm" disabled>
                          <UserCheck className="mr-1 h-3.5 w-3.5" />
                          Connecté
                        </Button>
                      ) : conn?.status === "pending" && conn.requester_id === currentUserId ? (
                        <Button variant="outline" size="sm" disabled>
                          <Clock className="mr-1 h-3.5 w-3.5" />
                          En attente
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleConnect(p.id)}
                          disabled={loading[p.id]}
                          size="sm"
                          className="bg-brand hover:bg-brand-dark"
                        >
                          {loading[p.id] ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserPlus className="mr-1 h-3.5 w-3.5" />
                          )}
                          Connecter
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
