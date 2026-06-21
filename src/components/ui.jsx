// Reusable UI primitives in Lifoff style.
import { useEffect } from "react";
import { T } from "../theme.js";

export function Card({ children, style, onClick, ...rest }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        padding: 16,
        border: "1px solid var(--line)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  full,
  disabled,
  style,
  ...rest
}) {
  const base = {
    border: "none",
    borderRadius: 14,
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 700,
    width: full ? "100%" : undefined,
    opacity: disabled ? 0.45 : 1,
    transition: "transform .05s ease",
  };
  const variants = {
    primary: { background: T.blue, color: "#06121f" },
    coral: { background: T.coral, color: "#2a0b08" },
    green: { background: T.green, color: "#06210f" },
    ghost: {
      background: "var(--surface2)",
      color: T.text,
      border: "1px solid var(--line)",
    },
    dark: { background: "var(--surface3)", color: T.text },
  };
  return (
    <button disabled={disabled} style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {children}
    </button>
  );
}

export function IconButton({ children, style, ...rest }) {
  return (
    <button
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--line)",
        color: T.text,
        borderRadius: 12,
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Chip({ active, children, style, ...rest }) {
  return (
    <button
      style={{
        background: active ? T.blue : "var(--surface2)",
        color: active ? "#06121f" : T.text,
        border: `1px solid ${active ? T.blue : "var(--line)"}`,
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 50,
        height: 30,
        borderRadius: 999,
        border: "none",
        background: on ? T.blue : "var(--surface3)",
        position: "relative",
        transition: "background .15s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#fff",
          transition: "left .15s",
        }}
      />
    </button>
  );
}

export function ProgressBar({ value, color = T.blue, height = 8, bg = "var(--surface3)" }) {
  return (
    <div style={{ height, background: bg, borderRadius: 999, overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
          transition: "width .3s",
        }}
      />
    </div>
  );
}

export function Segmented({ options, value, onChange, style }) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--surface2)",
        borderRadius: 14,
        padding: 4,
        gap: 4,
        ...style,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 11,
              padding: "10px 8px",
              fontSize: 14,
              fontWeight: 700,
              background: on ? T.blue : "transparent",
              color: on ? "#06121f" : T.mut,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "fade-in .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "var(--maxw)",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "var(--surface)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: "1px solid var(--line)",
          padding: "10px 16px calc(20px + var(--sab))",
          animation: "sheet-up .22s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 99,
            background: "var(--surface3)",
            margin: "6px auto 14px",
          }}
        />
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: T.mut, fontSize: 22 }}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// points: [{label, v}] — small responsive line chart
export function MiniLine({ points, color = "#4da6ff", goal, height = 130 }) {
  if (!points || points.length < 2) return null;
  const W = 320, H = height, pad = 26;
  const vs = points.map((p) => p.v);
  let mn = Math.min(...vs), mx = Math.max(...vs);
  if (goal != null) { mn = Math.min(mn, goal); mx = Math.max(mx, goal); }
  if (mn === mx) { mn -= 1; mx += 1; }
  const x = (i) => pad + (i * (W - 2 * pad)) / (points.length - 1);
  const y = (v) => H - pad - ((v - mn) / (mx - mn)) * (H - 2 * pad);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  const idxs = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }}>
      {goal != null && goal >= mn && goal <= mx && (
        <line x1={pad} x2={W - pad} y1={y(goal)} y2={y(goal)} stroke="#4ade80" strokeDasharray="4 4" strokeWidth="1" />
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.v)} r="3" fill={color} />
      ))}
      {idxs.map((i) => (
        <text key={i} x={x(i)} y={H - 6} fill="#9aa0ab" fontSize="10" textAnchor="middle">
          {points[i].label}
        </text>
      ))}
    </svg>
  );
}

export function EmptyState({ icon = "📭", title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 16px", color: T.mut }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

export const H1 = (props) => (
  <h1
    className="font-display"
    style={{ fontSize: 26, fontWeight: 700, margin: "0 0 16px", ...props.style }}
  >
    {props.children}
  </h1>
);

export const Label = ({ children }) => (
  <label
    style={{ display: "block", fontSize: 12, color: T.mut, margin: "0 0 5px 2px" }}
  >
    {children}
  </label>
);

export const Input = (props) => (
  <input
    {...props}
    style={{
      width: "100%",
      boxSizing: "border-box",
      background: "var(--surface2)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      padding: "12px 13px",
      color: T.text,
      fontSize: 15,
      marginBottom: 12,
      outline: "none",
      ...props.style,
    }}
  />
);

export const Select = (props) => (
  <select
    {...props}
    style={{
      width: "100%",
      boxSizing: "border-box",
      background: "var(--surface2)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      padding: "12px 13px",
      color: T.text,
      fontSize: 15,
      marginBottom: 12,
      outline: "none",
      ...props.style,
    }}
  >
    {props.children}
  </select>
);
