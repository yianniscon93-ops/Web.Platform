import type { Metadata } from "next";
import { Inter, Barlow_Condensed, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/* The first screen's sentence is set in a serif beside the Google Sans headline (owner, 2026-10-10: "different
   fonts for this part? your call"): Newsreader, an optical-size serif made for reading on screens. */
const newsreader = Newsreader({
  weight: ["400", "500"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-newsreader",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plotsights: property data and insights for every street in Cyprus",
  description:
    "Short-let, long-let and for-sale listings across Cyprus, read every day by a small data team. Search a place or draw an area and get its numbers.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Plotsights: property data and insights for every street in Cyprus",
    description: "Search a place in Cyprus or draw an area, and get its short-let, long-let and for-sale numbers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plotsights: property data and insights for every street in Cyprus",
    description: "Search a place in Cyprus or draw an area, and get its short-let, long-let and for-sale numbers.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlowCondensed.variable} ${newsreader.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
