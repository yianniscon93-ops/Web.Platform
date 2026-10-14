import PublishIsland from "./PublishIsland";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";
import { getInvest, getRentals, getStats } from "@/lib/server/marketData";

/**
 * What the product cards say is about the whole island: its figures are asked for here, on the server, and
 * handed to the cards (PublishIsland), so they arrive with them in. Any that cannot be had is left out.
 */
export default async function IslandSource() {
  const [stats, rentals, invest] = await Promise.all([
    getStats(DEFAULT_FILTERS, null).catch(() => null),
    getRentals(null).catch(() => null),
    getInvest(null).catch(() => null),
  ]);
  // The cards do not use the two lists of single homes, so they are not sent to the browser.
  return <PublishIsland stats={stats} rentals={rentals} invest={invest && { ...invest, screener: [], movers: [] }} />;
}
