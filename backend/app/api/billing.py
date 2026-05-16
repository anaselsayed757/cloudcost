import io
import csv
import uuid
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models import VM, Tariff, CostRecord
from app import prometheus_client as prom
from app.auth import get_current_user, require_admin
from app.models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/run")
async def run_billing(
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(require_admin),
):
    vms = (await db.execute(select(VM))).scalars().all()
    records = []
    for vm in vms:
        tariff = (await db.execute(
            select(Tariff).where(Tariff.id == vm.tariff_id)
        )).scalars().first()
        if not tariff:
            logger.warning("No tariff %s for VM %s — skipping", vm.tariff_id, vm.instance)
            continue
        now          = datetime.utcnow()
        cpu_pct      = await prom.get_cpu_usage(vm.instance)
        ram_pct      = await prom.get_ram_usage(vm.instance)
        net_bytes    = await prom.get_network_bytes(vm.instance)
        cpu_cost     = (cpu_pct / 100) * vm.cpu_cores * tariff.cpu_rate_per_core_hour
        ram_cost     = (ram_pct / 100) * vm.ram_gb    * tariff.ram_rate_per_gb_hour
        network_cost = (net_bytes / 1024 ** 3)        * tariff.network_rate_per_gb
        record = CostRecord(
            id=str(uuid.uuid4()),
            vm_instance=vm.instance,
            tariff_id=tariff.id,
            period_start=now - timedelta(hours=1),
            period_end=now,
            cpu_cost=round(cpu_cost, 6),
            ram_cost=round(ram_cost, 6),
            network_cost=round(network_cost, 6),
            total_cost=round(cpu_cost + ram_cost + network_cost, 6),
        )
        db.add(record)
        records.append({
            "vm":         vm.instance,
            "total_cost": record.total_cost,
            "cpu_cost":   record.cpu_cost,
            "ram_cost":   record.ram_cost,
            "net_cost":   record.network_cost,
        })
    await db.commit()
    logger.info("Manual billing run: %d VMs billed", len(records))
    return {"billed": len(records), "records": records}


@router.get("/tariffs")
async def list_tariffs(
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(get_current_user),
):
    result = await db.execute(select(Tariff))
    return result.scalars().all()


@router.get("/history")
async def billing_history(
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(get_current_user),
):
    result = await db.execute(
        select(CostRecord).order_by(CostRecord.period_start.desc()).limit(100)
    )
    return result.scalars().all()


@router.get("/export")
async def export_billing_csv(
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(get_current_user),
):
    result = await db.execute(
        select(CostRecord).order_by(CostRecord.period_start.desc())
    )
    records = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "vm_instance", "tariff_id", "period_start", "period_end",
        "cpu_cost", "ram_cost", "network_cost", "total_cost",
    ])
    for r in records:
        writer.writerow([
            r.vm_instance, r.tariff_id,
            r.period_start, r.period_end,
            r.cpu_cost, r.ram_cost, r.network_cost, r.total_cost,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=billing_report.csv"},
    )


class ReceiptRequest(BaseModel):
    client_email:    EmailStr
    recipient_email: EmailStr | None = None
    days:            int = 30


@router.post("/receipt")
async def send_client_receipt(
    body: ReceiptRequest,
    db:   AsyncSession = Depends(get_db),
    _:    User         = Depends(require_admin),
):
    from app.email_service import send_email

    recipient_email = str(body.recipient_email or body.client_email)

    vm_result    = await db.execute(
        select(VM.instance).where(VM.owner_email == str(body.client_email))
    )
    vm_instances = [row[0] for row in vm_result.all()]
    if not vm_instances:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No VMs found for client email {body.client_email}. "
                "Use the email stored on the VMs you want to bill."
            ),
        )

    start_time = datetime.utcnow() - timedelta(days=body.days)
    result = await db.execute(
        select(CostRecord)
        .where(CostRecord.vm_instance.in_(vm_instances))
        .where(CostRecord.period_start >= start_time)
        .order_by(CostRecord.period_start.desc())
    )
    records = result.scalars().all()

    cpu_total     = round(sum(r.cpu_cost     for r in records), 6)
    ram_total     = round(sum(r.ram_cost     for r in records), 6)
    network_total = round(sum(r.network_cost for r in records), 6)
    grand_total   = round(sum(r.total_cost   for r in records), 6)

    receipt_csv = io.StringIO()
    writer = csv.writer(receipt_csv)
    writer.writerow([
        "period_start", "period_end", "vm_instance", "tariff_id",
        "cpu_cost", "ram_cost", "network_cost", "total_cost",
    ])
    for record in records:
        writer.writerow([
            record.period_start, record.period_end, record.vm_instance,
            record.tariff_id, record.cpu_cost, record.ram_cost,
            record.network_cost, record.total_cost,
        ])

    body_text = f"""CloudCost Receipt

Client: {body.client_email}
Recipient: {recipient_email}
Billing window: Last {body.days} days
VMs: {', '.join(vm_instances)}

Summary:
  CPU:     {cpu_total:.6f}
  RAM:     {ram_total:.6f}
  Network: {network_total:.6f}
  Total:   {grand_total:.6f}

Attached: billing_receipt.csv

— CloudCost Monitor
"""

    sent = await send_email(
        to=recipient_email,
        subject=f"[CloudCost] Billing Receipt - Last {body.days} Days",
        body=body_text,
        attachment_name="billing_receipt.csv",
        attachment_content=receipt_csv.getvalue(),
        attachment_mime="text/csv",
    )

    return {
        "sent":            sent,
        "client_email":    str(body.client_email),
        "recipient_email": recipient_email,
        "days":            body.days,
        "vm_count":        len(vm_instances),
        "record_count":    len(records),
        "total_cost":      grand_total,
    }


class TariffUpdate(BaseModel):
    cpu_rate_per_core_hour: float
    ram_rate_per_gb_hour:   float
    network_rate_per_gb:    float


@router.put("/tariffs/{tariff_id}")
async def update_tariff(
    tariff_id: str,
    body:      TariffUpdate,
    db:        AsyncSession = Depends(get_db),
    _:         User         = Depends(require_admin),
):
    result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = result.scalars().first()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tariff not found")
    tariff.cpu_rate_per_core_hour = body.cpu_rate_per_core_hour
    tariff.ram_rate_per_gb_hour   = body.ram_rate_per_gb_hour
    tariff.network_rate_per_gb    = body.network_rate_per_gb
    await db.commit()
    logger.info("Tariff %s updated", tariff_id)
    return {"status": "updated", "tariff_id": tariff_id}
