import { AnalysisResult } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Props {
  result: AnalysisResult;
  onBack: () => void;
}

const EVENTS = [
  { date: "2020-02", label: "COVID Crash" },
  { date: "2022-01", label: "Rate Hikes" },
  { date: "2023-01", label: "Recovery" },
];

function verdict(stats: AnalysisResult["backtest"]["stats"]): string {
  const portDD = Math.abs(stats.portfolio_max_drawdown);
  const spyDD = Math.abs(stats.spy_max_drawdown);
  const portRet = stats.portfolio_ann_return;
  const spyRet = stats.spy_ann_return;

  if (portRet > spyRet && portDD < spyDD)
    return "Your portfolio outperformed the S&P 500 with less drawdown — strong risk-adjusted results.";
  if (portRet > spyRet && portDD >= spyDD)
    return `Your portfolio beat the S&P 500 in returns but took ${(portDD - spyDD).toFixed(1)}% more drawdown to get there.`;
  if (portRet <= spyRet && portDD < spyDD)
    return `Your portfolio was more stable than the S&P 500 but underperformed on returns — consider your risk tolerance.`;
  return `Your portfolio underperformed the S&P 500 and experienced deeper drawdowns. Review your holdings for better diversification.`;
}

export default function Backtest({ result, onBack }: Props) {
  const { backtest } = result;
  const { dates, portfolio, spy, stats } = backtest;

  const chartData = dates.map((date, i) => ({
    date: date.slice(0, 7),
    Portfolio: portfolio[i],
    "S&P 500": spy[i],
  }));

  const eventLines = EVENTS.filter((e) =>
    dates.some((d) => d.startsWith(e.date))
  );

  return (
    <div style={styles.container}>
      <div style={styles.inner}>

        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={onBack}>← Dashboard</button>
          <h2 style={styles.pageTitle}>Backtest</h2>
          <div style={{ width: 80 }} />
        </div>

        {/* Chart */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Your Portfolio vs S&P 500 (5 Years)</h3>
          <p style={styles.hint}>Starting value = $1.00</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ left: -10, right: 8 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: "#8888a0", fontSize: 10 }}
                tickFormatter={(v) => v.slice(0, 7)}
                interval={11}
              />
              <YAxis
                tick={{ fill: "#8888a0", fontSize: 10 }}
                tickFormatter={(v) => `${v.toFixed(1)}x`}
              />
              <Tooltip
                formatter={(v: number) => `${v.toFixed(2)}x`}
                contentStyle={{ background: "#12121a", border: "none", fontSize: "0.85rem" }}
              />
              <Legend wrapperStyle={{ fontSize: "0.85rem", color: "#ccccdd" }} />
              {eventLines.map((e) => (
                <ReferenceLine
                  key={e.date}
                  x={e.date}
                  stroke="#555570"
                  strokeDasharray="3 3"
                  label={{ value: e.label, fill: "#555570", fontSize: 9, position: "top" }}
                />
              ))}
              <Line type="monotone" dataKey="Portfolio" stroke="#6c63ff" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="S&P 500" stroke="#3a3a55" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <StatCard
            label="Your Max Drawdown"
            value={`${stats.portfolio_max_drawdown}%`}
            sub={`S&P 500: ${stats.spy_max_drawdown}%`}
            warn={Math.abs(stats.portfolio_max_drawdown) > Math.abs(stats.spy_max_drawdown)}
          />
          <StatCard
            label="Your Ann. Return"
            value={`${stats.portfolio_ann_return}%`}
            sub={`S&P 500: ${stats.spy_ann_return}%`}
            warn={stats.portfolio_ann_return < stats.spy_ann_return}
          />
        </div>

        {/* Verdict */}
        <div style={styles.verdictCard}>
          <p style={styles.verdictText}>{verdict(stats)}</p>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, sub, warn }: { label: string; value: string; sub: string; warn: boolean }) {
  return (
    <div style={statStyles.card}>
      <p style={statStyles.label}>{label}</p>
      <p style={{ ...statStyles.value, color: warn ? "#ef4444" : "#22c55e" }}>{value}</p>
      <p style={statStyles.sub}>{sub}</p>
    </div>
  );
}

const statStyles: Record<string, React.CSSProperties> = {
  card: { background: "#1a1a24", borderRadius: "12px", padding: "20px", flex: 1 },
  label: { color: "#8888a0", fontSize: "0.8rem", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" },
  value: { fontSize: "1.8rem", fontWeight: 700, margin: "0 0 4px" },
  sub: { color: "#555570", fontSize: "0.8rem", margin: 0 },
};

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", background: "#0f0f13", padding: "24px" },
  inner: { maxWidth: "640px", margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  pageTitle: { color: "#ffffff", fontSize: "1.2rem", fontWeight: 700, margin: 0 },
  backBtn: { background: "transparent", border: "none", color: "#8888a0", cursor: "pointer", fontSize: "0.9rem" },
  card: { background: "#1a1a24", borderRadius: "16px", padding: "24px", marginBottom: "16px" },
  cardTitle: { color: "#ffffff", fontSize: "1rem", fontWeight: 600, margin: "0 0 4px" },
  hint: { color: "#555570", fontSize: "0.75rem", margin: "0 0 16px" },
  statsGrid: { display: "flex", gap: "12px", marginBottom: "16px" },
  verdictCard: { background: "#1a1a24", borderRadius: "16px", padding: "20px" },
  verdictText: { color: "#ccccdd", fontSize: "0.95rem", margin: 0, lineHeight: 1.6 },
};
