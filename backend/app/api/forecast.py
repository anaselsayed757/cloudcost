import warnings
import logging
from datetime import date, timedelta

import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends
from sklearn.linear_model import LinearRegression
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from statsmodels.tsa.arima.model import ARIMA

from app.database import get_db
from app.auth import get_current_user
from app.models import User

warnings.filterwarnings("ignore")
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/forecast", tags=["forecast"])


def compute_rmse(actual, predicted) -> float:
    a, p = np.array(actual), np.array(predicted)
    return float(np.sqrt(np.mean((a - p) ** 2)))


def compute_mape(actual, predicted) -> float:
    a, p   = np.array(actual), np.array(predicted)
    mask   = a != 0
    return float(np.mean(np.abs((a[mask] - p[mask]) / a[mask])) * 100)


@router.get("/{instance}")
async def get_forecast(
    instance: str,
    db:       AsyncSession = Depends(get_db),
    _:        User         = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT DATE(period_start) as date,
                   SUM(total_cost)    as total_cost
            FROM cost_records
            WHERE vm_instance = :inst
            GROUP BY DATE(period_start)
            ORDER BY date ASC
            LIMIT 30
        """),
        {"inst": instance},
    )
    rows = result.fetchall()

    if len(rows) < 3:
        return {
            "vm_instance":    instance,
            "error":          "Not enough data yet — need at least 3 days of billing history",
            "days_available": len(rows),
        }

    df = pd.DataFrame(rows, columns=["date", "total_cost"])
    df["day_index"] = range(len(df))
    series = df["total_cost"].values

    X           = df[["day_index"]].values
    lr          = LinearRegression().fit(X, series)
    future_X    = np.arange(len(df), len(df) + 30).reshape(-1, 1)
    lr_preds    = lr.predict(future_X).tolist()
    lr_insample = lr.predict(X).tolist()

    try:
        arima_fit      = ARIMA(series, order=(2, 1, 2)).fit()
        arima_preds    = arima_fit.forecast(steps=30).tolist()
        arima_insample = arima_fit.fittedvalues.tolist()
        arima_aic      = round(arima_fit.aic, 2)
    except Exception as exc:
        logger.warning("ARIMA failed for %s, falling back to LR: %s", instance, exc)
        arima_preds    = lr_preds
        arima_insample = lr_insample
        arima_aic      = None

    actual     = series.tolist()
    lr_rmse    = compute_rmse(actual, lr_insample)
    lr_mape    = compute_mape(actual, lr_insample)
    arima_rmse = compute_rmse(actual, arima_insample)
    arima_mape = compute_mape(actual, arima_insample)

    winner     = "linear_regression" if lr_rmse < arima_rmse else "arima"
    best_preds = lr_preds if winner == "linear_regression" else arima_preds

    forecast_dates = [
        (date.today() + timedelta(days=i)).isoformat()
        for i in range(1, 31)
    ]

    return {
        "vm_instance":        instance,
        "recommended_model":  winner,
        "total_30d_estimate": round(sum(best_preds), 4),
        "daily_forecast": [
            {"date": d, "predicted_cost": round(max(v, 0), 6)}
            for d, v in zip(forecast_dates, best_preds)
        ],
        "validation": {
            "linear_regression": {"rmse": round(lr_rmse, 4), "mape": round(lr_mape, 2)},
            "arima":             {"rmse": round(arima_rmse, 4), "mape": round(arima_mape, 2), "aic": arima_aic},
        },
        "models": {
            "linear_regression": [round(v, 6) for v in lr_preds],
            "arima":             [round(v, 6) for v in arima_preds],
        },
    }
