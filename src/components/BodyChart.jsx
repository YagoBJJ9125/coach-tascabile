// Stylized front+back body silhouette. Muscle regions are colored by rank tier
// AND grow in size with development (FASE 2 avatar morphing): low rank = esile,
// high rank = muscoloso.
import { levelForPoints, development } from "../lib/progression.js";

const BASE = "#2b3040";

function colorFor(ranks, m) {
  const pts = ranks[m]?.points || 0;
  return pts ? levelForPoints(pts).tier.color : BASE;
}
function devFor(ranks, m) {
  return development(ranks[m]?.points || 0); // 0..1
}

// rounded rect that scales about its center; width grows more than height (bulk look)
function Muscle({ cx, cy, w, h, dev, color, rx = 6 }) {
  const fw = 0.7 + dev * 0.8; // 0.7..1.5 width
  const fh = 0.85 + dev * 0.35; // 0.85..1.2 height
  const ww = w * fw,
    hh = h * fh;
  return <rect x={cx - ww / 2} y={cy - hh / 2} width={ww} height={hh} rx={rx} fill={color} />;
}
function MuscleEllipse({ cx, cy, rx, ry, dev, color }) {
  const f = 0.7 + dev * 0.8;
  return <ellipse cx={cx} cy={cy} rx={rx * f} ry={ry * (0.85 + dev * 0.35)} fill={color} />;
}

export default function BodyChart({ ranks = {} }) {
  const c = (m) => colorFor(ranks, m);
  const d = (m) => devFor(ranks, m);

  const Figure = ({ x, back }) => (
    <g transform={`translate(${x},0)`}>
      {/* head + torso base */}
      <circle cx="80" cy="30" r="16" fill={BASE} />
      <path d="M58 52 H102 L108 120 H52 Z" fill={BASE} />
      {/* shoulders */}
      <MuscleEllipse cx={52} cy={58} rx={12} ry={9} dev={d("spalle")} color={c("spalle")} />
      <MuscleEllipse cx={108} cy={58} rx={12} ry={9} dev={d("spalle")} color={c("spalle")} />
      {/* arms */}
      <Muscle cx={45.5} cy={82} w={11} h={40} dev={d("braccia")} color={c("braccia")} />
      <Muscle cx={114.5} cy={82} w={11} h={40} dev={d("braccia")} color={c("braccia")} />
      {/* legs */}
      <Muscle cx={68} cy={152} w={20} h={60} dev={d("gambe")} color={c("gambe")} rx={9} />
      <Muscle cx={92} cy={152} w={20} h={60} dev={d("gambe")} color={c("gambe")} rx={9} />
      {back ? (
        /* lats */
        <Muscle cx={80} cy={81} w={40} h={46} dev={d("schiena")} color={c("schiena")} rx={8} />
      ) : (
        <>
          {/* chest */}
          <Muscle cx={69} cy={66} w={18} h={20} dev={d("petto")} color={c("petto")} />
          <Muscle cx={91} cy={66} w={18} h={20} dev={d("petto")} color={c("petto")} />
          {/* core */}
          <Muscle cx={80} cy={97} w={24} h={34} dev={d("core")} color={c("core")} />
        </>
      )}
      <text x="80" y="210" fill="#9aa0ab" fontSize="11" textAnchor="middle">
        {back ? "Retro" : "Fronte"}
      </text>
    </g>
  );

  return (
    <svg viewBox="0 0 320 240" style={{ width: "100%", height: "auto" }}>
      <Figure x={0} back={false} />
      <Figure x={160} back={true} />
    </svg>
  );
}
