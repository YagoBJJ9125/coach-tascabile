// Stylized front+back body silhouette, muscle regions colored by rank tier.
import { tierForPoints } from "../lib/workout.js";

const BASE = "#2b3040";

function colorFor(ranks, muscle) {
  const pts = ranks[muscle]?.points || 0;
  if (!pts) return BASE;
  return tierForPoints(pts).tier.color;
}

export default function BodyChart({ ranks = {} }) {
  const c = (m) => colorFor(ranks, m);
  return (
    <svg viewBox="0 0 320 240" style={{ width: "100%", height: "auto" }}>
      {/* ===== FRONT ===== */}
      <g transform="translate(0,0)">
        {/* head */}
        <circle cx="80" cy="30" r="16" fill={BASE} />
        {/* torso base */}
        <path d="M58 52 H102 L108 120 H52 Z" fill={BASE} />
        {/* shoulders */}
        <ellipse cx="52" cy="58" rx="12" ry="9" fill={c("spalle")} />
        <ellipse cx="108" cy="58" rx="12" ry="9" fill={c("spalle")} />
        {/* chest */}
        <rect x="60" y="56" width="18" height="20" rx="6" fill={c("petto")} />
        <rect x="82" y="56" width="18" height="20" rx="6" fill={c("petto")} />
        {/* arms */}
        <rect x="40" y="62" width="11" height="40" rx="6" fill={c("braccia")} />
        <rect x="109" y="62" width="11" height="40" rx="6" fill={c("braccia")} />
        {/* core */}
        <rect x="68" y="80" width="24" height="34" rx="6" fill={c("core")} />
        {/* legs */}
        <rect x="58" y="122" width="20" height="60" rx="9" fill={c("gambe")} />
        <rect x="82" y="122" width="20" height="60" rx="9" fill={c("gambe")} />
        <text x="80" y="210" fill="#9aa0ab" fontSize="11" textAnchor="middle">
          Fronte
        </text>
      </g>

      {/* ===== BACK ===== */}
      <g transform="translate(160,0)">
        <circle cx="80" cy="30" r="16" fill={BASE} />
        <path d="M58 52 H102 L108 120 H52 Z" fill={BASE} />
        {/* shoulders/traps */}
        <ellipse cx="52" cy="58" rx="12" ry="9" fill={c("spalle")} />
        <ellipse cx="108" cy="58" rx="12" ry="9" fill={c("spalle")} />
        {/* back (lats) */}
        <path d="M60 58 H100 L96 104 H64 Z" fill={c("schiena")} />
        {/* arms */}
        <rect x="40" y="62" width="11" height="40" rx="6" fill={c("braccia")} />
        <rect x="109" y="62" width="11" height="40" rx="6" fill={c("braccia")} />
        {/* legs (hamstrings) */}
        <rect x="58" y="122" width="20" height="60" rx="9" fill={c("gambe")} />
        <rect x="82" y="122" width="20" height="60" rx="9" fill={c("gambe")} />
        <text x="80" y="210" fill="#9aa0ab" fontSize="11" textAnchor="middle">
          Retro
        </text>
      </g>
    </svg>
  );
}
