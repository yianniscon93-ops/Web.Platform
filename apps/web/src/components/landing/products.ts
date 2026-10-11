import { ConnectorIcon, PlaygroundIcon, ReportsIcon } from "./ProductIcons";

/**
 * The three products, in the order the page shows them and with the one line that says what each is. The first
 * screen names them under the search, and the How line ends on them; both link to the product's card.
 */
export const PRODUCTS = [
  { id: "playground", name: "Playground", about: "Explore every listing yourself. Free.", Icon: PlaygroundIcon },
  { id: "reports", name: "Reports", about: "We write it up for you.", Icon: ReportsIcon },
  { id: "connector", name: "Connector", about: "Ask it in Claude.", Icon: ConnectorIcon },
] as const;
