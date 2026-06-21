// Cattura i crash di rendering così un singolo componente rotto non sbianca tutta
// la PWA (importante su telefono). Mostra un fallback con ricarica; i dati restano
// salvati in localStorage (local-first), quindi un reload di solito risolve.
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crash catturato da ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#e8eaf0", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🛠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>Qualcosa è andato storto</h2>
        <p style={{ fontSize: 14, color: "#9aa0ab", lineHeight: 1.5, maxWidth: 320, margin: "0 auto 18px" }}>
          I tuoi dati sono al sicuro (salvati sul dispositivo). Ricarica l'app per continuare.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ background: "#4da6ff", color: "#06121f", border: "none", borderRadius: 14, padding: "13px 22px", fontSize: 15, fontWeight: 700 }}
        >
          ↻ Ricarica
        </button>
        <pre style={{ marginTop: 22, fontSize: 11, color: "#6b7280", whiteSpace: "pre-wrap", textAlign: "left", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
          {String(this.state.error?.message || this.state.error)}
        </pre>
      </div>
    );
  }
}
