// Muscle groups used by the Rank system (EPIC 5) and exercise tagging.
export const MUSCLE_GROUPS = [
  { key: "petto", label: "Petto", emoji: "🫁" },
  { key: "schiena", label: "Schiena", emoji: "🔙" },
  { key: "spalle", label: "Spalle", emoji: "🎽" },
  { key: "braccia", label: "Braccia", emoji: "💪" },
  { key: "gambe", label: "Gambe", emoji: "🦵" },
  { key: "core", label: "Core / Addome", emoji: "🧱" },
];

export const muscleLabel = (k) =>
  (MUSCLE_GROUPS.find((m) => m.key === k) || {}).label || k;

export const EQUIPMENT = [
  { key: "corpo_libero", label: "Corpo libero" },
  { key: "manubri", label: "Manubri" },
  { key: "bilanciere", label: "Bilanciere" },
  { key: "kettlebell", label: "Kettlebell" },
  { key: "macchina", label: "Macchina" },
  { key: "cavi", label: "Cavi" },
  { key: "trx", label: "TRX" },
  { key: "zavorra", label: "Con zavorra" },
];

export const equipLabel = (k) =>
  (EQUIPMENT.find((e) => e.key === k) || {}).label || k;
