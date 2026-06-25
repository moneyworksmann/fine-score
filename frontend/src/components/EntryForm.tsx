import { useState } from "react";
import { Holding } from "../types";

interface Props {
  onSubmit: (holdings: Holding[]) => void;
  loading: boolean;
}

const EMPTY_ROW: Holding = { ticker: "", shares: "" };

export default function EntryForm({ onSubmit, loading }: Props) {
  const [rows, setRows] = useState<Holding[]>([
    { ticker: "", shares: "" },
    { ticker: "", shares: "" },
  ]);

  const update = (i: number, field: keyof Holding, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = rows.filter((r) => r.ticker.trim() && parseFloat(r.shares) > 0);
    if (valid.length < 2) {
      alert("Enter at least 2 valid holdings.");
      return;
    }
    onSubmit(valid);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>FINE Score</h1>
        <p style={styles.subtitle}>
          Enter your stock holdings to get your portfolio health score.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={styles.headerRow}>
            <span style={styles.colLabel}>Ticker</span>
            <span style={styles.colLabel}>Shares</span>
            <span style={{ width: 32 }} />
          </div>

          {rows.map((row, i) => (
            <div key={i} style={styles.row}>
              <input
                style={styles.input}
                placeholder="AAPL"
                value={row.ticker}
                onChange={(e) => update(i, "ticker", e.target.value.toUpperCase())}
              />
              <input
                style={styles.input}
                placeholder="10"
                type="number"
                min="0"
                step="any"
                value={row.shares}
                onChange={(e) => update(i, "shares", e.target.value)}
              />
              <button
                type="button"
                style={styles.removeBtn}
                onClick={() => removeRow(i)}
                disabled={rows.length <= 2}
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" style={styles.addBtn} onClick={addRow}>
            + Add holding
          </button>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Analyzing…" : "Calculate FINE Score"}
          </button>
        </form>

        <p style={styles.privacy}>
          Your data is processed in memory and never stored.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#0f0f13",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    background: "#1a1a24",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 4px 40px rgba(0,0,0,0.4)",
  },
  title: {
    color: "#ffffff",
    fontSize: "2rem",
    fontWeight: 700,
    margin: "0 0 8px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#8888a0",
    fontSize: "0.95rem",
    margin: "0 0 32px",
  },
  headerRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "8px",
  },
  colLabel: {
    flex: 1,
    color: "#8888a0",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  row: {
    display: "flex",
    gap: "12px",
    marginBottom: "10px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    background: "#12121a",
    border: "1px solid #2a2a3a",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "#ffffff",
    fontSize: "0.95rem",
    outline: "none",
  },
  removeBtn: {
    width: "32px",
    height: "32px",
    background: "transparent",
    border: "none",
    color: "#555570",
    cursor: "pointer",
    fontSize: "0.8rem",
    flexShrink: 0,
  },
  addBtn: {
    background: "transparent",
    border: "1px dashed #2a2a3a",
    borderRadius: "8px",
    color: "#8888a0",
    padding: "10px",
    width: "100%",
    cursor: "pointer",
    fontSize: "0.9rem",
    marginTop: "4px",
    marginBottom: "24px",
  },
  submitBtn: {
    background: "#6c63ff",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    padding: "14px",
    width: "100%",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  privacy: {
    color: "#555570",
    fontSize: "0.75rem",
    textAlign: "center",
    marginTop: "20px",
  },
};
