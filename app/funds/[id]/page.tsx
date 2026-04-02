"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Fund = {
  id: number;
  fund_id?: string | null;
  name: string;
  strategy: string;
  base_currency: string;
  admin_name?: string | null;
  domicile_country: string;
  firm_id: number;
  account_number?: string | null;
};

type NavPoint = {
  label: string;
  value: number;
};

type NavSnapshot = {
  navDate: string;
  navPerUnit: number;
  grossAssets: number;
  netAssets: number;
  unitsOutstanding: number;
  pendingFlow: number;
};

function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function countryLabel(codeOrName: string) {
  const map: Record<string, string> = {
    US: "United States",
    SG: "Singapore",
    KY: "Cayman Islands",
    GB: "United Kingdom",
    IE: "Ireland",
    LU: "Luxembourg",
    CH: "Switzerland",
    AE: "United Arab Emirates",
  };
  return map[codeOrName] || codeOrName || "-";
}

function buildInitialSnapshot(fund: Fund): NavSnapshot {
  const seed = (fund.id || 1) * 137;

  const unitsOutstanding = 390_000 + (seed % 40_000);
  const navPerUnit = 97 + ((seed % 1200) / 100);
  const grossAssets = unitsOutstanding * navPerUnit * 1.045;
  const netAssets = unitsOutstanding * navPerUnit;
  const pendingFlow = 250_000 + (seed % 1_250_000);

  return {
    navDate: "2026-03-31",
    navPerUnit,
    grossAssets,
    netAssets,
    unitsOutstanding,
    pendingFlow,
  };
}

function buildNavSeries(snapshot: NavSnapshot): NavPoint[] {
  const end = snapshot.navPerUnit;
  const values = [
    end * 0.93,
    end * 0.945,
    end * 0.958,
    end * 0.972,
    end * 0.981,
    end * 0.991,
    end,
  ];

  return [
    { label: "Sep", value: values[0] },
    { label: "Oct", value: values[1] },
    { label: "Nov", value: values[2] },
    { label: "Dec", value: values[3] },
    { label: "Jan", value: values[4] },
    { label: "Feb", value: values[5] },
    { label: "Mar", value: values[6] },
  ];
}

function buildChartPath(points: NavPoint[], width: number, height: number, padding = 18) {
  if (points.length === 0) return "";

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);

  const coords = points.map((point, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  return coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
}

export default function FundDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [fund, setFund] = useState<Fund | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [calcMessage, setCalcMessage] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [navSnapshot, setNavSnapshot] = useState<NavSnapshot | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const loadFund = async () => {
      try {
        setLoading(true);
        setPageError("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/funds/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Fund request failed: ${res.status}`);
        }

        const data: Fund = await res.json();
        setFund(data);
        setNavSnapshot(buildInitialSnapshot(data));
      } catch (err) {
        setPageError(err instanceof Error ? err.message : "Failed to load fund");
      } finally {
        setLoading(false);
      }
    };

    loadFund();
  }, [params.id, router]);

  const navSeries = useMemo(() => {
    if (!navSnapshot) return [];
    return buildNavSeries(navSnapshot);
  }, [navSnapshot]);

  const chartPath = useMemo(() => {
    return buildChartPath(navSeries, 520, 220);
  }, [navSeries]);

  const handleCalculateNav = async () => {
    if (!navSnapshot) return;

    setIsCalculating(true);
    setCalcMessage("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 850));

      const nextNavPerUnit = Number((navSnapshot.navPerUnit * 1.0027).toFixed(2));
      const nextNetAssets = Number((navSnapshot.unitsOutstanding * nextNavPerUnit).toFixed(2));
      const nextGrossAssets = Number((nextNetAssets * 1.044).toFixed(2));
      const nextPendingFlow = Math.max(0, Number((navSnapshot.pendingFlow * 0.84).toFixed(2)));

      setNavSnapshot({
        ...navSnapshot,
        navDate: new Date().toISOString().slice(0, 10),
        navPerUnit: nextNavPerUnit,
        netAssets: nextNetAssets,
        grossAssets: nextGrossAssets,
        pendingFlow: nextPendingFlow,
      });

      setCalcMessage("NAV preview recalculated.");
    } catch {
      setCalcMessage("NAV calculation failed.");
    } finally {
      setIsCalculating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
            <div className="h-8 w-64 rounded bg-white/10" />
            <div className="mt-4 h-4 w-96 rounded bg-white/10" />
            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="h-72 rounded-[28px] bg-white/[0.03] xl:col-span-3" />
              <div className="h-72 rounded-[28px] bg-white/[0.03] xl:col-span-5" />
              <div className="h-72 rounded-[28px] bg-white/[0.03] xl:col-span-4" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-8">
            <h1 className="text-2xl font-semibold">Fund page failed to load</h1>
            <p className="mt-3 text-red-200">{pageError}</p>
            <button
              onClick={() => router.push("/funds")}
              className="mt-6 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10"
            >
              Back to Funds
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!fund || !navSnapshot) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
            <h1 className="text-2xl font-semibold">Fund not found</h1>
            <button
              onClick={() => router.push("/funds")}
              className="mt-6 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10"
            >
              Back to Funds
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.06),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.04),_transparent_22%),linear-gradient(to_bottom,_#000000,_#0a0a0a,_#111111,_#1f1f1f)]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Header */}
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-300">
                  Artemis Fund Dashboard
                </div>

                <div>
                  <h1 className="text-4xl font-semibold tracking-tight text-white">
                    {fund.name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    High-visibility fund intelligence page with NAV monitoring, operational data,
                    and workflow controls in one institutional view.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Strategy
                    </p>
                    <p className="mt-1 font-medium text-white">{fund.strategy}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Currency
                    </p>
                    <p className="mt-1 font-medium text-white">{fund.base_currency}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Domicile
                    </p>
                    <p className="mt-1 font-medium text-white">
                      {countryLabel(fund.domicile_country)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Fund ID
                    </p>
                    <p className="mt-1 font-medium text-white">{fund.fund_id || "-"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Primary Account
                    </p>
                    <p className="mt-1 font-medium text-white">{fund.account_number || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:items-end">
                <button
                  onClick={() => router.push("/funds")}
                  className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  ← Back to Funds
                </button>

                <button
                  onClick={handleCalculateNav}
                  disabled={isCalculating}
                  className="rounded-2xl bg-gradient-to-r from-neutral-200 to-neutral-400 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-black/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCalculating ? "Calculating NAV..." : "Calculate NAV"}
                </button>

                <div className="text-right text-xs text-slate-400">
                  {calcMessage ? calcMessage : "Last computed NAV available below."}
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Left: Fund overview */}
            <section className="xl:col-span-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Fund Overview</h2>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                  Overview
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fund Name</p>
                  <p className="mt-2 text-lg font-medium text-white">{fund.name}</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fund ID</p>
                    <p className="mt-1 font-medium text-white">{fund.fund_id || "-"}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Strategy</p>
                    <p className="mt-1 font-medium text-white">{fund.strategy}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Base Currency</p>
                    <p className="mt-1 font-medium text-white">{fund.base_currency}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Domicile</p>
                    <p className="mt-1 font-medium text-white">
                      {countryLabel(fund.domicile_country)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Firm ID</p>
                    <p className="mt-1 font-medium text-white">{fund.firm_id}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fund Admin</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-200 to-neutral-500 text-base font-bold text-black">
                      {fund.admin_name?.[0] || "?"}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/managers/${encodeURIComponent(fund.admin_name || "")}`)
                      }
                      className="text-left text-sm font-medium text-slate-200 underline decoration-white/30 underline-offset-4 hover:text-white"
                    >
                      {fund.admin_name || "Unassigned"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Center: NAV Preview */}
            <section className="xl:col-span-5 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-black/40 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">NAV Preview</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Latest computed valuation and real-time preview metrics.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-right">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Last Computed NAV
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">{navSnapshot.navDate}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">NAV / Unit</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatMoney(navSnapshot.navPerUnit, fund.base_currency || "USD")}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pending Flow</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatCompactMoney(navSnapshot.pendingFlow, fund.base_currency || "USD")}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Gross Assets</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatCompactMoney(navSnapshot.grossAssets, fund.base_currency || "USD")}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Net Assets</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatCompactMoney(navSnapshot.netAssets, fund.base_currency || "USD")}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/35 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">NAV Trend</p>
                  <p className="text-xs text-slate-400">Last 7 valuation points</p>
                </div>

                <svg viewBox="0 0 520 220" className="h-56 w-full">
                  <defs>
                    <linearGradient id="navLineMono" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#e5e7eb" />
                      <stop offset="100%" stopColor="#9ca3af" />
                    </linearGradient>
                  </defs>

                  <path
                    d={chartPath}
                    fill="none"
                    stroke="url(#navLineMono)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {navSeries.map((point, index) => {
                    const values = navSeries.map((p) => p.value);
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const range = Math.max(max - min, 1);
                    const padding = 18;
                    const x = padding + index * ((520 - padding * 2) / Math.max(navSeries.length - 1, 1));
                    const y = 220 - padding - ((point.value - min) / range) * (220 - padding * 2);

                    return (
                      <g key={point.label}>
                        <circle cx={x} cy={y} r="5" fill="#d4d4d8" />
                        <text x={x} y="214" textAnchor="middle" fill="#94a3b8" fontSize="11">
                          {point.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Units Outstanding</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatNumber(navSnapshot.unitsOutstanding)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="mt-2 text-xl font-semibold text-slate-200">Ready to Calculate</p>
                </div>
              </div>
            </section>

            {/* Right: Data Stack */}
            <section className="xl:col-span-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Data Stack</h2>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                  Stack
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Prime Broker</p>
                  <p className="mt-1 text-lg font-medium text-white">TBD</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Primary Account</p>
                  <p className="mt-1 text-lg font-medium text-white">{fund.account_number || "-"}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Custodian</p>
                  <p className="mt-1 text-lg font-medium text-white">TBD</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Auditor</p>
                  <p className="mt-1 text-lg font-medium text-white">TBD</p>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
            <section className="xl:col-span-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Documents Vault</h2>
                <button className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium hover:bg-white/[0.08]">
                  Upload Document
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/25 p-5 text-sm text-slate-300">
                  Investor Letters
                </div>
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/25 p-5 text-sm text-slate-300">
                  Subscription Documents
                </div>
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/25 p-5 text-sm text-slate-300">
                  Financial Statements
                </div>
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/25 p-5 text-sm text-slate-300">
                  Legal / Organizational Docs
                </div>
              </div>
            </section>

            <section className="xl:col-span-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="text-xl font-semibold">Recent Activity</h2>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                  Subscription submitted
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                  Redemption pending
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                  NAV preview recalculated
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}