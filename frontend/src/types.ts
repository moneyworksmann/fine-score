export interface Holding {
  ticker: string;
  shares: string;
  acquired_at?: string; // YYYY-MM-DD
}

export interface SubScores {
  F: number;
  I: number;
  N: number;
  E: number;
}

export interface CorrelationMatrix {
  tickers: string[];
  values: number[][];
}

export interface BacktestStats {
  portfolio_max_drawdown: number;
  spy_max_drawdown: number;
  portfolio_ann_return: number;
  spy_ann_return: number;
}

export interface Backtest {
  dates: string[];
  portfolio: number[];
  spy: number[];
  start_date: string | null;
  stats: BacktestStats;
}

export interface PersonalReturn {
  ticker: string;
  acquired_at: string;
  holding_return_pct: number;
  spy_return_pct: number;
  days_held: number;
  outperforming: boolean;
}

export interface Benchmark {
  label: string;
  score: number;
}

export interface AnalysisResult {
  prism_score: number;
  benchmarks: { spy: Benchmark; three_fund: Benchmark };
  sub_scores: SubScores;
  sector_weights: Record<string, number>;
  weights: Record<string, number>;
  correlation_matrix: CorrelationMatrix;
  backtest: Backtest;
  personal_returns: PersonalReturn[];
  callout: string;
}
