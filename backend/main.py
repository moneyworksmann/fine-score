from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import portfolio

app = FastAPI(title="PRISM Score API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(portfolio.router)
