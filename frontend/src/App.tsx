import { useState, useEffect, useCallback, useRef } from "react";
import EntryForm from "./components/EntryForm";
import Dashboard from "./components/Dashboard";
import Backtest from "./components/Backtest";
import { analyzePortfolio } from "./api";
import { AnalysisResult, Holding } from "./types";

type Screen = "entry" | "dashboard" | "backtest";

const STORAGE_KEY = "prism_holdings";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function loadSavedHoldings(): Holding[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveHoldings(holdings: Holding[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  } catch {}
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("entry");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [savedHoldings, setSavedHoldings] = useState<Holding[] | null>(loadSavedHoldings);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const runAnalysis = useCallback(async (holdings: Holding[], silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await analyzePortfolio(holdings);
      setResult(data);
      setLastUpdated(new Date());
      saveHoldings(holdings);
      setSavedHoldings(holdings);
      setScreen("dashboard");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Something went wrong. Check your ticker symbols.";
      if (!silent) setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Auto-load saved portfolio on mount
  useEffect(() => {
    const saved = loadSavedHoldings();
    if (saved && saved.length >= 2) {
      runAnalysis(saved, false);
    }
  }, [runAnalysis]);

  // Auto-refresh every 5 minutes when dashboard is active
  useEffect(() => {
    if (screen === "dashboard" && savedHoldings) {
      refreshTimer.current = setInterval(() => {
        runAnalysis(savedHoldings, true);
      }, REFRESH_INTERVAL_MS);
    }
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [screen, savedHoldings, runAnalysis]);

  const handleManualRefresh = () => {
    if (savedHoldings) runAnalysis(savedHoldings, false);
  };

  const handleSubmit = (holdings: Holding[]) => runAnalysis(holdings, false);

  const handleReset = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setSavedHoldings(null);
    setResult(null);
    setScreen("entry");
  };

  if (screen === "dashboard" && result) {
    return (
      <Dashboard
        result={result}
        lastUpdated={lastUpdated}
        loading={loading}
        onBack={handleReset}
        onBacktest={() => setScreen("backtest")}
        onRefresh={handleManualRefresh}
      />
    );
  }

  if (screen === "backtest" && result) {
    return <Backtest result={result} onBack={() => setScreen("dashboard")} />;
  }

  return (
    <>
      <EntryForm
        onSubmit={handleSubmit}
        loading={loading}
        initialHoldings={savedHoldings ?? undefined}
      />
      {error && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#ef4444", color: "#fff", padding: "12px 20px",
          borderRadius: "8px", fontSize: "0.9rem", zIndex: 999,
        }}>
          {error}
        </div>
      )}
    </>
  );
}
