import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ndongo/logo";
import { GoogleButton } from "@/components/ndongo/google-button";
import { RegisterForm } from "./register-form";
import Link from "next/link";

export const metadata = {
  title: "Inscription - NdongoLink",
  description: "Rejoignez NdongoLink, le réseau social des étudiants.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
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
          Déjà membre ?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Se connecter
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-8 shadow-lg">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Rejoignez NdongoLink 🚀</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Le réseau social pensé pour les étudiants africains
              </p>
            </div>

            <RegisterForm redirectTo={redirectTo} />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <GoogleButton mode="register" redirectTo={redirectTo} />

            <p className="mt-6 text-center text-xs text-muted-foreground">
              En vous inscrivant, vous acceptez nos{" "}
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
        </div>
      </main>

      <footer className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NdongoLink — Le réseau des étudiants africains.
      </footer>
    </div>
  );
}
