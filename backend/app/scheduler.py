import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.database import AsyncSessionLocal
from app.models import VM, Tariff, CostRecord
from app import prometheus_client as prom
from sqlalchemy import select
from datetime import datetime, timedelta
import uuid

logger    = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


@scheduler.scheduled_job("interval", hours=1)
async def run_billing():
    async with AsyncSessionLocal() as db:
        try:
            vms = (await db.execute(select(VM))).scalars().all()
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
                db.add(CostRecord(
                    id=str(uuid.uuid4()),
                    vm_instance=vm.instance,
                    tariff_id=tariff.id,
                    period_start=now - timedelta(hours=1),
                    period_end=now,
                    cpu_cost=round(cpu_cost, 6),
                    ram_cost=round(ram_cost, 6),
                    network_cost=round(network_cost, 6),
                    total_cost=round(cpu_cost + ram_cost + network_cost, 6),
                ))
            await db.commit()
            logger.info("Billing ran for %d VMs", len(vms))
        except Exception as exc:
            logger.error("Billing job failed: %s", exc, exc_info=True)


def start_scheduler():
    scheduler.start()
