export interface Holding {
  ticker: string;
  shares: string;
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
  stats: BacktestStats;
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
  callout: string;
}
