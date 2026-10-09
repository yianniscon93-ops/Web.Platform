import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "PropSights: property data and insights for every street in Cyprus",
  description:
    "Short-let, long-let and for-sale listings across Cyprus, read every day by a small data team. Search a place or draw an area and get its numbers.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "PropSights: property data and insights for every street in Cyprus",
    description: "Search a place in Cyprus or draw an area, and get its short-let, long-let and for-sale numbers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PropSights: property data and insights for every street in Cyprus",
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
      className={`${inter.variable} ${barlowCondensed.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
