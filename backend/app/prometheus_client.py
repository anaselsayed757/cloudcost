import os
import httpx

PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://prometheus:9090")

async def query(promql: str) -> list:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{PROMETHEUS_URL}/api/v1/query",
            params={"query": promql}
        )
        data = r.json()
        return data.get("data", {}).get("result", [])

async def query_scalar(promql: str) -> float | None:
    results = await query(promql)
    if results:
        return float(results[0]["value"][1])
    return None

async def get_cpu_usage(instance: str) -> float:
    result = await query_scalar(
        f'100 - (avg by(instance)(rate(node_cpu_seconds_total{{mode="idle",instance="{instance}"}}[5m])) * 100)'
    )
    return result or 0.0

async def get_ram_usage(instance: str) -> float:
    result = await query_scalar(
        f'100 * (1 - node_memory_MemAvailable_bytes{{instance="{instance}"}} / node_memory_MemTotal_bytes{{instance="{instance}"}})'
    )
    return result or 0.0

async def get_network_bytes(instance: str) -> float:
    result = await query_scalar(
        f'rate(node_network_receive_bytes_total{{instance="{instance}",device="eth0"}}[5m])'
    )
    return result or 0.0

async def get_all_instances() -> list[str]:
    results = await query('up{job="vm-targets"}')
    main = await query('up{job="main-server"}')
    instances = [r["metric"].get("instance", "") for r in results + main]
    return [i for i in instances if i]
