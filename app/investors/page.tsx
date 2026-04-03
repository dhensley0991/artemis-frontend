"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type InvestorReportRow = {
  account_id: number;
  investor_name: string | null;
  investor_account_number: string | null;
  investor_email: string | null;
  investor_phone: string | null;
  investor_address:
    | {
        address_line_1: string | null;
        address_line_2: string | null;
        city: string | null;
        state_province: string | null;
        county: string | null;
        postal_code: string | null;
        country: string | null;
      }
    | null;
  investor_since: string | null;
  fund_name: string | null;
  fund_id: string | null;
  share_class: string | null;
  total_subscribed: number;
  opening_balance: number;
  closing_balance: number;
  current_value: number;
  units_owned: number;
  fees_paid: number;
  performance_dollar: number;
  performance_percent: number;
};

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatPercent(value: number | null | undefined) {
  return `${(value ?? 0).toFixed(2)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function buildAddress(
  address:
    | {
        address_line_1: string | null;
        address_line_2: string | null;
        city: string | null;
        state_province: string | null;
        county: string | null;
        postal_code: string | null;
        country: string | null;
      }
    | null
    | undefined
) {
  if (!address) return "-";

  const line1 = address.address_line_1 || "";
  const line2 = address.address_line_2 || "";
  const locality = [address.city, address.state_province, address.postal_code]
    .filter(Boolean)
    .join(", ");
  const country = address.country || "";

  const parts = [line1, line2, locality, country].filter(Boolean);
  return parts.length ? parts.join(" • ") : "-";
}

export default function InvestorsPage() {
  const router = useRouter();

  const [rows, setRows] = useState<InvestorReportRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<InvestorReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [fundFilter, setFundFilter] = useState("all");
  const [shareClassFilter, setShareClassFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const loadInvestorReport = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reporting/investor-accounts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Investor report request failed: ${res.status}`);
        }

        const data = await res.json();
        const safeRows = Array.isArray(data) ? data : [];

        setRows(safeRows);
        setFilteredRows(safeRows);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load investor report"
        );
      } finally {
        setLoading(false);
      }
    };

    loadInvestorReport();
  }, [router]);

  useEffect(() => {
    let next = [...rows];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      next = next.filter((row) => {
        return (
          (row.investor_name || "").toLowerCase().includes(q) ||
          (row.investor_account_number || "").toLowerCase().includes(q) ||
          (row.investor_email || "").toLowerCase().includes(q) ||
          (row.fund_name || "").toLowerCase().includes(q) ||
          (row.fund_id || "").toLowerCase().includes(q) ||
          (row.share_class || "").toLowerCase().includes(q)
        );
      });
    }

    if (fundFilter !== "all") {
      next = next.filter(
        (row) => (row.fund_name || "Unassigned") === fundFilter
      );
    }

    if (shareClassFilter !== "all") {
      next = next.filter(
        (row) => (row.share_class || "Unassigned") === shareClassFilter
      );
    }

    setFilteredRows(next);
  }, [rows, searchTerm, fundFilter, shareClassFilter]);

  const fundOptions = useMemo(() => {
    const values = Array.from(
      new Set(rows.map((row) => row.fund_name || "Unassigned"))
    );
    return values.sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const shareClassOptions = useMemo(() => {
    const values = Array.from(
      new Set(rows.map((row) => row.share_class || "Unassigned"))
    );
    return values.sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const metrics = useMemo(() => {
    const totalInvestors = filteredRows.length;
    const totalSubscribed = filteredRows.reduce(
      (sum, row) => sum + (row.total_subscribed || 0),
      0
    );
    const totalCurrentValue = filteredRows.reduce(
      (sum, row) => sum + (row.current_value || 0),
      0
    );
    const totalFees = filteredRows.reduce(
      (sum, row) => sum + (row.fees_paid || 0),
      0
    );
    const totalUnits = filteredRows.reduce(
      (sum, row) => sum + (row.units_owned || 0),
      0
    );
    const avgPerformance =
      totalInvestors > 0
        ? filteredRows.reduce(
            (sum, row) => sum + (row.performance_percent || 0),
            0
          ) / totalInvestors
        : 0;

    return {
      totalInvestors,
      totalSubscribed,
      totalCurrentValue,
      totalFees,
      totalUnits,
      avgPerformance,
    };
  }, [filteredRows]);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 28%), radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent 22%), linear-gradient(to bottom, #000000, #090909, #141414, #1d1d1d)",
      }}
    >
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <Image
                  src="/artemis-transparent-logo.png"
                  alt="Artemis NAV Technologies"
                  fill
                  className="object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.35)]"
                  priority
                />
              </div>

              <div>
                <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                  Artemis Investors Console
                </div>
                <h1 className="bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
                  Investors
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                  Investor reporting across funds, share classes, ownership,
                  capital balances, fees, and performance in one institutional
                  view.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/investors/new")}
                className="rounded-2xl bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.22)] transition hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(212,175,55,0.32)]"
              >
                Add Investor
              </button>

              <button
                onClick={() => router.push("/")}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.06]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Total Investors
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">
              {metrics.totalInvestors}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Capital Invested
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">
              {formatMoney(metrics.totalSubscribed)}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Current Value
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">
              {formatMoney(metrics.totalCurrentValue)}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Units Owned
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">
              {metrics.totalUnits.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Fees Paid
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">
              {formatMoney(metrics.totalFees)}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Avg Performance
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">
              {formatPercent(metrics.avgPerformance)}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                Search
              </label>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Investor, fund, share class, email..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                Fund
              </label>
              <select
                value={fundFilter}
                onChange={(e) => setFundFilter(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              >
                <option value="all">All Funds</option>
                {fundOptions.map((fund) => (
                  <option key={fund} value={fund}>
                    {fund}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                Share Class
              </label>
              <select
                value={shareClassFilter}
                onChange={(e) => setShareClassFilter(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              >
                <option value="all">All Share Classes</option>
                {shareClassOptions.map((shareClass) => (
                  <option key={shareClass} value={shareClass}>
                    {shareClass}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#D4AF37]">
                Investor Report
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Consolidated investor exposure and fund-level capital reporting.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
              Rows: <span className="text-[#F1D36B]">{filteredRows.length}</span>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading investor report...</p>
          ) : filteredRows.length === 0 ? (
            <p className="text-sm text-slate-400">
              No investor records found yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-left">
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Investor
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Account #
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Fund
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Fund ID
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Share Class
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Investor Since
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Email
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Phone
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Address
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Subscribed
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Opening
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Closing
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Current Value
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Units
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      Fees
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      P/L ($)
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300">
                      P/L (%)
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => {
                    const isPositive = (row.performance_dollar || 0) >= 0;

                    return (
                      <tr
                        key={row.account_id}
                        className="border-b border-white/5 transition hover:bg-white/[0.04]"
                      >
                        <td className="px-4 py-3 text-white">
                          {row.investor_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {row.investor_account_number || "-"}
                        </td>
                        <td className="px-4 py-3 text-white">
                          {row.fund_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-[#F1D36B]">
                          {row.fund_id || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {row.share_class || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatDate(row.investor_since)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {row.investor_email || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {row.investor_phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {buildAddress(row.investor_address)}
                        </td>
                        <td className="px-4 py-3 text-[#F1D36B]">
                          {formatMoney(row.total_subscribed)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatMoney(row.opening_balance)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatMoney(row.closing_balance)}
                        </td>
                        <td className="px-4 py-3 text-[#F1D36B]">
                          {formatMoney(row.current_value)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {row.units_owned.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatMoney(row.fees_paid)}
                        </td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            isPositive ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {formatMoney(row.performance_dollar)}
                        </td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            isPositive ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {formatPercent(row.performance_percent)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}