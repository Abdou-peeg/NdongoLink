"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import type { Experience } from "@/types/database";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ExperiencesManagerProps {
  experiences: Experience[];
}

const EXP_TYPES = [
  { value: "internship", label: "Stage" },
  { value: "job", label: "Emploi" },
  { value: "project", label: "Projet académique" },
  { value: "volunteer", label: "Bénévolat" },
  { value: "education", label: "Formation / Études" },
];

const empty = {
  title: "",
  organization: "",
  type: "internship" as string,
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  location: "",
};

export function ExperiencesManager({ experiences: initial }: ExperiencesManagerProps) {
  const supabase = createClient();
  const [experiences, setExperiences] = useState<Experience[]>(initial);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  const startEdit = (e: Experience) => {
    setEditing(e);
    setForm({
      title: e.title || "",
      organization: e.organization || "",
      type: e.type || "internship",
      start_date: e.start_date ? e.start_date.substring(0, 7) : "",
      end_date: e.end_date ? e.end_date.substring(0, 7) : "",
      is_current: e.is_current || false,
      description: e.description || "",
      location: e.location || "",
    });
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditing(null);
    setForm(empty);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditing(null);
    setForm(empty);
  };

  const handleSave = async () => {
    if (!form.title || !form.organization) {
      toast.error("Titre et organisation sont requis");
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        profile_id: user.id,
        title: form.title,
        organization: form.organization,
        type: form.type,
        start_date: form.start_date ? `${form.start_date}-01` : null,
        end_date: form.is_current ? null : form.end_date ? `${form.end_date}-01` : null,
        is_current: form.is_current,
        description: form.description || null,
        location: form.location || null,
      };

      if (editing) {
        const { data, error } = await supabase
          .from("experiences")
          .update(payload)
          .eq("id", editing.id)
          .select()
          .single();
        if (error) throw error;
        setExperiences((prev) => prev.map((e) => (e.id === data.id ? data : e)));
        toast.success("Expérience mise à jour");
      } else {
        const { data, error } = await supabase
          .from("experiences")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setExperiences((prev) => [data, ...prev]);
        toast.success("Expérience ajoutée");
      }
      cancel();
    } catch (err) {
      toast.error("Erreur");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette expérience ?")) return;
    const { error } = await supabase.from("experiences").delete().eq("id", id);
    if (!error) {
      setExperiences((prev) => prev.filter((e) => e.id !== id));
      toast.success("Supprimé");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mes expériences</h2>
          {!isAdding && !editing && (
            <Button onClick={startAdd} size="sm" className="bg-brand hover:bg-brand-dark">
              <Plus className="mr-1 h-4 w-4" /> Ajouter
            </Button>
          )}
        </div>

        {(isAdding || editing) && (
          <div className="mb-6 space-y-4 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {editing ? "Modifier l'expérience" : "Nouvelle expérience"}
              </h3>
              <button onClick={cancel} className="rounded p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  placeholder="Stage en développement web"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organization">Organisation *</Label>
                <Input
                  id="organization"
                  placeholder="Sonatel, Ecole 42, ONG X..."
                  value={form.organization}
                  onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Date de début</Label>
                <Input
                  id="start_date"
                  type="month"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_date">Date de fin</Label>
                <Input
                  id="end_date"
                  type="month"
                  value={form.end_date}
                  disabled={form.is_current}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="location">Lieu</Label>
                <Input
                  id="location"
                  placeholder="Dakar, Sénégal"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch
                  id="is_current"
                  checked={form.is_current}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_current: v }))}
                />
                <Label htmlFor="is_current">J'occupe actuellement ce poste</Label>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez vos missions, réalisations, technologies utilisées..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancel}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand-dark">
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {editing ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </div>
        )}

        {experiences.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune expérience. Cliquez sur « Ajouter » pour commencer.
          </p>
        ) : (
          <ul className="space-y-3">
            {experiences.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{e.title}</h3>
                  <p className="text-sm text-foreground/80">{e.organization}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.start_date && format(new Date(e.start_date), "MMM yyyy", { locale: fr })}
                    {" — "}
                    {e.is_current
                      ? "Présent"
                      : e.end_date
                      ? format(new Date(e.end_date), "MMM yyyy", { locale: fr })
                      : "—"}
                    {e.location && ` · ${e.location}`}
                  </p>
                  {e.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                      {e.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(e)}
                    className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-brand"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="rounded p-2 text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
