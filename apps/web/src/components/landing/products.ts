import { ConnectorIcon, CustomIcon, PlaygroundIcon, ReportsIcon } from "./ProductIcons";

/**
 * The four products, in the order the page tells them, each with its name, the one line that says what it is, and who
 * it is for, in the three audiences PRODUCT.md gives (investors, hosts and managers, agents and advisers), and the verb
 * its port carries (owner, 2026-10-19: how the one database reaches you that way). The How line ends on them, each a
 * link; the products' section (ProductsSection) wires them to the data: each is a port under the island's core, and
 * opens its words and its working thing on the stage. They were on the first screen for a day
 * (2026-10-11) and taken off it on the 12th. Custom solutions joined on 2026-10-18 (owner): bespoke data work on
 * request, with no demo of its own, so its working thing is a sheet of example requests and its action is "Email the
 * team". The icons head the bar's phone menu.
 */
export const PRODUCTS = [
  {
    id: "playground",
    name: "Playground",
    about: "Explore any street yourself: short-⁠lets, long-⁠lets and sales side by side.",
    who: "For hosts, investors and agents. Free to explore.",
    verb: "Explore it yourself",
    Icon: PlaygroundIcon,
  },
  {
    id: "reports",
    name: "Reports",
    about: "The full case for one property or one area, written by our team.",
    who: "For investors weighing a buy and agents backing advice.",
    verb: "Read it, written by our team",
    Icon: ReportsIcon,
  },
  {
    id: "connector",
    name: "Connector",
    about: "Our data inside Claude. Ask about any place, in English or Greek.",
    who: "For anyone who already works in Claude.",
    verb: "Ask it in Claude",
    Icon: ConnectorIcon,
  },
  {
    id: "custom",
    name: "Custom solutions",
    about: "Bespoke analyses, datasets and feeds, built on our Cyprus data.",
    who: "For teams with a question of their own.",
    verb: "Have it built to your brief",
    Icon: CustomIcon,
  },
] as const;
