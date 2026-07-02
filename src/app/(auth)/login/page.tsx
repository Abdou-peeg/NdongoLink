import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ndongo/logo";
import { GoogleButton } from "@/components/ndongo/google-button";
import { LoginForm } from "./login-form";
import Link from "next/link";

export const metadata = {
  title: "Connexion - NdongoLink",
  description: "Connectez-vous à NdongoLink, le réseau social des étudiants.",
};

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Si Supabase n'est pas configuré, on affiche quand même la page (sans auto-redirect)
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        redirect("/feed");
      }
    } catch {
      // ignore
    }
  }

  const params = await searchParams;
  const redirectTo = params.redirect;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-light via-background to-background">
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <Logo size="lg" />
        <div className="text-sm text-muted-foreground">
          Nouveau ici ?{" "}
          <Link href="/register" className="font-semibold text-brand hover:underline">
            Créer un compte
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-8 shadow-lg">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Bon retour 👋</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Connectez-vous pour retrouver votre réseau étudiant
              </p>
            </div>

            {params.error && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {params.error === "invalid_credentials"
                  ? "Email ou mot de passe incorrect."
                  : params.error === "callback_error"
                  ? "Erreur lors de la connexion Google. Réessayez."
                  : "Une erreur est survenue. Réessayez."}
              </div>
            )}

            <LoginForm redirectTo={redirectTo} />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <GoogleButton mode="login" redirectTo={redirectTo} />

            <p className="mt-6 text-center text-xs text-muted-foreground">
              En vous connectant, vous acceptez nos{" "}
              <Link href="#" className="underline hover:text-brand">
                Conditions d'utilisation
              </Link>{" "}
              et notre{" "}
              <Link href="#" className="underline hover:text-brand">
                Politique de confidentialité
              </Link>
              .
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore membre ?{" "}
            <Link href="/register" className="font-semibold text-brand hover:underline">
              Rejoignez NdongoLink
            </Link>
          </p>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NdongoLink — Le réseau des étudiants africains.
      </footer>
    </div>
  );
}
