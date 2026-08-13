import { AnalysisResult } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  result: AnalysisResult;
  onBack: () => void;
  onBacktest: () => void;
}

const SUB_LABELS: Record<string, string> = {
  F: "Diversification",
  I: "Correlation",
  N: "Volatility",
  E: "Concentration",
};

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Well Positioned";
  if (score >= 60) return "Some Exposure";
  if (score >= 40) return "Needs Attention";
  return "High Risk";
}

function CorrelationHeatmap({ matrix }: { matrix: AnalysisResult["correlation_matrix"] }) {
  const { tickers, values } = matrix;
  const cellSize = Math.min(64, Math.floor(320 / tickers.length));

  const cellColor = (val: number) => {
    const r = Math.round(239 + (val * 16));
    const g = Math.round(68 - val * 68);
    const b = Math.round(68 - val * 68);
    const intensity = Math.abs(val);
    if (val > 0.5) return `rgba(239,68,68,${intensity})`;
    if (val > 0) return `rgba(234,179,8,${intensity * 0.8})`;
    return `rgba(34,197,94,${Math.abs(intensity) * 0.8})`;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
        <thead>
          <tr>
            <th style={{ width: cellSize }} />
            {tickers.map((t) => (
              <th key={t} style={{ color: "#8888a0", fontSize: "0.7rem", padding: "4px", fontWeight: 500 }}>
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickers.map((rowT, i) => (
            <tr key={rowT}>
              <td style={{ color: "#8888a0", fontSize: "0.7rem", paddingRight: "8px", textAlign: "right" }}>
                {rowT}
              </td>
              {values[i].map((val, j) => (
                <td
                  key={j}
                  title={`${rowT} / ${tickers[j]}: ${val.toFixed(2)}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: i === j ? "#2a2a3a" : cellColor(val),
                    textAlign: "center",
                    fontSize: "0.65rem",
                    color: "#fff",
                    border: "2px solid #1a1a24",
                    borderRadius: "4px",
                  }}
                >
                  {i !== j ? val.toFixed(2) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BenchmarkBar({ label, score, highlight }: { label: string; score: number; highlight?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ color: highlight ? "#ffffff" : "#8888a0", fontSize: "0.8rem", fontWeight: highlight ? 600 : 400 }}>
          {label}
        </span>
        <span style={{ color: scoreColor(score), fontWeight: 700, fontSize: "0.9rem" }}>{score}</span>
      </div>
      <div style={{ height: "8px", background: "#2a2a3a", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${score}%`,
          background: highlight ? scoreColor(score) : "#3a3a55",
          borderRadius: "99px",
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

export default function Dashboard({ result, onBack, onBacktest }: Props) {
  const { prism_score, benchmarks, sub_scores, sector_weights, correlation_matrix, callout } = result;
  const color = scoreColor(prism_score);
  const label = scoreLabel(prism_score);

  const sectorData = Object.entries(sector_weights)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) }))
    .sort((a, b) => b.value - a.value);

  const subScoreData = Object.entries(sub_scores).map(([key, value]) => ({
    name: SUB_LABELS[key],
    value,
    key,
  }));

  return (
    <div style={styles.container}>
      <div style={styles.inner}>

        {/* Header */}
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={onBack}>← Back</button>
          <h2 style={styles.pageTitle}>PRISM Score</h2>
          <button style={styles.backtestBtn} onClick={onBacktest}>Backtest →</button>
        </div>

        {/* Score gauge */}
        <div style={styles.gaugeCard}>
          <div style={{ ...styles.gauge, borderColor: color }}>
            <span style={{ ...styles.gaugeNumber, color }}>{prism_score}</span>
            <span style={styles.gaugeLabel}>{label}</span>
          </div>

          {/* Callout */}
          <div style={styles.callout}>
            <span style={styles.calloutIcon}>⚠</span>
            <p style={styles.calloutText}>{callout}</p>
          </div>
        </div>

        {/* Benchmark comparison */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>How You Compare</h3>
          <div style={styles.benchmarkRow}>
            <BenchmarkBar label="Your Portfolio" score={prism_score} highlight />
            <BenchmarkBar label={benchmarks.spy.label} score={benchmarks.spy.score} />
            <BenchmarkBar label={benchmarks.three_fund.label} score={benchmarks.three_fund.score} />
          </div>
        </div>

        {/* Sub-scores */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Score Breakdown</h3>
          {subScoreData.map(({ name, value, key }) => (
            <div key={key} style={styles.subScoreRow}>
              <div style={styles.subScoreHeader}>
                <span style={styles.subScoreName}>{name}</span>
                <span style={{ color: scoreColor(value), fontWeight: 600 }}>{value}</span>
              </div>
              <div style={styles.barTrack}>
                <div style={{ ...styles.barFill, width: `${value}%`, background: scoreColor(value) }} />
              </div>
            </div>
          ))}
        </div>

        {/* Sector breakdown */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Sector Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sectorData} layout="vertical" margin={{ left: 16, right: 16 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#8888a0", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#ccccdd", fontSize: 12 }} width={110} />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: "#12121a", border: "none" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {sectorData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#6c63ff" : "#3a3a55"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Correlation heatmap */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Correlation Heatmap</h3>
          <p style={styles.heatmapHint}>Red = move together · Green = move independently</p>
          <CorrelationHeatmap matrix={correlation_matrix} />
        </div>

      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", background: "#0f0f13", padding: "24px" },
  inner: { maxWidth: "640px", margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  pageTitle: { color: "#ffffff", fontSize: "1.2rem", fontWeight: 700, margin: 0 },
  backBtn: { background: "transparent", border: "none", color: "#8888a0", cursor: "pointer", fontSize: "0.9rem" },
  backtestBtn: { background: "#6c63ff", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 14px", cursor: "pointer", fontSize: "0.9rem" },
  gaugeCard: { background: "#1a1a24", borderRadius: "16px", padding: "32px", marginBottom: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" },
  gauge: { width: "140px", height: "140px", borderRadius: "50%", border: "6px solid", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  gaugeNumber: { fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 },
  gaugeLabel: { color: "#8888a0", fontSize: "0.8rem", marginTop: "4px" },
  callout: { background: "#12121a", borderRadius: "10px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start", width: "100%", boxSizing: "border-box" },
  calloutIcon: { fontSize: "1rem", color: "#eab308", flexShrink: 0 },
  calloutText: { color: "#ccccdd", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 },
  card: { background: "#1a1a24", borderRadius: "16px", padding: "24px", marginBottom: "16px" },
  cardTitle: { color: "#ffffff", fontSize: "1rem", fontWeight: 600, margin: "0 0 16px" },
  subScoreRow: { marginBottom: "14px" },
  subScoreHeader: { display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#ccccdd", fontSize: "0.9rem" },
  subScoreName: {},
  barTrack: { height: "6px", background: "#2a2a3a", borderRadius: "99px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "99px", transition: "width 0.6s ease" },
  heatmapHint: { color: "#555570", fontSize: "0.75rem", margin: "0 0 16px" },
  benchmarkRow: { display: "flex", flexDirection: "column", gap: "16px" },
};
