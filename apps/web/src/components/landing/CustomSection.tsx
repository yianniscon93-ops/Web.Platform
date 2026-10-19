/**
 * The fourth product (owner, 2026-10-18): data analysis and data engineering on a customer's own request, built by the
 * team on its Cyprus data. It has no demo, so its working thing on the products' stage (ProductsSection) is a sheet of
 * paper with four requests as a customer might write them, on an ice tile inside the night. They are examples of what
 * the team can build from the data it holds (yields, occupancy, rent and sale ads, booking pace), written as requests,
 * never as past clients; nothing here promises a turnaround or a price. Its action, "Email the team", is in its row.
 */
const ASKS = [
  {
    kind: "A buy-to-let screen",
    text: "Every two-bed for sale in Limassol under €300,000, with what each would earn as a short-⁠let and rent for as a long-⁠let.",
  },
  {
    kind: "A benchmark",
    text: "Occupancy and nightly rates for our 40 listings, each set against the short-⁠lets on the streets around it.",
  },
  {
    kind: "A weekly export",
    text: "Every new rent and sale ad in Paphos district, as a spreadsheet, each week.",
  },
  {
    kind: "A data feed",
    text: "Our area’s figures, week by week, straight into our own dashboard or model.",
  },
];

export default function CustomSheet() {
  return (
    <div className="cs-sheet">
      <p className="cs-sheet-h">A request might read</p>
      <ul className="cs-asks">
        {ASKS.map((a) => (
          <li key={a.kind}>
            <b>{a.kind}.</b> <q>{a.text}</q>
          </li>
        ))}
      </ul>
    </div>
  );
}
