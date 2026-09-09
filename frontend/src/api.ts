import axios from "axios";
import { AnalysisResult, Holding } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export async function analyzePortfolio(holdings: Holding[]): Promise<AnalysisResult> {
  const payload = {
    holdings: holdings.map((h) => ({
      ticker: h.ticker,
      shares: parseFloat(h.shares),
      acquired_at: h.acquired_at || null,
    })),
  };
  const { data } = await axios.post<AnalysisResult>(`${BASE}/analyze`, payload);
  return data;
}
