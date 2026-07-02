import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NdongoLink — Le réseau des étudiants",
  description:
    "NdongoLink, le réseau social professionnel pensé pour les étudiants africains : profils, connexions, opportunités de stage et messagerie.",
  keywords: [
    "NdongoLink",
    "étudiants",
    "réseau social",
    "Afrique",
    "stage",
    "université",
    "connexion",
    "LinkedIn étudiants",
  ],
  authors: [{ name: "NdongoLink" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "NdongoLink — Le réseau des étudiants",
    description:
      "Le réseau social professionnel pensé pour les étudiants africains.",
    siteName: "NdongoLink",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NdongoLink",
    description: "Le réseau social des étudiants africains.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
