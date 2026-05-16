import os
import uuid
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models import Alert, VM, User
from app import prometheus_client as prom
from app.auth import get_current_user, require_admin

logger         = logging.getLogger(__name__)
router         = APIRouter(prefix="/alerts", tags=["alerts"])
DASHBOARD_URL  = os.getenv("DASHBOARD_URL", "http://localhost:3000")


@router.get("/")
async def list_alerts(
    status: str    = "firing",
    db:     AsyncSession = Depends(get_db),
    _:      User         = Depends(get_current_user),
):
    if status == "firing":
        result = await db.execute(
            select(Alert)
            .where(Alert.resolved_at == None)
            .order_by(Alert.triggered_at.desc())
        )
    else:
        result = await db.execute(
            select(Alert).order_by(Alert.triggered_at.desc())
        )
    return result.scalars().all()


@router.get("/summary")
async def alert_summary(
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert).where(Alert.resolved_at == None)
    )
    alerts = result.scalars().all()
    return {
        "critical": sum(1 for a in alerts if a.severity == "critical"),
        "warning":  sum(1 for a in alerts if a.severity == "warning"),
        "total":    len(alerts),
    }


@router.post("/{alert_id}/acknowledge")
async def acknowledge(
    alert_id: str,
    db:       AsyncSession = Depends(get_db),
    _:        User         = Depends(get_current_user),
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert  = result.scalars().first()
    if alert:
        alert.acknowledged = True
        await db.commit()
    return {"status": "acknowledged"}


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    db:       AsyncSession = Depends(get_db),
    _:        User         = Depends(get_current_user),
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert  = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved_at = datetime.utcnow()
    await db.commit()
    return {"status": "resolved", "id": alert_id}


@router.delete("/resolved")
async def clear_resolved_alerts(
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(require_admin),
):
    result = await db.execute(delete(Alert).where(Alert.resolved_at != None))
    await db.commit()
    return {"status": "cleared", "scope": "resolved", "count": result.rowcount or 0}


@router.delete("/all")
async def clear_all_alerts(
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(require_admin),
):
    result = await db.execute(delete(Alert))
    await db.commit()
    return {"status": "cleared", "scope": "all", "count": result.rowcount or 0}


@router.post("/check")
async def run_alert_check(
    db: AsyncSession = Depends(get_db),
    _:  User         = Depends(require_admin),
):
    from app.email_service import send_alert_email
    vms   = (await db.execute(select(VM))).scalars().all()
    fired = []
    for vm in vms:
        cpu = await prom.get_cpu_usage(vm.instance)
        ram = await prom.get_ram_usage(vm.instance)
        net = await prom.get_network_bytes(vm.instance)
        if cpu < 5.0 and net < 10_000 and ram < 20.0:
            recent = await db.execute(
                select(Alert).where(
                    Alert.vm_instance == vm.instance,
                    Alert.alert_type  == "idle_vm",
                    Alert.triggered_at >= datetime.utcnow() - timedelta(hours=2),
                    Alert.resolved_at == None,
                )
            )
            if not recent.scalars().first():
                alert = Alert(
                    id=str(uuid.uuid4()),
                    vm_instance=vm.instance,
                    alert_type="idle_vm",
                    severity="warning",
                    message=f"{vm.instance} appears idle — CPU {cpu:.1f}%, RAM {ram:.1f}%, net {net:.0f} B/s",
                    meta={"cpu_pct": cpu, "ram_pct": ram, "net_bps": net},
                )
                db.add(alert)
                fired.append(vm.instance)
                await send_alert_email(
                    to=vm.owner_email,
                    subject=f"[CloudCost] WARNING — Idle VM Detected: {vm.instance}",
                    body=f"""CloudCost Monitor — Idle VM Alert

VM Instance: {vm.instance}
Alert Type:  Idle VM Detected
Severity:    WARNING
Time:        {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC

Details:
  CPU Usage:    {cpu:.1f}%
  RAM Usage:    {ram:.1f}%
  Network:      {net:.0f} B/s

This VM appears to be running but not doing useful work.
Consider pausing or terminating it to reduce costs.

Action required: Review this VM in your CloudCost dashboard.
Dashboard: {DASHBOARD_URL}

— CloudCost Monitor""",
                )
    await db.commit()
    logger.info("Alert check completed: %d idle VMs found", len(fired))
    return {"fired": len(fired), "vms": fired}


@router.post("/test-email")
async def test_email(
    _: User = Depends(require_admin),
):
    """Send a test alert email — admin only."""
    from app.email_service import send_alert_email
    import os
    test_recipient = os.getenv("SMTP_USER") or "admin@cloudcost.local"
    result = await send_alert_email(
        to=test_recipient,
        subject="[CloudCost] Test Alert — System Working",
        body="""CloudCost Monitor — Test Email

Your alert notification system is working correctly.

System: CloudCost Monitor
Status: Operational

— CloudCost Monitor""",
    )
    return {"sent": result, "to": test_recipient}
