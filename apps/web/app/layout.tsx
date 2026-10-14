import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { OPENING_SCRIPT } from "@/lib/landing/opening";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const TITLE = "Plotsights: plot your next move in Cyprus property";
const DESCRIPTION =
  "Short-lets, long-lets, homes and plots for sale across Cyprus, read every day. Search a place and see what it earns, rents for and sells for.";
// The share image is the first screen itself, its headline beside a drawn town (public/og.png; docs/LANDING.md says how
// it is made). It carries no figures, so it never goes stale.
const SHARE = { url: "/og.png", width: 1200, height: 630, alt: "Plot your next move in Cyprus property. Get the insights." };

export const metadata: Metadata = {
  metadataBase: new URL("https://plotsights.com"),
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", siteName: "Plotsights", images: [SHARE] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [SHARE] },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlowCondensed.variable}`}
      // The script below marks the document for the landing's opening before React takes it over.
      suppressHydrationWarning
    >
      <body className="antialiased">
        {/* Whether the landing page opens on its name is settled here, ahead of the first paint (lib/landing/opening.ts). */}
        <script dangerouslySetInnerHTML={{ __html: OPENING_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
