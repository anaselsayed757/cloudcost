from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import metrics, billing, forecast, alerts, vms, auth
from app.database import init_db
from app.scheduler import start_scheduler

app = FastAPI(title="CloudCost API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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
