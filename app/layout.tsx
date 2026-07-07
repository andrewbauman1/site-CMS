import type { Metadata, Viewport } from "next";
import { Fraunces, Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navigation } from "@/components/layout/Navigation";
import { PwaRegister } from "@/components/PwaRegister";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "500"],
});

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "drewsiph.dev",
  description: "Jekyll CMS - Create notes, posts, and stories",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Writer",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2EFE9" },
    { media: "(prefers-color-scheme: dark)", color: "#204248" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${schibstedGrotesk.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <Providers>
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
