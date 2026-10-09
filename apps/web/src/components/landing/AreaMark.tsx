import { LANDING } from "./tokens";

/** The brand mark: a hand-drawn area with its five vertex handles. */
export default function AreaMark({
  size = 34,
  stroke = LANDING.ink,
  handles = true,
}: {
  size?: number;
  stroke?: string;
  handles?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <path
        d="M7 9.5 22.5 6l6.5 13-10 9L7 22z"
        fill={LANDING.mark}
        stroke={stroke}
        strokeWidth={handles ? 2.2 : 2.4}
        strokeLinejoin="round"
      />
      {handles && (
        <g fill={LANDING.ground} stroke={stroke} strokeWidth="1.8">
          <rect x="4.5" y="7" width="5" height="5" />
          <rect x="20" y="3.5" width="5" height="5" />
          <rect x="26.5" y="16.5" width="5" height="5" />
          <rect x="16.5" y="25.5" width="5" height="5" />
          <rect x="4.5" y="19.5" width="5" height="5" />
        </g>
      )}
    </svg>
  );
}
