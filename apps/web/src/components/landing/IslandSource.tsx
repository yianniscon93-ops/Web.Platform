import PublishIsland from "./PublishIsland";
import { getIsland } from "@/lib/landing/island";

/**
 * What the product cards say is about the whole island: its figures are asked for here, on the server (getIsland,
 * read once per render and shared with the first screen and "How the numbers are made"), and handed to the cards
 * (PublishIsland), so they arrive with them in. Any that cannot be had is left out.
 */
export default async function IslandSource() {
  const { stats, rentals, invest, occMedian } = await getIsland();
  return <PublishIsland stats={stats} rentals={rentals} invest={invest} occMedian={occMedian} />;
}
