import Link from "next/link";
import { Logo } from "@/components/ndongo/logo";
import {
  Search,
  Users,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Check,
  Heart,
  Bell,
  TrendingUp,
} from "lucide-react";

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-brand-foreground hover:bg-brand-dark"
            >
              Rejoindre
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-light via-background to-brand-light/30" />
        <div className="absolute -right-32 top-0 -z-10 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -left-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              Le réseau social des étudiants africains
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Construis ton réseau,<br />
              <span className="text-brand">propulse ta carrière.</span>
            </h1>
            <p className="mt-5 text-lg text-foreground/70">
              NdongoLink connecte les étudiants d'Afrique et de la diaspora : trouve des camarades,
              des mentors, des stages, et fais grandir ton réseau professionnel pendant tes études.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-base font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand-dark hover:shadow-xl hover:shadow-brand/40"
              >
                Créer mon compte gratuit
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border bg-card px-6 py-3 text-base font-semibold hover:bg-muted"
              >
                J'ai déjà un compte
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-600" /> 100% gratuit
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-600" /> Sans publicité
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-600" /> Faits pour les étudiants
              </span>
            </div>
          </div>

          {/* Visual mockup */}
          <div className="relative">
            <div className="rounded-2xl border bg-card p-5 shadow-2xl shadow-brand/20">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand to-brand-dark" />
                <div>
                  <div className="h-3 w-32 rounded-full bg-muted" />
                  <div className="mt-1.5 h-2 w-44 rounded-full bg-muted/60" />
                </div>
                <div className="ml-auto rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">
                  + Connecter
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Aïssatou Diallo", univ: "UCAD · Informatique", color: "from-pink-400 to-pink-600" },
                  { name: "Moussa Ndiaye", univ: "ESP · Génie Civil", color: "from-blue-400 to-blue-600" },
                  { name: "Fatou Sow", univ: "UGB · Médecine", color: "from-green-400 to-green-600" },
                ].map((u) => (
                  <div key={u.name} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${u.color}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{u.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{u.univ}</div>
                    </div>
                    <div className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-medium text-brand">
                      + Connecter
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-4 -top-4 hidden rounded-xl border bg-card p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2 text-xs">
                <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
                <span className="font-semibold">+24 connexions</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border bg-card p-3 shadow-lg sm:block">
              <div className="flex items-center gap-2 text-xs">
                <Briefcase className="h-4 w-4 text-brand" />
                <span className="font-semibold">Stage trouvé</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tout ce dont tu as besoin pour ton réseau étudiant
            </h2>
            <p className="mt-3 text-foreground/60">
              Une plateforme pensée par et pour les étudiants africains.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Profil étudiant enrichi",
                desc: "Université, filière, compétences, expériences, projets : présente-toi aux recruteurs et aux autres étudiants.",
              },
              {
                icon: Search,
                title: "Recherche intelligente",
                desc: "Trouve des camarades par nom, université, filière ou compétence. Filtres avancés pour cibler ce que tu cherches.",
              },
              {
                icon: Briefcase,
                title: "Connexions professionnelles",
                desc: "Envoie des invitations, construis ton réseau, échange avec des mentors et trouve des opportunités de stage.",
              },
              {
                icon: MessageSquare,
                title: "Messagerie temps réel",
                desc: "Discute en direct avec tes connexions, partage des idées, prépare tes entretiens, organise des projets.",
              },
              {
                icon: TrendingUp,
                title: "Fil d'actualité étudiant",
                desc: "Partage tes réalisations, opportunités, questions. Like, commente et reste informé des nouveautés de ton réseau.",
              },
              {
                icon: Bell,
                title: "Notifications",
                desc: "Sois alerté en temps réel : nouveau like, commentaire, invitation, message — ne rate plus aucune opportunité.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border bg-background p-6 transition-all hover:-translate-y-1 hover:border-brand hover:shadow-lg hover:shadow-brand/10"
              >
                <div className="mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-foreground/70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-brand to-brand-dark py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <GraduationCap className="mx-auto mb-4 h-12 w-12" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Rejoins la communauté NdongoLink
          </h2>
          <p className="mt-3 text-white/80">
            Des milliers d'étudiants t'attendent. Crée ton profil en 30 secondes.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-brand shadow-lg transition-transform hover:scale-105"
          >
            Commencer maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Logo />
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} NdongoLink — Le réseau des étudiants africains.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link href="#" className="hover:text-brand">Conditions</Link>
              <Link href="#" className="hover:text-brand">Confidentialité</Link>
              <Link href="#" className="hover:text-brand">Aide</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
