from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.fine_score import compute_fine_score

router = APIRouter(prefix="/api", tags=["portfolio"])


class Holding(BaseModel):
    ticker: str
    shares: float


class PortfolioRequest(BaseModel):
    holdings: List[Holding]


@router.post("/analyze")
async def analyze_portfolio(request: PortfolioRequest):
    if len(request.holdings) < 2:
        raise HTTPException(status_code=400, detail="Enter at least 2 holdings to analyze.")
    try:
        result = compute_fine_score(request.holdings)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
