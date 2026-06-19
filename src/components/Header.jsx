// Global top header: avatar + level + XP bar, streak, coins.
import { useStore, xpNeededFor } from "../lib/store.js";
import { T } from "../theme.js";

export default function Header({ right }) {
  const gamify = useStore((s) => s.gamify);
  const profile = useStore((s) => s.profile);
  const need = xpNeededFor(gamify.level);
  const xpPct = Math.max(0, Math.min(1, gamify.xp / need));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "calc(10px + var(--sat)) 14px 10px",
      }}
    >
      {/* avatar + level + xp */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(150deg,#4da6ff,#8b7cff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {profile.sex === "donna" ? "🧝‍♀️" : "🧑"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>
            Lv.{gamify.level}
          </div>
          <div
            style={{
              height: 7,
              borderRadius: 99,
              background: "var(--surface3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${xpPct * 100}%`,
                height: "100%",
                background: T.blue,
                borderRadius: 99,
              }}
            />
          </div>
        </div>
      </div>

      <Badge icon="🔥" value={gamify.streak} color={T.amber} />
      <Badge icon="💎" value={gamify.coins} color={T.blue} />
      {right}
    </div>
  );
}

function Badge({ icon, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span className="font-display" style={{ fontWeight: 700, color, fontSize: 15 }}>
        {value}
      </span>
    </div>
  );
}
