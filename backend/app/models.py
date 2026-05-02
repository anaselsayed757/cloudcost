from sqlalchemy import Column, String, Float, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.database import Base

class VM(Base):
    __tablename__ = "vms"
    instance    = Column(String, primary_key=True)
    label       = Column(String)
    tariff_id   = Column(String, default="standard")
    cpu_cores   = Column(Float, default=2.0)
    ram_gb      = Column(Float, default=2.0)
    owner_email = Column(String, default="admin@cloudcost.local")
    created_at  = Column(DateTime, server_default=func.now())

class Tariff(Base):
    __tablename__ = "tariffs"
    id                      = Column(String, primary_key=True)
    name                    = Column(String)
    cpu_rate_per_core_hour  = Column(Float, default=0.048)
    ram_rate_per_gb_hour    = Column(Float, default=0.006)
    network_rate_per_gb     = Column(Float, default=0.010)
    updated_at              = Column(DateTime, server_default=func.now())

class CostRecord(Base):
    __tablename__ = "cost_records"
    id           = Column(String, primary_key=True)
    vm_instance  = Column(String)
    tariff_id    = Column(String)
    period_start = Column(DateTime)
    period_end   = Column(DateTime)
    cpu_cost     = Column(Float)
    ram_cost     = Column(Float)
    network_cost = Column(Float)
    total_cost   = Column(Float)
    created_at   = Column(DateTime, server_default=func.now())

class Budget(Base):
    __tablename__ = "budgets"
    id                  = Column(String, primary_key=True)
    vm_instance         = Column(String)
    monthly_limit       = Column(Float)
    warning_threshold   = Column(Float, default=0.80)
    critical_threshold  = Column(Float, default=0.95)
    owner_email         = Column(String)
    active              = Column(Boolean, default=True)

class Alert(Base):
    __tablename__ = "alerts"
    id           = Column(String, primary_key=True)
    vm_instance  = Column(String)
    alert_type   = Column(String)
    severity     = Column(String)
    message      = Column(String)
    triggered_at = Column(DateTime, server_default=func.now())
    resolved_at  = Column(DateTime, nullable=True)
    acknowledged = Column(Boolean, default=False)
    meta         = Column(JSON, default={})

class User(Base):
    __tablename__ = "users"
    id            = Column(String, primary_key=True)
    username      = Column(String, unique=True, index=True)
    email         = Column(String, unique=True)
    hashed_password = Column(String)
    role          = Column(String, default="viewer")  # admin or viewer
    created_at    = Column(DateTime, server_default=func.now())
