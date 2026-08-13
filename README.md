# PRISM Score

A portfolio health analyzer for individual investors. Enter your stock holdings and get an instant **PRISM Score** — a 0–100 rating of how well-constructed your portfolio is, benchmarked against the S&P 500 and a classic 3-fund portfolio.

![PRISM Score Dashboard](https://raw.githubusercontent.com/moneyworksmann/fine-score/main/frontend/public/favicon.svg)

---

## What is the PRISM Score?

**PRISM** stands for **P**ortfolio **R**isk & D**i**versification **S**core **M**odel.

It measures four dimensions of portfolio health:

| Dimension | What it measures |
|---|---|
| **F — Diversification** | Are your holdings spread across different sectors? |
| **I — Correlation** | Do your stocks move independently of each other? |
| **N — Volatility** | How much does your portfolio swing vs the market? |
| **E — Concentration** | Is one stock dominating your entire portfolio? |

Each dimension scores 0–100. The composite PRISM Score is the average of all four.

| Score | Label |
|---|---|
| 80–100 | Well Positioned |
| 60–79 | Some Exposure |
| 40–59 | Needs Attention |
| 0–39 | High Risk |

Your score is compared against two benchmarks:
- **S&P 500 (SPY)** — single index fund, fully liquid
- **3-Fund Portfolio** — VTI 60% + VXUS 20% + BND 20% — the classic diversified approach

---

## Features

- Manual ticker entry — no account connection required
- Real-time PRISM score with four sub-scores
- Sector breakdown chart
- Correlation heatmap across all holdings
- 5-year backtest vs the S&P 500
- Benchmark comparison (SPY + 3-Fund Portfolio)
- Sessionless — your data is never stored

---

## Running Locally

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend

```bash
cd backend
pip3 install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Charts | Recharts |
| Backend | FastAPI (Python) |
| Market Data | yfinance (free, no API key) |
| Database | None — sessionless |

---

## Disclaimer

PRISM Score is a mathematical analysis tool, not financial advice. All outputs are based on historical price data and portfolio theory. Past performance does not guarantee future results. Always consult a licensed financial advisor before making investment decisions.
