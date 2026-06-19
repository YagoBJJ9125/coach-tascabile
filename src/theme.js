// JS mirror of the CSS variables in index.css, for inline styles.
export const T = {
  bg: "#0e0e1a",
  surface: "#181a24",
  surface2: "#1f2230",
  surface3: "#272b3b",
  line: "#2a2e3c",
  text: "#f5f6fa",
  mut: "#9aa0ab",
  mut2: "#6b7280",
  blue: "#4da6ff",
  bluePress: "#2e8bef",
  coral: "#ff6b5e",
  green: "#4ade80",
  amber: "#ff9f43",
  gold: "#ffc83d",
  purple: "#b58cff",
};

// Rank tiers, low → high. Used by EPIC 5 (Bodyrank).
export const RANK_TIERS = [
  { key: "legno", label: "Legno", color: "#b07a4a" },
  { key: "bronzo", label: "Bronzo", color: "#cd7f32" },
  { key: "argento", label: "Argento", color: "#c0c7d0" },
  { key: "oro", label: "Oro", color: "#ffc83d" },
  { key: "platino", label: "Platino", color: "#5fe0c6" },
  { key: "diamante", label: "Diamante", color: "#8b7cff" },
  { key: "titan", label: "Titan", color: "#ff4d5e" },
];

export const rankByKey = (k) => RANK_TIERS.find((r) => r.key === k) || RANK_TIERS[0];
