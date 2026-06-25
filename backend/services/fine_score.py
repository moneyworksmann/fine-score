import yfinance as yf
import pandas as pd
import numpy as np
from typing import List

SECTOR_MAP = {}  # populated lazily via yfinance

MARKET_EVENTS = [
    {"label": "COVID Crash", "date": "2020-02-20"},
    {"label": "COVID Recovery", "date": "2020-08-18"},
    {"label": "2022 Rate Hikes", "date": "2022-01-03"},
    {"label": "2023 Recovery", "date": "2023-01-01"},
]


def fetch_prices(tickers: List[str], period: str = "5y") -> pd.DataFrame:
    raw = yf.download(tickers, period=period, auto_adjust=True, progress=False)
    if isinstance(raw.columns, pd.MultiIndex):
        prices = raw["Close"]
    else:
        prices = raw[["Close"]]
        prices.columns = tickers
    prices = prices.dropna(how="all")
    return prices


def get_sector(ticker: str) -> str:
    try:
        info = yf.Ticker(ticker).info
        return info.get("sector", "Unknown")
    except Exception:
        return "Unknown"


def score_diversification(sector_weights: dict) -> float:
    """
    Penalizes concentration. Max score when holdings spread across 5+ sectors evenly.
    Uses Herfindahl-Hirschman Index inverted.
    """
    weights = list(sector_weights.values())
    hhi = sum(w ** 2 for w in weights)  # 1.0 = fully concentrated, 0.0 = perfectly spread
    score = max(0.0, 1.0 - hhi) * 100
    return round(score, 1)


def score_correlation(corr_matrix: pd.DataFrame) -> float:
    """
    Average pairwise correlation. Lower average = better diversification.
    Score of 100 = zero correlation, score of 0 = perfect correlation.
    """
    n = len(corr_matrix)
    if n < 2:
        return 100.0
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    avg_corr = upper.stack().mean()
    score = max(0.0, (1.0 - avg_corr)) * 100
    return round(score, 1)


def score_volatility(portfolio_returns: pd.Series) -> float:
    """
    Annualized volatility. Score of 100 = very low vol (<10%), score of 0 = very high (>40%).
    """
    ann_vol = portfolio_returns.std() * np.sqrt(252)
    score = max(0.0, min(100.0, (1 - (ann_vol - 0.10) / 0.30) * 100))
    return round(score, 1)


def score_exposure(weights: dict) -> float:
    """
    Penalizes single-stock concentration. Score of 100 = perfectly equal weight.
    Score drops sharply if any single holding exceeds 30%.
    """
    max_weight = max(weights.values())
    if max_weight > 0.5:
        return round(max(0.0, (1 - max_weight) * 100), 1)
    score = max(0.0, (1 - (max_weight - (1 / len(weights))) * 3) * 100)
    return round(min(100.0, score), 1)


def compute_fine_score(holdings):
    tickers = [h.ticker.upper() for h in holdings]
    shares = {h.ticker.upper(): h.shares for h in holdings}

    prices = fetch_prices(tickers)

    # Drop tickers that returned no data
    valid_tickers = [t for t in tickers if t in prices.columns and prices[t].notna().sum() > 10]
    if len(valid_tickers) < 2:
        raise ValueError("Could not fetch price data for enough tickers. Check your symbols.")

    prices = prices[valid_tickers]
    latest_prices = prices.iloc[-1]

    # Portfolio weights by market value
    market_values = {t: shares[t] * latest_prices[t] for t in valid_tickers}
    total_value = sum(market_values.values())
    weights = {t: mv / total_value for t, mv in market_values.items()}

    # Sector breakdown
    sectors: dict = {}
    for t in valid_tickers:
        sector = get_sector(t)
        sectors[t] = sector

    sector_weights: dict = {}
    for t, w in weights.items():
        s = sectors[t]
        sector_weights[s] = sector_weights.get(s, 0) + w

    # Daily returns and portfolio return series
    returns = prices.pct_change().dropna()
    weight_array = np.array([weights[t] for t in valid_tickers])
    portfolio_returns = returns[valid_tickers].values @ weight_array
    portfolio_returns = pd.Series(portfolio_returns, index=returns.index)

    # Correlation matrix
    corr_matrix = returns[valid_tickers].corr()

    # Sub-scores
    f_score = score_diversification(sector_weights)
    i_score = score_correlation(corr_matrix)
    n_score = score_volatility(portfolio_returns)
    e_score = score_exposure(weights)

    fine_score = round((f_score + i_score + n_score + e_score) / 4, 1)

    # Backtest vs S&P 500
    spy_prices = fetch_prices(["SPY"])
    spy_returns = spy_prices["SPY"].pct_change().dropna()

    aligned = portfolio_returns.align(spy_returns, join="inner")
    port_aligned, spy_aligned = aligned

    port_cumulative = (1 + port_aligned).cumprod()
    spy_cumulative = (1 + spy_aligned).cumprod()

    port_drawdown = (port_cumulative / port_cumulative.cummax() - 1).min()
    spy_drawdown = (spy_cumulative / spy_cumulative.cummax() - 1).min()

    port_ann_return = (port_cumulative.iloc[-1] ** (252 / len(port_cumulative)) - 1)
    spy_ann_return = (spy_cumulative.iloc[-1] ** (252 / len(spy_cumulative)) - 1)

    # Format timeseries for frontend (monthly sampled to reduce payload)
    monthly_port = port_cumulative.resample("ME").last()
    monthly_spy = spy_cumulative.resample("ME").last()

    chart_dates = monthly_port.index.strftime("%Y-%m-%d").tolist()
    chart_portfolio = [round(v, 4) for v in monthly_port.tolist()]
    chart_spy = [round(v, 4) for v in monthly_spy.reindex(monthly_port.index, method="nearest").tolist()]

    # Biggest risk callout
    callout = _generate_callout(f_score, i_score, n_score, e_score, sector_weights, weights, corr_matrix, valid_tickers)

    return {
        "fine_score": fine_score,
        "sub_scores": {"F": f_score, "I": i_score, "N": n_score, "E": e_score},
        "sector_weights": {k: round(v, 4) for k, v in sector_weights.items()},
        "weights": {k: round(v, 4) for k, v in weights.items()},
        "correlation_matrix": {
            "tickers": valid_tickers,
            "values": [[round(corr_matrix.loc[a, b], 3) for b in valid_tickers] for a in valid_tickers],
        },
        "backtest": {
            "dates": chart_dates,
            "portfolio": chart_portfolio,
            "spy": chart_spy,
            "stats": {
                "portfolio_max_drawdown": round(port_drawdown * 100, 2),
                "spy_max_drawdown": round(spy_drawdown * 100, 2),
                "portfolio_ann_return": round(port_ann_return * 100, 2),
                "spy_ann_return": round(spy_ann_return * 100, 2),
            },
        },
        "callout": callout,
    }


def _generate_callout(f, i, n, e, sector_weights, weights, corr_matrix, tickers) -> str:
    lowest = min({"F": f, "I": i, "N": n, "E": e}.items(), key=lambda x: x[1])

    if lowest[0] == "F":
        top_sector = max(sector_weights, key=sector_weights.get)
        pct = round(sector_weights[top_sector] * 100)
        return f"Your portfolio is {pct}% concentrated in {top_sector}. If this sector drops, your whole portfolio feels it."

    if lowest[0] == "I":
        upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
        pair = upper.stack().idxmax()
        val = round(upper.stack().max() * 100)
        return f"{pair[0]} and {pair[1]} move together {val}% of the time — they're not giving you real diversification."

    if lowest[0] == "N":
        return "Your portfolio is significantly more volatile than the S&P 500. Expect larger swings in both directions."

    if lowest[0] == "E":
        top_stock = max(weights, key=weights.get)
        pct = round(weights[top_stock] * 100)
        return f"{top_stock} makes up {pct}% of your portfolio. A bad quarter for this stock hits you hard."

    return "Your portfolio looks reasonably balanced."
