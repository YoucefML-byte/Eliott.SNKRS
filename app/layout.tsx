import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { SiteShell } from "@/components/layout/site-shell";

import "./globals.css";

// une seule police, classique et grasse, pour tout le site (titres, textes, prix)
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Eliott SNKRS — Sneakers, maroquinerie et accessoires", template: "%s · Eliott SNKRS" },
  description: "Sneakers, maroquinerie et accessoires, neufs et d'occasion : Jordan, Nike, Prada, Louis Vuitton et collabs, des pièces authentifiées, notées et expédiées sous 48 h.",
};

export const viewport: Viewport = { themeColor: "#b4b4b4" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
