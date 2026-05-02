from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.database import get_db
from app.models import VM, Tariff, Budget
from app.prometheus_client import get_all_instances

router = APIRouter(prefix="/vms", tags=["vms"])

@router.get("/")
async def list_vms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VM))
    vms = result.scalars().all()
    if not vms:
        instances = await get_all_instances()
        for inst in instances:
            vm = VM(
                instance=inst,
                label=inst,
                tariff_id="standard",
                cpu_cores=2.0,
                ram_gb=2.0,
            )
            db.add(vm)
        await db.commit()
        result = await db.execute(select(VM))
        vms = result.scalars().all()
    return vms

@router.get("/{instance}/cost")
async def get_vm_cost(instance: str, days: int = 7, db: AsyncSession = Depends(get_db)):
    query = text("""
        SELECT DATE(period_start) as date,
               SUM(cpu_cost)      as cpu_cost,
               SUM(ram_cost)      as ram_cost,
               SUM(network_cost)  as network_cost,
               SUM(total_cost)    as total_cost
        FROM cost_records
        WHERE vm_instance = :inst
          AND period_start >= NOW() - (:days * INTERVAL '1 day')
        GROUP BY DATE(period_start)
        ORDER BY date ASC
    """)
    result = await db.execute(query, {"inst": instance, "days": days})
    rows = result.fetchall()
    return {
        "vm_instance": instance,
        "days": days,
        "records": [dict(r._mapping) for r in rows],
        "total": sum(float(r.total_cost) for r in rows),
    }

@router.post("/seed")
async def seed_tariffs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tariff))
    if not result.scalars().first():
        db.add(Tariff(
            id="standard", name="Standard Plan",
            cpu_rate_per_core_hour=0.048,
            ram_rate_per_gb_hour=0.006,
            network_rate_per_gb=0.010,
        ))
        db.add(Tariff(
            id="premium", name="Premium Plan",
            cpu_rate_per_core_hour=0.072,
            ram_rate_per_gb_hour=0.009,
            network_rate_per_gb=0.008,
        ))
        await db.commit()
    return {"status": "seeded"}

@router.get("/{instance}/budget")
async def get_budget(instance: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Budget).where(Budget.vm_instance == instance)
    )
    budget = result.scalars().first()
    if not budget:
        return {"exists": False}
    return {"exists": True, "budget": budget}

@router.post("/{instance}/budget")
async def set_budget(instance: str, limit: float,
                     email: str = "admin@cloudcost.local",
                     db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Budget).where(Budget.vm_instance == instance)
    )
    budget = result.scalars().first()
    if budget:
        budget.monthly_limit = limit
        budget.owner_email   = email
    else:
        from app.models import Budget as BudgetModel
        db.add(BudgetModel(
            id=str(__import__('uuid').uuid4()),
            vm_instance=instance,
            monthly_limit=limit,
            owner_email=email,
        ))
    await db.commit()
    return {"status": "saved", "vm": instance, "limit": limit}

@router.put("/{instance}/label")
async def update_label(instance: str, label: str,
                       db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(VM).where(VM.instance == instance)
    )
    vm = result.scalars().first()
    if not vm:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="VM not found")
    vm.label = label
    await db.commit()
    return {"status": "updated", "instance": instance, "label": label}
