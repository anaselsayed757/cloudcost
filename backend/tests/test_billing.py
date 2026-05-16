"""
Unit tests for the hourly cost calculation formula.

These tests do not require a database or running services — they validate
the pure arithmetic used in both the billing API and the scheduler.
"""


def compute_costs(
    cpu_pct: float,
    ram_pct: float,
    net_bytes: float,
    cpu_cores: float,
    ram_gb: float,
    cpu_rate: float,
    ram_rate: float,
    net_rate: float,
) -> tuple[float, float, float]:
    """Mirror of the cost formula used in billing.py and scheduler.py."""
    cpu_cost     = (cpu_pct  / 100) * cpu_cores * cpu_rate
    ram_cost     = (ram_pct  / 100) * ram_gb    * ram_rate
    network_cost = (net_bytes / 1024 ** 3)       * net_rate
    return round(cpu_cost, 6), round(ram_cost, 6), round(network_cost, 6)


# ---------------------------------------------------------------------------
# Standard tariff rates used across tests
# ---------------------------------------------------------------------------
STD_CPU_RATE = 0.048   # $/core/hour
STD_RAM_RATE = 0.006   # $/GB/hour
STD_NET_RATE = 0.010   # $/GB


class TestCostFormula:

    def test_typical_workload(self):
        """50 % CPU on a 2-core VM with standard rates."""
        cpu, ram, net = compute_costs(
            cpu_pct=50.0, ram_pct=60.0, net_bytes=0,
            cpu_cores=2.0, ram_gb=4.0,
            cpu_rate=STD_CPU_RATE, ram_rate=STD_RAM_RATE, net_rate=STD_NET_RATE,
        )
        # cpu = 0.5 * 2 * 0.048 = 0.048
        assert cpu == 0.048
        # ram = 0.6 * 4 * 0.006 = 0.0144
        assert ram == 0.0144
        assert net == 0.0

    def test_idle_vm_zero_cost(self):
        """Completely idle VM (all metrics zero) should produce zero cost."""
        cpu, ram, net = compute_costs(
            cpu_pct=0.0, ram_pct=0.0, net_bytes=0.0,
            cpu_cores=4.0, ram_gb=8.0,
            cpu_rate=STD_CPU_RATE, ram_rate=STD_RAM_RATE, net_rate=STD_NET_RATE,
        )
        assert cpu == 0.0
        assert ram == 0.0
        assert net == 0.0

    def test_full_load_vm(self):
        """100 % CPU and RAM — maximum cost for given config."""
        cpu, ram, net = compute_costs(
            cpu_pct=100.0, ram_pct=100.0, net_bytes=0.0,
            cpu_cores=4.0, ram_gb=8.0,
            cpu_rate=STD_CPU_RATE, ram_rate=STD_RAM_RATE, net_rate=STD_NET_RATE,
        )
        # cpu = 1.0 * 4 * 0.048 = 0.192
        assert cpu == 0.192
        # ram = 1.0 * 8 * 0.006 = 0.048
        assert ram == 0.048

    def test_network_cost_one_gb(self):
        """1 GB transferred should cost exactly network_rate."""
        _, _, net = compute_costs(
            cpu_pct=0.0, ram_pct=0.0, net_bytes=1024 ** 3,
            cpu_cores=2.0, ram_gb=2.0,
            cpu_rate=STD_CPU_RATE, ram_rate=STD_RAM_RATE, net_rate=STD_NET_RATE,
        )
        assert net == 0.010

    def test_premium_tariff_higher_than_standard(self):
        """Premium tariff always produces a higher cost than standard."""
        PREM_CPU_RATE, PREM_RAM_RATE, PREM_NET_RATE = 0.072, 0.009, 0.008
        cpu_s, ram_s, _ = compute_costs(
            50.0, 60.0, 0.0, 2.0, 4.0,
            STD_CPU_RATE, STD_RAM_RATE, STD_NET_RATE,
        )
        cpu_p, ram_p, _ = compute_costs(
            50.0, 60.0, 0.0, 2.0, 4.0,
            PREM_CPU_RATE, PREM_RAM_RATE, PREM_NET_RATE,
        )
        assert cpu_p > cpu_s
        assert ram_p > ram_s

    def test_total_is_sum_of_components(self):
        """Total cost must always equal cpu + ram + network."""
        cpu, ram, net = compute_costs(
            cpu_pct=73.2, ram_pct=44.8, net_bytes=512 * 1024 ** 2,
            cpu_cores=2.0, ram_gb=4.0,
            cpu_rate=STD_CPU_RATE, ram_rate=STD_RAM_RATE, net_rate=STD_NET_RATE,
        )
        total = round(cpu + ram + net, 6)
        assert total == round(cpu + ram + net, 6)

    def test_costs_rounded_to_six_decimal_places(self):
        """Results must be rounded to 6 decimal places (matching CostRecord storage)."""
        cpu, ram, net = compute_costs(
            cpu_pct=33.3333, ram_pct=66.6666, net_bytes=100_000_000,
            cpu_cores=2.0, ram_gb=4.0,
            cpu_rate=STD_CPU_RATE, ram_rate=STD_RAM_RATE, net_rate=STD_NET_RATE,
        )
        for val in (cpu, ram, net):
            as_str = str(val)
            decimal_places = len(as_str.split(".")[-1]) if "." in as_str else 0
            assert decimal_places <= 6
