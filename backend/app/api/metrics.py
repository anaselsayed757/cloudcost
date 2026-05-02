from fastapi import APIRouter
from app import prometheus_client as prom

router = APIRouter(prefix="/metrics-live", tags=["metrics"])

@router.get("/")
async def get_all_live_metrics():
    instances = await prom.get_all_instances()
    results = []
    for inst in instances:
        cpu = await prom.get_cpu_usage(inst)
        ram = await prom.get_ram_usage(inst)
        net = await prom.get_network_bytes(inst)
        results.append({
            "instance": inst,
            "cpu_pct":  round(cpu, 2),
            "ram_pct":  round(ram, 2),
            "net_bps":  round(net, 2),
        })
    return results

@router.get("/{instance}")
async def get_live_metrics(instance: str):
    cpu = await prom.get_cpu_usage(instance)
    ram = await prom.get_ram_usage(instance)
    net = await prom.get_network_bytes(instance)
    return {
        "instance": instance,
        "cpu_pct":  round(cpu, 2),
        "ram_pct":  round(ram, 2),
        "net_bps":  round(net, 2),
    }
