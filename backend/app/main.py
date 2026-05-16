import os
import logging
import logging.config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import metrics, billing, forecast, alerts, vms, auth
from app.database import init_db
from app.scheduler import start_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)

app = FastAPI(title="CloudCost API", version="1.0.0")

_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.on_event("startup")
async def startup():
    await init_db()
    start_scheduler()


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(metrics.router)
app.include_router(billing.router)
app.include_router(forecast.router)
app.include_router(alerts.router)
app.include_router(vms.router)
