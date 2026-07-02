"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types/database";
import { UserAvatar } from "@/components/ndongo/user-avatar";
import { useRouter } from "next/navigation";

interface ProfileEditFormProps {
  profile: Profile | null;
  initialTab: string;
  experiencesManager: React.ReactNode;
}

const SKILL_SUGGESTIONS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js",
  "Java", "C++", "SQL", "Data Science", "Machine Learning",
  "Excel", "PowerPoint", "Marketing", "Comptabilité", "Finance",
  "Design", "Photographie", "Rédaction", "Management", "Anglais",
];

const INTEREST_SUGGESTIONS = [
  "Tech", "Entrepreneuriat", "Sport", "Musique", "Lecture",
  "Voyages", "Cinéma", "Bénévolat", "Politique", "Écologie",
  "Mode", "Cuisine", "Gaming", "Art", "Spiritualité",
];

export function ProfileEditForm({ profile, initialTab, experiencesManager }: ProfileEditFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    full_name: profile?.full_name || "",
    headline: profile?.headline || "",
    bio: profile?.bio || "",
    university: profile?.university || "",
    field_of_study: profile?.field_of_study || "",
    degree_level: profile?.degree_level || "",
    graduation_year: profile?.graduation_year?.toString() || "",
    location: profile?.location || "",
    phone: profile?.phone || "",
    website: profile?.website || "",
    linkedin_url: profile?.linkedin_url || "",
    twitter_url: profile?.twitter_url || "",
    github_url: profile?.github_url || "",
    is_open_to_work: profile?.is_open_to_work || false,
    is_looking_for_internship: profile?.is_looking_for_internship || false,
    skills: profile?.skills || [],
    interests: profile?.interests || [],
    avatar_url: profile?.avatar_url || "",
    cover_url: profile?.cover_url || "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const update = (key: keyof typeof form, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 3 Mo.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      update("avatar_url", pub.publicUrl);
      // Update DB immediately
      await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
      toast.success("Photo de profil mise à jour");
    } catch (err) {
      toast.error("Erreur d'upload");
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    setUploadingCover(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop();
      const path = `${user.id}/cover-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("covers")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("covers").getPublicUrl(path);
      update("cover_url", pub.publicUrl);
      await supabase.from("profiles").update({ cover_url: pub.publicUrl }).eq("id", user.id);
      toast.success("Bannière mise à jour");
    } catch (err) {
      toast.error("Erreur d'upload");
      console.error(err);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const yearNum = form.graduation_year ? parseInt(form.graduation_year, 10) : null;

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          full_name: form.full_name || `${form.first_name} ${form.last_name}`.trim(),
          headline: form.headline || null,
          bio: form.bio || null,
          university: form.university || null,
          field_of_study: form.field_of_study || null,
          degree_level: form.degree_level || null,
          graduation_year: (yearNum && !isNaN(yearNum)) ? yearNum : null,
          location: form.location || null,
          phone: form.phone || null,
          website: form.website || null,
          linkedin_url: form.linkedin_url || null,
          twitter_url: form.twitter_url || null,
          github_url: form.github_url || null,
          is_open_to_work: form.is_open_to_work,
          is_looking_for_internship: form.is_looking_for_internship,
          skills: form.skills,
          interests: form.interests,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profil enregistré !");
      router.refresh();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (!s) return;
    if (form.skills.includes(s)) return;
    update("skills", [...form.skills, s]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    update("skills", form.skills.filter((s: string) => s !== skill));
  };

  const addInterest = (i: string) => {
    const v = i.trim();
    if (!v) return;
    if (form.interests.includes(v)) return;
    update("interests", [...form.interests, v]);
    setInterestInput("");
  };

  const removeInterest = (i: string) => {
    update("interests", form.interests.filter((s: string) => s !== i));
  };

  return (
    <Tabs defaultValue={initialTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile">Informations</TabsTrigger>
        <TabsTrigger value="experiences">Parcours</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4">
        {/* Avatar & cover */}
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Photo & bannière</h2>
          <div className="mb-4 flex items-center gap-4">
            <UserAvatar profile={{ ...form, email: profile?.email || "" }} size="xl" />
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Changer la photo
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} disabled={uploadingAvatar} />
              </label>
              {form.avatar_url && (
                <button
                  onClick={() => update("avatar_url", "")}
                  className="ml-2 inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                >
                  <X className="h-3 w-3" /> Retirer
                </button>
              )}
            </div>
          </div>

          <div className="h-24 rounded-lg bg-gradient-to-r from-brand to-brand-dark bg-cover bg-center" style={form.cover_url ? { backgroundImage: `url(${form.cover_url})` } : {}}>
            <div className="flex h-full items-center justify-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/60">
                {uploadingCover ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Changer la bannière
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadCover} disabled={uploadingCover} />
              </label>
            </div>
          </div>
        </Card>

        {/* Identity */}
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Identité</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="headline">Titre / accroche</Label>
              <Input
                id="headline"
                placeholder="Étudiant en Génie Logiciel à l'ESMT, passionné de dev mobile"
                value={form.headline}
                onChange={(e) => update("headline", e.target.value)}
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">{form.headline.length}/120</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Parlez de vous, de vos passions, de ce que vous cherchez..."
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                maxLength={1000}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{form.bio.length}/1000</p>
            </div>
          </div>
        </Card>

        {/* Études */}
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Études</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="university">Université / École</Label>
              <Input
                id="university"
                placeholder="UCAD, ESP, ENSAE, Université Gaston Berger..."
                value={form.university}
                onChange={(e) => update("university", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="field_of_study">Filière</Label>
              <Input
                id="field_of_study"
                placeholder="Informatique, Génie Civil, Médecine..."
                value={form.field_of_study}
                onChange={(e) => update("field_of_study", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="degree_level">Niveau</Label>
              <Input
                id="degree_level"
                placeholder="Licence 3, Master 1, Doctorat..."
                value={form.degree_level}
                onChange={(e) => update("degree_level", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="graduation_year">Année de diplôme</Label>
              <Input
                id="graduation_year"
                type="number"
                placeholder="2026"
                value={form.graduation_year}
                onChange={(e) => update("graduation_year", e.target.value)}
                min={2000}
                max={2100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                placeholder="Dakar, Sénégal"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Skills & interests */}
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Compétences & intérêts</h2>

          <div className="space-y-3">
            <Label>Compétences</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une compétence..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => addSkill(skillInput)}>
                Ajouter
              </Button>
            </div>
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.skills.map((s: string) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand">
                    {s}
                    <button onClick={() => removeSkill(s)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).slice(0, 8).map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:border-brand hover:text-brand"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Label>Centres d'intérêt</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un intérêt..."
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInterest(interestInput);
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => addInterest(interestInput)}>
                Ajouter
              </Button>
            </div>
            {form.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.interests.map((i: string) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {i}
                    <button onClick={() => removeInterest(i)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_SUGGESTIONS.filter((s) => !form.interests.includes(s)).slice(0, 8).map((s) => (
                <button
                  key={s}
                  onClick={() => addInterest(s)}
                  className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:border-brand hover:text-brand"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Liens & statut */}
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold">Liens & statut</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="website">Site web</Label>
              <Input id="website" placeholder="https://" value={form.website} onChange={(e) => update("website", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input id="linkedin_url" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={(e) => update("linkedin_url", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="github_url">GitHub</Label>
              <Input id="github_url" placeholder="https://github.com/..." value={form.github_url} onChange={(e) => update("github_url", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twitter_url">Twitter / X</Label>
              <Input id="twitter_url" placeholder="https://twitter.com/..." value={form.twitter_url} onChange={(e) => update("twitter_url", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" placeholder="+221 77 000 00 00" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="is_open_to_work" className="cursor-pointer font-medium">
                  #OpenToWork
                </Label>
                <p className="text-xs text-muted-foreground">
                  Indiquez que vous cherchez un emploi
                </p>
              </div>
              <Switch
                id="is_open_to_work"
                checked={form.is_open_to_work}
                onCheckedChange={(v) => update("is_open_to_work", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="is_looking_for_internship" className="cursor-pointer font-medium">
                  #StageRecherche
                </Label>
                <p className="text-xs text-muted-foreground">
                  Indiquez que vous cherchez un stage
                </p>
              </div>
              <Switch
                id="is_looking_for_internship"
                checked={form.is_looking_for_internship}
                onCheckedChange={(v) => update("is_looking_for_internship", v)}
              />
            </div>
          </div>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="bg-brand hover:bg-brand-dark shadow-lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="experiences">{experiencesManager}</TabsContent>
    </Tabs>
  );
}
