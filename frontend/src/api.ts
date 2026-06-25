import axios from "axios";
import { AnalysisResult, Holding } from "./types";

const BASE = "http://localhost:8000/api";

export async function analyzePortfolio(holdings: Holding[]): Promise<AnalysisResult> {
  const payload = {
    holdings: holdings.map((h) => ({ ticker: h.ticker, shares: parseFloat(h.shares) })),
  };
  const { data } = await axios.post<AnalysisResult>(`${BASE}/analyze`, payload);
  return data;
}
