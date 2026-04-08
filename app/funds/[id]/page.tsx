"use client";

/*
  ============================================================================
  FUND DETAIL PAGE
  ----------------------------------------------------------------------------
  Purpose:
  - Institutional-style dashboard for a single fund
  - Displays core fund identity, NAV preview, data stack, documents, and activity
  - Uses Artemis auth token from localStorage
  - Pulls live fund data from backend
  - Uses a simulated NAV preview snapshot for now until backend NAV wiring is complete

  Notes for future development:
  - Replace buildInitialSnapshot() with live NAV endpoint data
  - Replace handleCalculateNav() preview logic with POST /nav/strike
  - Replace placeholder stack values (Prime Broker / Custodian / Auditor) with live fields
  - Documents Vault and Recent Activity are currently UI placeholders
  ============================================================================
*/

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";



/*
  ============================================================================
  TYPES
  ============================================================================
*/

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

type ShareClass = {
  id: number;
  fund_id: number;
  class_name: string;
  management_fee: number;
  incentive_fee: number;
  hurdle_rate: number;
  high_water_mark: number;
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

/*
  ============================================================================
  FORMAT HELPERS
  ============================================================================
*/

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

/*
  ============================================================================
  NAV PREVIEW HELPERS
  ----------------------------------------------------------------------------
  Temporary simulated data layer until live NAV endpoints are wired in.
  ============================================================================
*/

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

function buildChartPath(
  points: NavPoint[],
  width: number,
  height: number,
  padding = 18
) {
  if (points.length === 0) return "";

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);

  const coords = points.map((point, i) => {
    const x = padding + i * stepX;
    const y =
      height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  return coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
}

/*
  ============================================================================
  TOOLTIP COPY
  ----------------------------------------------------------------------------
  Shared hover copy for system identifiers used across the page.
  ============================================================================
*/

const PRIMARY_ACCOUNT_TOOLTIP =
  "API Data Link. Used with your existing Brokerage Account and used for: Custodian / broker linkage, Cash + asset flows, Trade settlement, Real-world money movement. This is your bank/broker account identifier.";

const FUND_ID_TOOLTIP =
  "Fund ID, this is your internal reference number.";

/*
  ============================================================================
  PAGE COMPONENT
  ============================================================================
*/

export default function FundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showWhiteLabelModal, setShowWhiteLabelModal] = useState(false);

  const [fund, setFund] = useState<Fund | null>(null);
  const [shareClasses, setShareClasses] = useState<ShareClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [calcMessage, setCalcMessage] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [navSnapshot, setNavSnapshot] = useState<NavSnapshot | null>(null);
  const [showShareClassModal, setShowShareClassModal] = useState(false);
  const [savingShareClass, setSavingShareClass] = useState(false);
  const [portalLogoFile, setPortalLogoFile] = useState<File | null>(null);
  const [documentLogoFile, setDocumentLogoFile] = useState<File | null>(null);
  const [shareClassForm, setShareClassForm] = useState({
    class_name: "",
    management_fee: "",
    incentive_fee: "",
    hurdle_rate: "",
    high_water_mark: "",
  });

  const SHARE_CLASS_FIELD_HELP = {
    class_name:
      "The name of this share class within the fund. Example: Class A, Founder Class, or Institutional Class.",
    management_fee:
      "Annual fee charged as a percentage of assets under management. Example: 2.00% on $1,000,000 = $20,000 per year.",
    incentive_fee:
      "Performance-based fee charged on profits, usually above certain conditions. Example: 20% of a $100,000 profit = $20,000.",
    hurdle_rate:
      "Minimum return required before performance fees apply. This is typically the Risk Free ROR. Example: with a 5.00% hurdle, the fund must exceed 5.00% before performance fees begin.",
    high_water_mark:
      "The highest historical NAV previously achieved. Performance fees should only apply on gains above that prior peak.",
  };

  /*
    ==========================================================================
    LOAD FUND
    ==========================================================================
  */
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

        // ---------- LOAD SHARE CLASSES ----------
        const scRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/share-classes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (scRes.ok) {
          const scData: ShareClass[] = await scRes.json();
          setShareClasses(scData.filter((sc) => sc.fund_id === data.id));
        }
      } catch (err) {
        setPageError(err instanceof Error ? err.message : "Failed to load fund");
      } finally {
        setLoading(false);
      }
    };

    loadFund();
  }, [params.id, router]);

  /*
    ==========================================================================
    DERIVED VIEW MODELS
    ==========================================================================
  */
  const navSeries = useMemo(() => {
    if (!navSnapshot) return [];
    return buildNavSeries(navSnapshot);
  }, [navSnapshot]);

  const chartPath = useMemo(() => {
    return buildChartPath(navSeries, 520, 220);
  }, [navSeries]);

  const handleCreateShareClass = async () => {
    try {
      setSavingShareClass(true);

      const token = localStorage.getItem("artemis_token");
      if (!token || !fund) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/share-classes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fund_id: fund.id,
            class_name: shareClassForm.class_name,
            management_fee: Number(shareClassForm.management_fee),
            incentive_fee: Number(shareClassForm.incentive_fee),
            hurdle_rate: Number(shareClassForm.hurdle_rate),
            high_water_mark: Number(shareClassForm.high_water_mark),
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create share class");

      const newClass = await res.json();

      // 🔥 update UI instantly
      setShareClasses((prev) => [...prev, newClass]);

      // reset form
      setShareClassForm({
        class_name: "",
        management_fee: "",
        incentive_fee: "",
        hurdle_rate: "",
        high_water_mark: "",
      });

      // close modal
      setShowShareClassModal(false);
    } catch (err) {
      alert("Error creating share class");
    } finally {
      setSavingShareClass(false);
    }
  };

  /*
    ==========================================================================
    NAV PREVIEW ACTION
    ==========================================================================
  */
  const handleCalculateNav = async () => {
    if (!navSnapshot) return;

    setIsCalculating(true);
    setCalcMessage("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 850));

      const nextNavPerUnit = Number((navSnapshot.navPerUnit * 1.0027).toFixed(2));
      const nextNetAssets = Number(
        (navSnapshot.unitsOutstanding * nextNavPerUnit).toFixed(2)
      );
      const nextGrossAssets = Number((nextNetAssets * 1.044).toFixed(2));
      const nextPendingFlow = Math.max(
        0,
        Number((navSnapshot.pendingFlow * 0.84).toFixed(2))
      );

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

  /*
      ==========================================================================
      Delete Share Class
      ==========================================================================
    */
  const handleDeleteShareClass = async (shareClassId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this share class?"
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("artemis_token");
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/share-classes/${shareClassId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to delete share class");
      }

      setShareClasses((prev) => prev.filter((sc) => sc.id !== shareClassId));
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Error deleting share class"
      );
    }
  };

  const handleAddShareClass = async () => {
    const token = localStorage.getItem("artemis_token");
    if (!token || !fund) return;

    const class_name = prompt("Class Name (e.g. Class A)");
    if (!class_name) return;

    const management_fee = Number(prompt("Management Fee (%)", "2"));
    const incentive_fee = Number(prompt("Success Fee (%)", "20"));
    const hurdle_rate = Number(prompt("Hurdle Rate (%)", "0"));
    const high_water_mark = Number(prompt("High Water Mark (%)", "0"));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/share-classes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fund_id: fund.id,
            class_name,
            management_fee,
            incentive_fee,
            hurdle_rate,
            high_water_mark,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create share class");

      const newClass = await res.json();

      // 🔥 update UI instantly
      setShareClasses((prev) => [...prev, newClass]);

      alert("Share class created");
    } catch (err) {
      alert("Error creating share class");
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
      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.05),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.03),_transparent_22%),linear-gradient(to_bottom,_#000000,_#090909,_#141414,_#1d1d1d)]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="relative">
            <div className="pointer-events-none absolute -left-[290px] top-[8px] hidden xl:flex h-[300px] w-[300px] items-center justify-center">
              <img
                src="/artemis-transparent-logo.png"
                alt="Artemis transparent logo"
                className="h-[230px] w-auto object-contain opacity-90 drop-shadow-[0_0_18px_rgba(212,175,55,0.22)]"
              />
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-300">
                    Artemis Fund Dashboard
                  </div>

                  <div>
                    <h1 className="bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
                      {fund.name}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300">
                      High-visibility fund intelligence page with NAV monitoring,
                      operational data, and workflow controls in one institutional view.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Strategy
                      </p>
                      <p className="mt-1 font-medium text-[#F1D36B]">{fund.strategy}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Currency
                      </p>
                      <p className="mt-1 font-medium text-[#F1D36B]">{fund.base_currency}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Domicile
                      </p>
                      <p className="mt-1 font-medium text-[#F1D36B]">
                        {countryLabel(fund.domicile_country)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <p
                        className="text-[11px] uppercase tracking-[0.18em] text-slate-400 cursor-help"
                        title={FUND_ID_TOOLTIP}
                      >
                        Fund ID
                      </p>
                      <p className="mt-1 font-medium text-[#F1D36B]">{fund.fund_id || "-"}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <p
                        className="text-[11px] uppercase tracking-[0.18em] text-slate-400 cursor-help"
                        title={PRIMARY_ACCOUNT_TOOLTIP}
                      >
                        Primary Account
                      </p>
                      <p className="mt-1 font-medium text-[#F1D36B]">
                        {fund.account_number || "-"}
                      </p>
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
                    type="button"
                    className="rounded-2xl border border-[#D4AF37]/30 bg-white/[0.03] px-5 py-3 text-sm font-medium text-[#F1D36B] transition hover:bg-white/[0.06]"
                  >
                    Generate Prospect Link
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWhiteLabelModal(true)}
                    className="rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                  >
                    Upload Fund White Label Media
                  </button>

                  <button
                    onClick={handleCalculateNav}
                    disabled={isCalculating}
                    className="rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1D36B] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_25px_rgba(212,175,55,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCalculating ? "Calculating NAV..." : "Calculate NAV"}
                  </button>

                  <div className="text-right text-xs text-slate-400">
                    {calcMessage ? calcMessage : "Last computed NAV available below."}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
              <section className="xl:col-span-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#D4AF37]">Fund Overview</h2>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                    Overview
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Fund Name
                    </p>
                    <p className="mt-2 text-lg font-medium text-[#F1D36B]">{fund.name}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p
                        className="text-xs uppercase tracking-[0.18em] text-slate-400 cursor-help"
                        title={FUND_ID_TOOLTIP}
                      >
                        Fund ID
                      </p>
                      <p className="mt-1 font-medium text-[#F1D36B]">{fund.fund_id || "-"}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Strategy
                      </p>
                      <p className="mt-1 font-medium text-[#F1D36B]">{fund.strategy}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Base Currency
                      </p>
                      <p className="mt-1 font-medium text-[#F1D36B]">{fund.base_currency}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Domicile
                      </p>
                      <p className="mt-1 font-medium text-[#F1D36B]">
                        {countryLabel(fund.domicile_country)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Firm ID
                      </p>
                      <p className="mt-1 font-medium text-[#F1D36B]">{fund.firm_id}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Fund Admin
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F1D36B] to-[#B8962E] text-base font-bold text-black shadow-[0_0_14px_rgba(212,175,55,0.20)]">
                        {fund.admin_name?.[0] || "?"}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/managers/${encodeURIComponent(fund.admin_name || "")}`)
                        }
                        className="text-left text-sm font-medium text-white underline decoration-[#D4AF37]/50 underline-offset-4 hover:text-[#F1D36B]"
                      >
                        {fund.admin_name || "Unassigned"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="xl:col-span-5 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-black/40 p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#D4AF37]">NAV Preview</h2>
                    <p className="mt-1 text-sm text-slate-300">
                      Latest computed valuation and real-time preview metrics.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Last Computed NAV
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#F1D36B]">
                      {navSnapshot.navDate}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      NAV / Unit
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#F1D36B]">
                      {formatMoney(navSnapshot.navPerUnit, fund.base_currency || "USD")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Pending Flow
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#F1D36B]">
                      {formatCompactMoney(navSnapshot.pendingFlow, fund.base_currency || "USD")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Gross Assets
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#F1D36B]">
                      {formatCompactMoney(navSnapshot.grossAssets, fund.base_currency || "USD")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Net Assets
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#F1D36B]">
                      {formatCompactMoney(navSnapshot.netAssets, fund.base_currency || "USD")}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-black/35 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-[#D4AF37]">NAV Trend</p>
                    <p className="text-xs text-slate-400">Last 7 valuation points</p>
                  </div>

                  <svg viewBox="0 0 520 220" className="h-56 w-full">
                    <defs>
                      <linearGradient id="navLineGold" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stopColor="#B8962E" />
                        <stop offset="50%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#F1D36B" />
                      </linearGradient>
                    </defs>

                    <path
                      d={chartPath}
                      fill="none"
                      stroke="url(#navLineGold)"
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
                      const x =
                        padding +
                        index * ((520 - padding * 2) / Math.max(navSeries.length - 1, 1));
                      const y =
                        220 -
                        padding -
                        ((point.value - min) / range) * (220 - padding * 2);

                      return (
                        <g key={point.label}>
                          <circle cx={x} cy={y} r="5" fill="#F1D36B" />
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
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Units Outstanding
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[#F1D36B]">
                      {formatNumber(navSnapshot.unitsOutstanding)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[#F1D36B]">
                      Ready to Calculate
                    </p>
                  </div>
                </div>
              </section>

              <section className="xl:col-span-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#D4AF37]">Data Stack</h2>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                    Stack
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Prime Broker
                    </p>
                    <p className="mt-1 text-lg font-medium text-[#F1D36B]">TBD</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p
                      className="text-xs uppercase tracking-[0.18em] text-slate-400 cursor-help"
                      title={PRIMARY_ACCOUNT_TOOLTIP}
                    >
                      Primary Account
                    </p>
                    <p className="mt-1 text-lg font-medium text-[#F1D36B]">
                      {fund.account_number || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Custodian
                    </p>
                    <p className="mt-1 text-lg font-medium text-[#F1D36B]">TBD</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Auditor
                    </p>
                    <p className="mt-1 text-lg font-medium text-[#F1D36B]">TBD</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
              {/* 🔥 SHARE CLASS PREVIEW (NEW) */}
              <section className="xl:col-span-12 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#D4AF37]">
                      Share Class Preview
                    </h2>
                    <p className="mt-1 text-sm text-slate-300">
                      Manage fee structures and class terms for this fund.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowShareClassModal(true)}
                    className="rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1D36B] px-4 py-2 text-sm font-semibold text-black shadow-md hover:opacity-90"
                  >
                    Add Share Class
                  </button>
                </div>

                <div className="mt-6">
                  {shareClasses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-black/25 p-6 text-sm text-slate-400">
                      No share classes found for this fund yet.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {shareClasses.map((sc) => (
                        <div
                          key={sc.id}
                          className="rounded-2xl border border-white/10 bg-black/30 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-lg font-semibold text-white">{sc.class_name}</div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                                Share Class
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteShareClass(sc.id)}
                              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                Management Fee
                              </p>
                              <p className="mt-1 font-medium text-[#F1D36B]">
                                {sc.management_fee.toFixed(2)}%
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                Performance Fee
                              </p>
                              <p className="mt-1 font-medium text-[#F1D36B]">
                                {sc.incentive_fee.toFixed(2)}%
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                Hurdle Rate
                              </p>
                              <p className="mt-1 font-medium text-[#F1D36B]">
                                {sc.hurdle_rate.toFixed(2)}%
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                High Water Mark
                              </p>
                              <p className="mt-1 font-medium text-[#F1D36B]">
                                {sc.high_water_mark.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

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
      </div>

      {/* SHARE CLASS MODAL OVERLAY */}
      {showShareClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#D4AF37]">
                  Add Share Class
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Create a new share class for this fund.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowShareClassModal(false)}
                className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.08]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <label className="text-sm text-slate-300">Class Name</label>
                  <div className="group relative cursor-pointer">
                    <span className="rounded-full border border-[#D4AF37] px-1 text-[10px] text-[#D4AF37]">
                      i
                    </span>
                    <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-black p-2 text-xs text-white opacity-0 transition group-hover:opacity-100">
                      {SHARE_CLASS_FIELD_HELP.class_name}
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  value={shareClassForm.class_name}
                  onChange={(e) =>
                    setShareClassForm((prev) => ({
                      ...prev,
                      class_name: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="e.g. Class A"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <label className="text-sm text-slate-300">Management Fee (%)</label>
                  <div className="group relative cursor-pointer">
                    <span className="rounded-full border border-[#D4AF37] px-1 text-[10px] text-[#D4AF37]">
                      i
                    </span>
                    <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-black p-2 text-xs text-white opacity-0 transition group-hover:opacity-100">
                      {SHARE_CLASS_FIELD_HELP.management_fee}
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={shareClassForm.management_fee}
                  onChange={(e) =>
                    setShareClassForm((prev) => ({
                      ...prev,
                      management_fee: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="2.00"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <label className="text-sm text-slate-300">Performance Fee (%)</label>
                  <div className="group relative cursor-pointer">
                    <span className="rounded-full border border-[#D4AF37] px-1 text-[10px] text-[#D4AF37]">
                      i
                    </span>
                    <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-black p-2 text-xs text-white opacity-0 transition group-hover:opacity-100">
                      {SHARE_CLASS_FIELD_HELP.incentive_fee}
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={shareClassForm.incentive_fee}
                  onChange={(e) =>
                    setShareClassForm((prev) => ({
                      ...prev,
                      incentive_fee: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="20.00"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <label className="text-sm text-slate-300">Hurdle Rate (%)</label>
                  <div className="group relative cursor-pointer">
                    <span className="rounded-full border border-[#D4AF37] px-1 text-[10px] text-[#D4AF37]">
                      i
                    </span>
                    <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-black p-2 text-xs text-white opacity-0 transition group-hover:opacity-100">
                      {SHARE_CLASS_FIELD_HELP.hurdle_rate}
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={shareClassForm.hurdle_rate}
                  onChange={(e) =>
                    setShareClassForm((prev) => ({
                      ...prev,
                      hurdle_rate: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 flex items-center gap-2">
                  <label className="text-sm text-slate-300">High Water Mark</label>
                  <div className="group relative cursor-pointer">
                    <span className="rounded-full border border-[#D4AF37] px-1 text-[10px] text-[#D4AF37]">
                      i
                    </span>
                    <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 w-72 -translate-x-1/2 rounded-lg border border-white/15 bg-black p-2 text-xs text-white opacity-0 transition group-hover:opacity-100">
                      {SHARE_CLASS_FIELD_HELP.high_water_mark}
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={shareClassForm.high_water_mark}
                  onChange={(e) =>
                    setShareClassForm((prev) => ({
                      ...prev,
                      high_water_mark: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowShareClassModal(false)}
                className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateShareClass}
                className="rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1D36B] px-4 py-2"
              >
                Create Share Class
              </button>
            </div>
          </div>
        </div>
      )}
      {showWhiteLabelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black p-6 shadow-2xl">

            <h2 className="text-xl font-semibold text-[#D4AF37]">
              Upload White Label Media
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              Upload logos for client-facing portal and documents.
            </p>

            <div className="mt-6 space-y-4">

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Portal Logo (Transparent PNG)
                </label>
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  onChange={(e) => setPortalLogoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Document Logo (Statements / Letters)
                </label>
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  onChange={(e) => setDocumentLogoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-white"
                />
              </div>

            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowWhiteLabelModal(false)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  const token = localStorage.getItem("artemis_token");
                  if (!token) return;

                  const formData = new FormData();

                  if (portalLogoFile) {
                    formData.append("portal_logo", portalLogoFile);
                  }

                  if (documentLogoFile) {
                    formData.append("document_logo", documentLogoFile);
                  }

                  const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/funds/${fund.id}/upload-white-label`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                      body: formData,
                    }
                  );

                  if (!res.ok) {
                    alert("Upload failed");
                    return;
                  }

                  alert("Upload successful");
                  setShowWhiteLabelModal(false);
                }}
                className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D36B] px-4 py-2 text-sm font-semibold text-black"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );

}