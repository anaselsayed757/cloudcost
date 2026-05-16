"""
Unit tests for forecast validation metric functions — RMSE and MAPE.

Functions are defined inline here (mirroring app/api/forecast.py) so these
tests run without FastAPI, SQLAlchemy, or any external service.
"""
import math
import numpy as np
import pytest


# ---------------------------------------------------------------------------
# Mirrors of compute_rmse / compute_mape from app/api/forecast.py
# ---------------------------------------------------------------------------

def compute_rmse(actual, predicted) -> float:
    a, p = np.array(actual), np.array(predicted)
    return float(np.sqrt(np.mean((a - p) ** 2)))


def compute_mape(actual, predicted) -> float:
    a, p  = np.array(actual), np.array(predicted)
    mask  = a != 0
    if not mask.any():
        return 0.0
    return float(np.mean(np.abs((a[mask] - p[mask]) / a[mask])) * 100)


class TestComputeRmse:

    def test_perfect_forecast_gives_zero(self):
        assert compute_rmse([1.0, 2.0, 3.0, 4.0], [1.0, 2.0, 3.0, 4.0]) == 0.0

    def test_known_value(self):
        """sqrt((9 + 16) / 2) = sqrt(12.5)"""
        assert math.isclose(compute_rmse([0.0, 0.0], [3.0, 4.0]), math.sqrt(12.5), rel_tol=1e-9)

    def test_is_non_negative(self):
        assert compute_rmse([5.0, 3.0], [2.0, 6.0]) >= 0.0

    def test_single_element_equals_absolute_error(self):
        assert compute_rmse([10.0], [7.0]) == pytest.approx(3.0)

    def test_doubling_errors_doubles_rmse(self):
        rmse1 = compute_rmse([0.0, 0.0], [1.0, 1.0])
        rmse2 = compute_rmse([0.0, 0.0], [2.0, 2.0])
        assert math.isclose(rmse2, rmse1 * 2, rel_tol=1e-9)

    def test_arima_beats_lr_when_lower_rmse(self):
        """Model selection logic: lower RMSE wins — verify the comparison."""
        lr_rmse    = compute_rmse([1, 2, 3], [1.5, 2.5, 3.5])
        arima_rmse = compute_rmse([1, 2, 3], [1.1, 2.1, 3.1])
        winner = "linear_regression" if lr_rmse < arima_rmse else "arima"
        assert winner == "arima"


class TestComputeMape:

    def test_perfect_forecast_gives_zero(self):
        assert compute_mape([100.0, 200.0], [100.0, 200.0]) == 0.0

    def test_ten_percent_over_prediction(self):
        """10 % over-prediction on all points → MAPE = 10 %."""
        assert compute_mape([100.0, 200.0], [110.0, 220.0]) == pytest.approx(10.0, rel=1e-6)

    def test_zero_actuals_excluded(self):
        """Rows where actual == 0 must be skipped to avoid division by zero."""
        # Only second pair used: |100 - 110| / 100 = 10 %
        assert compute_mape([0.0, 100.0], [50.0, 110.0]) == pytest.approx(10.0, rel=1e-6)

    def test_all_zero_actuals_returns_zero(self):
        assert compute_mape([0.0, 0.0], [1.0, 2.0]) == 0.0

    def test_fifty_percent_over_prediction(self):
        assert compute_mape([100.0, 200.0, 400.0], [150.0, 300.0, 600.0]) == pytest.approx(50.0, rel=1e-6)
