import { ConnectorIcon, PlaygroundIcon, ReportsIcon } from "./ProductIcons";

/**
 * The three products, in the order the page shows them and with the one line that says what each is. The How
 * line ends on them, each a link to the product's card. They were on the first screen for a day (2026-10-11) and
 * taken off it on the 12th: the owner wants the first screen to hold the headline, the sentence, the search and
 * the map, and the products to wait for their own cards.
 */
export const PRODUCTS = [
  { id: "playground", name: "Playground", about: "Explore every listing yourself. Free.", Icon: PlaygroundIcon },
  { id: "reports", name: "Reports", about: "We write it up for you.", Icon: ReportsIcon },
  { id: "connector", name: "Connector", about: "Ask it in Claude.", Icon: ConnectorIcon },
] as const;
