// Bottom navigation — 5 tabs (no social/friends; single-user app).
import { NavLink } from "react-router-dom";
import { T } from "../theme.js";

const TABS = [
  { to: "/allenamento", label: "Allenamento", icon: "🏋️" },
  { to: "/", label: "Home", icon: "🏠", end: true },
  { to: "/rank", label: "Rank", icon: "⭐" },
  { to: "/alimentazione", label: "Alimentazione", icon: "🍎" },
  { to: "/profilo", label: "Profilo", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        display: "flex",
        justifyContent: "center",
        background: "rgba(14,14,26,.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "var(--maxw)",
          display: "flex",
          padding: "8px 4px calc(8px + var(--sab))",
        }}
      >
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            style={({ isActive }) => ({
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "4px 0",
              fontSize: 10.5,
              fontWeight: 600,
              color: isActive ? T.blue : T.mut,
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  style={{
                    fontSize: 22,
                    filter: isActive ? "none" : "grayscale(.4) opacity(.8)",
                  }}
                >
                  {t.icon}
                </span>
                <span>{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
