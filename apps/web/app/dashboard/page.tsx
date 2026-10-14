import type { Metadata } from "next";
import DashboardClient from "@/components/dashboard/DashboardClient";
import "./playground.css";

export const metadata: Metadata = {
  title: "Plotsights Playground",
  description:
    "Explore short-let, long-let and for-sale listings across Cyprus: search a place or draw an area and see its numbers.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
