import { useState } from "react";
import EntryForm from "./components/EntryForm";
import Dashboard from "./components/Dashboard";
import Backtest from "./components/Backtest";
import { analyzePortfolio } from "./api";
import { AnalysisResult, Holding } from "./types";

type Screen = "entry" | "dashboard" | "backtest";

export default function App() {
  const [screen, setScreen] = useState<Screen>("entry");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (holdings: Holding[]) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzePortfolio(holdings);
      setResult(data);
      setScreen("dashboard");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Something went wrong. Check your ticker symbols.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (screen === "dashboard" && result) {
    return (
      <Dashboard
        result={result}
        onBack={() => setScreen("entry")}
        onBacktest={() => setScreen("backtest")}
      />
    );
  }

  if (screen === "backtest" && result) {
    return <Backtest result={result} onBack={() => setScreen("dashboard")} />;
  }

  return (
    <>
      <EntryForm onSubmit={handleSubmit} loading={loading} />
      {error && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#ef4444",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}
    </>
  );
}
